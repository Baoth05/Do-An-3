package com.ctut.wms.wmscoreservice.service;

import com.ctut.wms.wmscoreservice.entity.*;
import com.ctut.wms.wmscoreservice.repository.*;
import com.ctut.wms.wmscoreservice.support.TestFixtures;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Phiếu nhập: máy trạng thái CHO_DUYET -> DA_DUYET -> DA_NHAP_KHO, tồn kho chỉ cộng đúng 1 lần. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ImportNoteServiceTest {

    @Mock ImportNoteRepository importNoteRepository;
    @Mock ImportNoteDetailRepository importNoteDetailRepository;
    @Mock SupplierRepository supplierRepository;
    @Mock WarehouseRepository warehouseRepository;
    @Mock ShippingProviderRepository shippingProviderRepository;
    @Mock ProductRepository productRepository;
    @Mock InventoryRepository inventoryRepository;
    @Mock TheKhoRepository theKhoRepository;
    @InjectMocks ImportNoteService service;

    TestFixtures fx;
    Warehouse central;
    Product phone;
    ImportNote note;

    @BeforeEach
    void setUp() {
        TestFixtures.as("WAREHOUSE_MANAGER", 1L);
        fx = new TestFixtures(warehouseRepository, productRepository, inventoryRepository);
        central = fx.warehouse(100, "KHO_TONG", null);
        phone = fx.product(10, 1_000_000, 800_000.0);
        fx.stock(phone, central, 5, 5);

        note = new ImportNote();
        note.setId(1L);
        note.setMaPhieuNhap("PN-TEST");
        note.setKhoHang(central);
        note.setTrangThai("CHO_DUYET");

        ImportNoteDetail d = new ImportNoteDetail();
        d.setPhieuNhap(note);
        d.setSanPham(phone);
        d.setSoLuong(20);
        d.setGiaNhap(BigDecimal.valueOf(800_000));

        when(importNoteRepository.findById(1L)).thenReturn(Optional.of(note));
        when(importNoteRepository.save(any(ImportNote.class))).thenAnswer(i -> i.getArgument(0));
        when(importNoteDetailRepository.findByPhieuNhap(any())).thenReturn(List.of(d));
    }

    @AfterEach
    void tearDown() {
        TestFixtures.clearUser();
    }

    @Test
    @DisplayName("Duyệt rồi nhập kho: cộng tồn đúng 1 lần, ghi thẻ kho")
    void approveThenReceive() {
        service.updateStatus(1L, "DA_DUYET");
        assertThat(fx.stockOf(phone, central).getSoLuongThucTe()).isEqualTo(5);

        service.updateStatus(1L, "DA_NHAP_KHO");
        assertThat(fx.stockOf(phone, central).getSoLuongThucTe()).isEqualTo(25);
        assertThat(fx.stockOf(phone, central).getSoLuongKhaDung()).isEqualTo(25);
        verify(theKhoRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Lỗi cũ: DA_NHAP_KHO -> X -> DA_NHAP_KHO không còn cộng tồn lần 2")
    void cannotReceiveTwice() {
        service.updateStatus(1L, "DA_DUYET");
        service.updateStatus(1L, "DA_NHAP_KHO");
        assertThatThrownBy(() -> service.updateStatus(1L, "DA_DUYET")).hasMessageContaining("Không thể chuyển");
        assertThatThrownBy(() -> service.updateStatus(1L, "DA_NHAP_KHO")).hasMessageContaining("Không thể chuyển");
        assertThat(fx.stockOf(phone, central).getSoLuongThucTe()).isEqualTo(25);
    }

    @Test
    @DisplayName("Không nhập kho khi phiếu chưa được duyệt")
    void cannotReceiveBeforeApproval() {
        assertThatThrownBy(() -> service.updateStatus(1L, "DA_NHAP_KHO")).hasMessageContaining("Không thể chuyển");
        assertThat(fx.stockOf(phone, central).getSoLuongThucTe()).isEqualTo(5);
    }

    @ParameterizedTest(name = "{0} -> {1} : {2}")
    @CsvSource({
            "CHO_DUYET, DA_DUYET, true",
            "CHO_DUYET, TU_CHOI, true",
            "CHO_DUYET, DA_NHAP_KHO, false",
            "DA_DUYET, DA_NHAP_KHO, true",
            "DA_DUYET, TU_CHOI, true",
            "DA_NHAP_KHO, TU_CHOI, false",
            "TU_CHOI, DA_DUYET, false",
            "CHỜ DUYỆT, ĐÃ DUYỆT, true",
    })
    @DisplayName("Bảng chuyển trạng thái phiếu nhập")
    void transitionTable(String from, String to, boolean allowed) {
        assertThat(NoteStatus.canImportTransition(from, to)).isEqualTo(allowed);
    }
}
