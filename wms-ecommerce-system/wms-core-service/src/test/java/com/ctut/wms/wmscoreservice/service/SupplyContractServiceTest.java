package com.ctut.wms.wmscoreservice.service;

import com.ctut.wms.wmscoreservice.dto.contract.SupplyContractDtos.*;
import com.ctut.wms.wmscoreservice.entity.*;
import com.ctut.wms.wmscoreservice.repository.*;
import com.ctut.wms.wmscoreservice.security.ForbiddenException;
import com.ctut.wms.wmscoreservice.support.TestFixtures;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Hợp đồng cung ứng 6 bước: kiểm tra đúng người - đúng bước, và hàng được CHUYỂN THẬT
 * từ Kho Tổng sang kho cửa hàng (trừ một đầu, cộng một đầu).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SupplyContractServiceTest {

    @Mock SupplyContractRepository contractRepository;
    @Mock WarehouseRepository warehouseRepository;
    @Mock ProductRepository productRepository;
    @Mock InventoryRepository inventoryRepository;
    @Mock TheKhoRepository theKhoRepository;
    @Mock ExportNoteRepository exportNoteRepository;
    @Mock ExportNoteDetailRepository exportNoteDetailRepository;
    @Mock ShippingProviderRepository shippingProviderRepository;
    @InjectMocks SupplyContractService service;

    static final long OWNER = 50L;
    TestFixtures fx;
    Warehouse central;
    Warehouse store;
    Product phone;
    final Map<Long, SupplyContract> contracts = new HashMap<>();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "signPin", "123456");
        fx = new TestFixtures(warehouseRepository, productRepository, inventoryRepository);
        central = fx.warehouse(100, "KHO_TONG", null);
        store = fx.warehouse(200, "KHO_CUA_HANG", OWNER);
        phone = fx.product(10, 1_000_000, null); // chưa có giá nhập => giá sỉ = 90% giá niêm yết
        fx.stock(phone, central, 20, 20);

        AtomicLong ids = new AtomicLong(1);
        when(contractRepository.save(any(SupplyContract.class))).thenAnswer(i -> {
            SupplyContract c = i.getArgument(0);
            if (c.getId() == null) c.setId(ids.getAndIncrement());
            contracts.put(c.getId(), c);
            return c;
        });
        when(contractRepository.findById(anyLong())).thenAnswer(i -> Optional.ofNullable(contracts.get(i.<Long>getArgument(0))));
        when(exportNoteRepository.save(any(ExportNote.class))).thenAnswer(i -> {
            ExportNote n = i.getArgument(0);
            n.setId(999L);
            return n;
        });
        when(shippingProviderRepository.findAll()).thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        TestFixtures.clearUser();
    }

    private ContractResponse request(int qty) {
        TestFixtures.as("STORE_OWNER", OWNER);
        ItemRequest item = new ItemRequest();
        item.setSanPhamId(phone.getId());
        item.setSoLuong(qty);
        CreateRequest req = new CreateRequest();
        req.setStoreId(store.getId());
        req.setDanhSachHang(List.of(item));
        return service.create(req);
    }

    private SignRequest signature(String pin) {
        SignRequest s = new SignRequest();
        s.setSignerName("Trần Minh Quân");
        s.setSignaturePin(pin);
        s.setAgreedTerms(true);
        return s;
    }

    @Test
    @DisplayName("Luồng đủ 7 bước: Admin duyệt -> Shop ký -> Chuyển kho -> Thủ kho duyệt -> NV xuất -> Shop nhận hàng")
    void fullFlowMovesStock() {
        ContractResponse c = request(5);
        assertThat(c.getTrangThai()).isEqualTo("CHO_ADMIN_DUYET");
        assertThat(c.getTongTien()).isEqualByComparingTo(BigDecimal.valueOf(4_500_000)); // 5 x 900.000
        Long id = c.getId();

        TestFixtures.as("ADMIN", 1L);
        assertThat(service.approveRequest(id, null).getTrangThai()).isEqualTo("CHO_SHOP_KY");

        TestFixtures.as("STORE_OWNER", OWNER);
        ContractResponse signed = service.sign(id, signature("123456"));
        assertThat(signed.getTrangThai()).isEqualTo("DA_KY_CHO_DUYET_KHO");
        assertThat(signed.getChuKyShop().getMaChuKySo()).startsWith("DS-SHA256-");

        TestFixtures.as("ADMIN", 1L);
        assertThat(service.approveTransfer(id, null).getTrangThai()).isEqualTo("CHUYEN_QUA_KHO");

        TestFixtures.as("WAREHOUSE_MANAGER", 3L);
        assertThat(service.warehouseManagerApprove(id, null).getTrangThai()).isEqualTo("THU_KHO_DA_DUYET");

        TestFixtures.as("WAREHOUSE_STAFF", 2L);
        ContractResponse dispatched = service.dispatch(id, "GHTK");
        assertThat(dispatched.getTrangThai()).isEqualTo("DANG_GIAO_HANG");
        assertThat(fx.stockOf(phone, central).getSoLuongThucTe()).isEqualTo(15);
        assertThat(fx.stockOf(phone, central).getSoLuongKhaDung()).isEqualTo(15);
        assertThat(fx.stockOf(phone, store)).isNull(); // hàng đang trên đường, chưa vào kho shop
        verify(exportNoteRepository).save(argThat(n -> "HOÀN THÀNH".equals(n.getTrangThai())));

        TestFixtures.as("STORE_OWNER", OWNER);
        ContractResponse done = service.complete(id);
        assertThat(done.getTrangThai()).isEqualTo("HOAN_THANH");
        Inventory shopStock = fx.stockOf(phone, store);
        assertThat(shopStock.getSoLuongThucTe()).isEqualTo(5);
        assertThat(shopStock.getSoLuongKhaDung()).isEqualTo(5);
        assertThat(shopStock.getDangBan()).isFalse();
        verify(theKhoRepository, times(2)).save(any()); // XUẤT CUNG ỨNG + NHẬP TỪ KHO TỔNG
    }

    @Test
    @DisplayName("Chủ shop khác không lập hợp đồng cho gian hàng không phải của mình")
    void otherSellerCannotCreate() {
        TestFixtures.as("STORE_OWNER", 51L);
        CreateRequest req = new CreateRequest();
        req.setStoreId(store.getId());
        ItemRequest item = new ItemRequest();
        item.setSanPhamId(phone.getId());
        item.setSoLuong(1);
        req.setDanhSachHang(List.of(item));
        assertThatThrownBy(() -> service.create(req)).isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("Không yêu cầu vượt tồn khả dụng của Kho Tổng")
    void cannotRequestMoreThanCentralStock() {
        assertThatThrownBy(() -> request(21)).hasMessageContaining("chỉ còn 20");
    }

    @Test
    @DisplayName("Chủ shop không tự duyệt hợp đồng")
    void sellerCannotApprove() {
        Long id = request(1).getId();
        assertThatThrownBy(() -> service.approveRequest(id, null)).isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("Không ký khi Admin chưa duyệt vòng 1; ký sai PIN bị từ chối")
    void signRules() {
        Long id = request(1).getId();
        assertThatThrownBy(() -> service.sign(id, signature("123456"))).hasMessageContaining("CHO_ADMIN_DUYET");

        TestFixtures.as("ADMIN", 1L);
        service.approveRequest(id, null);
        TestFixtures.as("STORE_OWNER", OWNER);
        assertThatThrownBy(() -> service.sign(id, signature("000000"))).hasMessageContaining("PIN");
    }

    @Test
    @DisplayName("Kho Tổng không đủ hàng lúc xuất: không trừ tồn, báo lỗi")
    void dispatchFailsWhenCentralStockShort() {
        Long id = request(5).getId();
        TestFixtures.as("ADMIN", 1L);
        service.approveRequest(id, null);
        TestFixtures.as("STORE_OWNER", OWNER);
        service.sign(id, signature("123456"));
        TestFixtures.as("ADMIN", 1L);
        service.approveTransfer(id, null);
        TestFixtures.as("WAREHOUSE_MANAGER", 3L);
        service.warehouseManagerApprove(id, null);

        fx.stockOf(phone, central).setSoLuongKhaDung(3); // hàng đã bị giữ cho việc khác
        TestFixtures.as("WAREHOUSE_STAFF", 2L);
        assertThatThrownBy(() -> service.dispatch(id, null)).hasMessageContaining("không đủ hàng");
        assertThat(fx.stockOf(phone, central).getSoLuongThucTe()).isEqualTo(20);
    }

    @Test
    @DisplayName("Chủ shop chỉ rút được yêu cầu trước khi ký; đã giao hàng thì không ai từ chối được")
    void rejectRules() {
        Long id = request(1).getId();
        assertThat(service.reject(id, "Đổi ý").getTrangThai()).isEqualTo("TU_CHOI");

        Long id2 = request(1).getId();
        TestFixtures.as("ADMIN", 1L);
        service.approveRequest(id2, null);
        TestFixtures.as("STORE_OWNER", OWNER);
        service.sign(id2, signature("123456"));
        assertThatThrownBy(() -> service.reject(id2, "x")).hasMessageContaining("Không thể từ chối");
    }

    @Test
    @DisplayName("Nhân viên kho không duyệt thay Thủ kho và không thể lên đơn xuất trước khi Thủ kho duyệt")
    void staffCannotApproveOrDispatchBeforeManager() {
        Long id = request(2).getId();
        TestFixtures.as("ADMIN", 1L);
        service.approveRequest(id, null);
        TestFixtures.as("STORE_OWNER", OWNER);
        service.sign(id, signature("123456"));
        TestFixtures.as("ADMIN", 1L);
        service.approveTransfer(id, null);

        TestFixtures.as("WAREHOUSE_STAFF", 2L);
        assertThatThrownBy(() -> service.warehouseManagerApprove(id, null)).isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> service.dispatch(id, null)).hasMessageContaining("CHUYEN_QUA_KHO");
    }

    @Test
    @DisplayName("Nhân viên kho không ký thay cửa hàng và không xác nhận nhận hàng")
    void warehouseCannotActForStore() {
        Long id = request(1).getId();
        TestFixtures.as("ADMIN", 1L);
        service.approveRequest(id, null);
        TestFixtures.as("WAREHOUSE_STAFF", 2L);
        assertThatThrownBy(() -> service.sign(id, signature("123456"))).isInstanceOf(ForbiddenException.class);
    }
}
