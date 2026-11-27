package com.ctut.wms.wmscoreservice.service;

import com.ctut.wms.wmscoreservice.dto.exportnote.ExportNoteDetailRequest;
import com.ctut.wms.wmscoreservice.dto.exportnote.ExportNoteRequest;
import com.ctut.wms.wmscoreservice.dto.exportnote.ExportNoteResponse;
import com.ctut.wms.wmscoreservice.entity.*;
import com.ctut.wms.wmscoreservice.repository.*;
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

import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Phiếu xuất kho: giữ chỗ tồn khả dụng khi lập phiếu, chỉ trừ hàng thực tế khi xuất,
 * trả lại tồn khi hủy, không cho nhảy cóc trạng thái.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ExportNoteServiceTest {

    @Mock ExportNoteRepository exportNoteRepository;
    @Mock ExportNoteDetailRepository exportNoteDetailRepository;
    @Mock ShippingProviderRepository shippingProviderRepository;
    @Mock WarehouseRepository warehouseRepository;
    @Mock ProductRepository productRepository;
    @Mock InventoryRepository inventoryRepository;
    @Mock TheKhoRepository theKhoRepository;
    @InjectMocks ExportNoteService service;

    TestFixtures fx;
    Warehouse shop;
    Product phone;
    final Map<Long, ExportNote> notes = new HashMap<>();
    final List<ExportNoteDetail> details = new ArrayList<>();

    @BeforeEach
    void setUp() {
        TestFixtures.as("WAREHOUSE_MANAGER", 1L);
        fx = new TestFixtures(warehouseRepository, productRepository, inventoryRepository);
        shop = fx.warehouse(200, "KHO_CUA_HANG", 50L);
        phone = fx.product(10, 1_000_000, null);
        fx.stock(phone, shop, 10, 10);

        when(shippingProviderRepository.findById(anyLong())).thenReturn(Optional.of(new ShippingProvider()));
        AtomicLong ids = new AtomicLong(1);
        when(exportNoteRepository.save(any(ExportNote.class))).thenAnswer(i -> {
            ExportNote n = i.getArgument(0);
            if (n.getId() == null) n.setId(ids.getAndIncrement());
            notes.put(n.getId(), n);
            return n;
        });
        when(exportNoteRepository.findById(anyLong())).thenAnswer(i -> Optional.ofNullable(notes.get(i.<Long>getArgument(0))));
        when(exportNoteRepository.findByDonHangId(anyString())).thenAnswer(i -> notes.values().stream()
                .filter(n -> i.getArgument(0).equals(n.getDonHangId())).toList());
        when(exportNoteDetailRepository.save(any(ExportNoteDetail.class))).thenAnswer(i -> {
            ExportNoteDetail d = i.getArgument(0);
            details.add(d);
            return d;
        });
        when(exportNoteDetailRepository.findByPhieuXuat(any(ExportNote.class))).thenAnswer(i -> details.stream()
                .filter(d -> d.getPhieuXuat() == i.getArgument(0)).toList());
    }

    @AfterEach
    void tearDown() {
        TestFixtures.clearUser();
    }

    private ExportNoteResponse createNote(String orderCode, int qty, Double price) {
        ExportNoteDetailRequest line = new ExportNoteDetailRequest();
        line.setSanPhamId(phone.getId());
        line.setSoLuong(qty);
        line.setDonGia(price);
        ExportNoteRequest req = new ExportNoteRequest();
        req.setDonHangId(orderCode);
        req.setKhoHangId(shop.getId());
        req.setDonViVanChuyenId(1L);
        req.setDanhSachHangHoa(List.of(line));
        return service.createExportNote(req);
    }

    private Inventory inv() {
        return fx.stockOf(phone, shop);
    }

    @Test
    @DisplayName("Lập phiếu: giữ chỗ tồn khả dụng, chưa trừ hàng thực tế")
    void createReservesAvailableStock() {
        ExportNoteResponse res = createNote("DH-1", 3, 950_000.0);

        assertThat(res.getTrangThai()).isEqualTo("CHỜ DUYỆT");
        assertThat(inv().getSoLuongKhaDung()).isEqualTo(7);
        assertThat(inv().getSoLuongThucTe()).isEqualTo(10);
        assertThat(res.getTongGiaTri()).isEqualTo(2_850_000.0); // dùng đơn giá thực tế của đơn hàng
    }

    @Test
    @DisplayName("Không lập phiếu vượt tồn khả dụng (chống bán vượt tồn)")
    void cannotOverReserve() {
        createNote("DH-1", 8, null);
        assertThatThrownBy(() -> createNote("DH-2", 3, null)).hasMessageContaining("chỉ còn: 2");
    }

    @Test
    @DisplayName("Số lượng xuất âm bị từ chối")
    void negativeQuantityRejected() {
        assertThatThrownBy(() -> createNote("DH-1", -5, null)).hasMessageContaining("lớn hơn 0");
        assertThat(inv().getSoLuongKhaDung()).isEqualTo(10);
    }

    @Test
    @DisplayName("Duyệt rồi xuất thực tế: trừ hàng trên kệ, cộng 'đã bán', ghi thẻ kho")
    void approveThenConfirm() {
        Long id = createNote("DH-1", 3, null).getId();
        service.approveExportNote(id);
        ExportNoteResponse res = service.confirmActualExport(id);

        assertThat(res.getTrangThai()).isEqualTo("HOÀN THÀNH");
        assertThat(inv().getSoLuongThucTe()).isEqualTo(7);
        assertThat(inv().getSoLuongKhaDung()).isEqualTo(7); // đã trừ lúc giữ chỗ, không trừ lần 2
        assertThat(inv().getSoLuongDaBan()).isEqualTo(3);
        verify(theKhoRepository).save(argThat(tk -> tk.getSoLuongTruocBienDong() == 10 && tk.getSoLuongSauBienDong() == 7));
    }

    @Test
    @DisplayName("Không xuất thực tế khi phiếu chưa được duyệt")
    void cannotConfirmBeforeApproval() {
        Long id = createNote("DH-1", 3, null).getId();
        assertThatThrownBy(() -> service.confirmActualExport(id)).hasMessageContaining("CHỜ XUẤT KHO");
    }

    @Test
    @DisplayName("Không dùng /status để nhảy cóc sang HOÀN THÀNH")
    void cannotJumpToCompletedViaStatus() {
        Long id = createNote("DH-1", 3, null).getId();
        assertThatThrownBy(() -> service.updateStatus(id, "HOÀN THÀNH")).hasMessageContaining("Duyệt");
        assertThatThrownBy(() -> service.updateStatus(id, "CHỜ XUẤT KHO")).hasMessageContaining("Duyệt");
    }

    @Test
    @DisplayName("Từ chối phiếu: trả lại tồn khả dụng đã giữ chỗ")
    void rejectReleasesReservation() {
        Long id = createNote("DH-1", 4, null).getId();
        service.updateStatus(id, "TỪ CHỐI");
        assertThat(inv().getSoLuongKhaDung()).isEqualTo(10);
        assertThat(notes.get(id).getTrangThai()).isEqualTo("TỪ CHỐI");
    }

    @Test
    @DisplayName("Không chuyển sang trạng thái giao vận khi chưa xuất kho")
    void noShippingStatusBeforeExport() {
        Long id = createNote("DH-1", 1, null).getId();
        assertThatThrownBy(() -> service.updateStatus(id, "DANG_GIAO")).hasMessageContaining("chưa xuất kho");
    }

    @Test
    @DisplayName("Hủy theo đơn hàng: nhả tồn; nếu đã xuất kho thì từ chối")
    void cancelByOrder() {
        createNote("DH-1", 2, null);
        assertThat(service.cancelByOrder("DH-1")).isEqualTo(1);
        assertThat(inv().getSoLuongKhaDung()).isEqualTo(10);

        Long shippedId = createNote("DH-2", 2, null).getId();
        service.approveExportNote(shippedId);
        service.confirmActualExport(shippedId);
        assertThatThrownBy(() -> service.cancelByOrder("DH-2")).hasMessageContaining("đã được xuất kho");
    }

    @Test
    @DisplayName("Phiếu cũ (chưa giữ chỗ) khi xuất thực tế trừ cả tồn khả dụng")
    void legacyNoteDeductsAvailableOnConfirm() {
        Long id = createNote(null, 2, null).getId();
        // Giả lập phiếu lập trước khi có cơ chế giữ chỗ
        notes.get(id).setDaGiuCho(null);
        inv().setSoLuongKhaDung(10);
        service.approveExportNote(id);
        service.confirmActualExport(id);
        assertThat(inv().getSoLuongKhaDung()).isEqualTo(8);
        assertThat(inv().getSoLuongThucTe()).isEqualTo(8);
        assertThat(inv().getSoLuongDaBan()).isZero(); // không phải đơn bán hàng
    }

    @Test
    @DisplayName("Đồng bộ order-service: chỉ trả shipped=true sau khi Thủ kho duyệt và xuất thực tế (HOÀN THÀNH)")
    void syncStatusRequiresActualExport() {
        assertThat((Boolean) service.getOrderExportSyncStatus("DH-NONE").get("shipped")).isFalse();

        Long id = createNote("DH-SYNC", 2, null).getId();
        assertThat((Boolean) service.getOrderExportSyncStatus("DH-SYNC").get("shipped")).isFalse();

        service.approveExportNote(id);
        assertThat((Boolean) service.getOrderExportSyncStatus("DH-SYNC").get("shipped")).isFalse();

        service.confirmActualExport(id);
        Map<String, Object> synced = service.getOrderExportSyncStatus("DH-SYNC");
        assertThat((Boolean) synced.get("shipped")).isTrue();
        assertThat(synced.get("status")).isEqualTo("HOÀN THÀNH");
    }
}
