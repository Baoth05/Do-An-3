package com.ctut.wms.wmscoreservice.service;

import com.ctut.wms.wmscoreservice.dto.InventoryRequest;
import com.ctut.wms.wmscoreservice.dto.InventoryResponse;
import com.ctut.wms.wmscoreservice.entity.Inventory;
import com.ctut.wms.wmscoreservice.entity.Product;
import com.ctut.wms.wmscoreservice.entity.Warehouse;
import com.ctut.wms.wmscoreservice.repository.InventoryRepository;
import com.ctut.wms.wmscoreservice.repository.ProductRepository;
import com.ctut.wms.wmscoreservice.repository.TheKhoRepository;
import com.ctut.wms.wmscoreservice.repository.WarehouseRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;

/**
 * Kiểm thử nghiệp vụ điều chỉnh kiểm kê nội bộ (POST /inventory/add -> NHẬP BỔ SUNG):
 * - Kho cửa hàng chỉ nhận hàng hóa mới qua Hợp đồng cung ứng B2B, không tự tạo SKU mới qua /inventory/add.
 * - Cho phép điều chỉnh tăng sau kiểm kê thừa (KIEM_KE_THUA) hoặc hoàn trả nguyên vẹn (HOAN_TRA_NGUYEN_VEN).
 * - Tách biệt hoàn toàn với luồng nhập thương mại từ Nhà cung cấp.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryServiceTest {

    @Mock InventoryRepository inventoryRepository;
    @Mock ProductRepository productRepository;
    @Mock WarehouseRepository warehouseRepository;
    @Mock TheKhoRepository theKhoRepository;
    @InjectMocks InventoryService service;

    static final long OWNER = 50L;
    TestFixtures fx;
    Warehouse central;
    Warehouse store;
    Product laptop;
    Product mouse;

    @BeforeEach
    void setUp() {
        fx = new TestFixtures(warehouseRepository, productRepository, inventoryRepository);
        central = fx.warehouse(100, "KHO_TONG", null);
        store = fx.warehouse(200, "KHO_CUA_HANG", OWNER);
        laptop = fx.product(10, 20_000_000, 18_000_000.0);
        mouse = fx.product(11, 500_000, 350_000.0);
    }

    @AfterEach
    void tearDown() {
        TestFixtures.clearUser();
    }

    @Test
    @DisplayName("Kho cửa hàng không thể tự thêm mặt hàng mới chưa từng nhập qua Hợp đồng B2B")
    void storeCannotAddBrandNewProductViaAuditEndpoint() {
        TestFixtures.as("STORE_OWNER", OWNER);
        InventoryRequest req = InventoryRequest.builder()
                .sanPhamId(laptop.getId())
                .khoHangId(store.getId())
                .soLuong(5)
                .loaiDieuChinh(InventoryService.ADJ_KIEM_KE_THUA)
                .build();

        assertThatThrownBy(() -> service.addStock(req))
                .hasMessageContaining("Hợp đồng cung ứng B2B");
    }

    @Test
    @DisplayName("Kho cửa hàng được điều chỉnh tăng kiểm kê hoặc hoàn trả với mặt hàng đã có trong kho")
    void storeCanAdjustExistingProductForAuditOrReturn() {
        fx.stock(mouse, store, 10, 10);
        TestFixtures.as("STORE_OWNER", OWNER);

        InventoryRequest req = InventoryRequest.builder()
                .sanPhamId(mouse.getId())
                .khoHangId(store.getId())
                .soLuong(3)
                .loaiDieuChinh(InventoryService.ADJ_HOAN_TRA_NGUYEN_VEN)
                .build();

        InventoryResponse res = service.addStock(req);
        assertThat(res.getSoLuongThucTe()).isEqualTo(13);
        assertThat(res.getSoLuongKhaDung()).isEqualTo(13);
        verify(theKhoRepository).save(argThat(tk ->
                "NHẬP BỔ SUNG".equals(tk.getLoaiGiaoDich())
                        && tk.getMaChungTu().startsWith("HT-")
                        && tk.getSoLuongBienDong() == 3
                        && tk.getSoLuongSauBienDong() == 13
        ));
    }

    @Test
    @DisplayName("Từ chối loại giao dịch nhập thương mại NCC trên endpoint điều chỉnh kiểm kê")
    void rejectsCommercialSupplierImportType() {
        fx.stock(laptop, central, 10, 10);
        TestFixtures.as("WAREHOUSE_MANAGER", 2L);

        InventoryRequest req = InventoryRequest.builder()
                .sanPhamId(laptop.getId())
                .khoHangId(central.getId())
                .soLuong(5)
                .loaiDieuChinh("NHAP_NCC")
                .build();

        assertThatThrownBy(() -> service.addStock(req))
                .hasMessageContaining("Phiếu Nhập Kho");
    }

    @Test
    @DisplayName("Kho Tổng điều chỉnh tăng kiểm kê thừa ghi mã chứng từ KK- và loại NHẬP BỔ SUNG")
    void centralAuditSurplusGeneratesKkVoucher() {
        fx.stock(laptop, central, 15, 15);
        TestFixtures.as("WAREHOUSE_MANAGER", 2L);

        InventoryRequest req = InventoryRequest.builder()
                .sanPhamId(laptop.getId())
                .khoHangId(central.getId())
                .soLuong(2)
                .build();

        InventoryResponse res = service.addStock(req);
        assertThat(res.getSoLuongThucTe()).isEqualTo(17);
        verify(theKhoRepository).save(argThat(tk ->
                "NHẬP BỔ SUNG".equals(tk.getLoaiGiaoDich())
                        && tk.getMaChungTu().startsWith("KK-")
                        && tk.getSoLuongSauBienDong() == 17
        ));
    }

    @Test
    @DisplayName("Chủ shop cập nhật nhiều hình ảnh, ảnh đại diện và mô tả riêng khi thiết lập đăng bán")
    void sellerCanPublishWithMultipleImagesAndCustomDescription() {
        Inventory inv = fx.stock(laptop, store, 8, 8);
        org.mockito.Mockito.when(inventoryRepository.findById(inv.getId())).thenReturn(java.util.Optional.of(inv));
        TestFixtures.as("STORE_OWNER", OWNER);

        InventoryResponse res = service.publishToMarketplace(
                inv.getId(),
                true,
                java.math.BigDecimal.valueOf(21_500_000),
                3,
                "https://cdn.example.com/cover.jpg",
                java.util.List.of("https://cdn.example.com/cover.jpg", "https://cdn.example.com/angle2.jpg", "https://cdn.example.com/cover.jpg"),
                "Tặng kèm balo & chuột không dây",
                "CPU: Intel Core Ultra 7\nRAM: 16GB"
        );

        assertThat(res.getDangBan()).isTrue();
        assertThat(res.getGiaBanHienTai()).isEqualByComparingTo("21500000");
        assertThat(res.getHinhAnh()).isEqualTo("https://cdn.example.com/cover.jpg");
        assertThat(res.getDanhSachHinhAnh()).containsExactly(
                "https://cdn.example.com/cover.jpg",
                "https://cdn.example.com/angle2.jpg"
        );
        assertThat(res.getMoTa()).isEqualTo("Tặng kèm balo & chuột không dây");
        assertThat(res.getThongSoKyThuat()).contains("Intel Core Ultra 7");
    }
}
