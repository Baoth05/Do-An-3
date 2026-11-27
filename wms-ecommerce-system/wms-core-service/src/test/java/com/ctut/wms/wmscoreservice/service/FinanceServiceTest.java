package com.ctut.wms.wmscoreservice.service;

import com.ctut.wms.wmscoreservice.entity.*;
import com.ctut.wms.wmscoreservice.repository.ExportNoteDetailRepository;
import com.ctut.wms.wmscoreservice.repository.ExportNoteRepository;
import com.ctut.wms.wmscoreservice.repository.ImportNoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Kiểm thử tách biệt 2 luồng tiền trong báo cáo tài chính Admin:
 * - Doanh thu trực tiếp Sàn/Kho Tổng: chỉ tính từ phiếu xuất cung ứng B2B (giá sỉ) đã hoàn thành.
 * - GMV các Shop: tính riêng từ phiếu xuất bán lẻ cho khách cuối (làm cơ sở đối soát, không cộng trùng).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FinanceServiceTest {

    @Mock ImportNoteRepository importNoteRepository;
    @Mock ExportNoteRepository exportNoteRepository;
    @Mock ExportNoteDetailRepository exportNoteDetailRepository;
    @InjectMocks FinanceService financeService;

    Warehouse central;
    Warehouse store;
    Product laptop;
    ImportNote nccImport;
    ExportNote b2bSupplyExport;
    ExportNote retailSaleExport;
    ExportNote pendingExport;

    @BeforeEach
    void setUp() {
        central = Warehouse.builder().id(1L).maKho("KHO-TONG").tenKho("Kho Tổng").loaiHinh("KHO_TONG").build();
        store = Warehouse.builder().id(2L).maKho("STORE-A").tenKho("Shop A").loaiHinh("KHO_CUA_HANG").build();
        laptop = Product.builder().id(10L).sku("LAP-10").tenSanPham("Laptop Gaming").giaBan(12_000_000.0).build();

        LocalDateTime now = LocalDateTime.now();

        nccImport = new ImportNote();
        nccImport.setId(1L);
        nccImport.setMaPhieuNhap("PN-001");
        nccImport.setTrangThai("DA_NHAP_KHO");
        nccImport.setTongTienNhap(BigDecimal.valueOf(8_000_000));
        nccImport.setNgayNhap(now);

        // Luồng 1: Kho Tổng xuất cung ứng B2B giá sỉ (10tr) cho Shop A
        b2bSupplyExport = new ExportNote();
        b2bSupplyExport.setId(101L);
        b2bSupplyExport.setMaPhieuXuat("PX-HD-001");
        b2bSupplyExport.setLoaiXuat("XUAT_CUNG_UNG_CUA_HANG");
        b2bSupplyExport.setKhoHang(central);
        b2bSupplyExport.setKhoNhan(store);
        b2bSupplyExport.setTenShop("Shop A");
        b2bSupplyExport.setTrangThai(NoteStatus.XUAT_HOAN_THANH);
        b2bSupplyExport.setNgayXuat(now);

        ExportNoteDetail b2bDetail = new ExportNoteDetail();
        b2bDetail.setPhieuXuat(b2bSupplyExport);
        b2bDetail.setSanPham(laptop);
        b2bDetail.setSoLuong(1);
        b2bDetail.setDonGia(10_000_000.0);

        // Luồng 2: Shop A bán lẻ cho khách cuối (12tr - GMV Shop)
        retailSaleExport = new ExportNote();
        retailSaleExport.setId(102L);
        retailSaleExport.setMaPhieuXuat("PX-002");
        retailSaleExport.setLoaiXuat("XUAT_BAN_LE_SAN_TMDT");
        retailSaleExport.setDonHangId("DH-10001");
        retailSaleExport.setKhoHang(store);
        retailSaleExport.setTenShop("Shop A");
        retailSaleExport.setTrangThai(NoteStatus.XUAT_HOAN_THANH);
        retailSaleExport.setNgayXuat(now);

        ExportNoteDetail retailDetail = new ExportNoteDetail();
        retailDetail.setPhieuXuat(retailSaleExport);
        retailDetail.setSanPham(laptop);
        retailDetail.setSoLuong(1);
        retailDetail.setDonGia(12_000_000.0);

        // Phiếu chưa xuất (chờ duyệt) - không được tính vào cả 2 luồng
        pendingExport = new ExportNote();
        pendingExport.setId(103L);
        pendingExport.setMaPhieuXuat("PX-003");
        pendingExport.setTrangThai(NoteStatus.XUAT_CHO_DUYET);

        when(importNoteRepository.findAll()).thenReturn(List.of(nccImport));
        when(exportNoteRepository.findAll()).thenReturn(List.of(b2bSupplyExport, retailSaleExport, pendingExport));
        when(exportNoteDetailRepository.findByPhieuXuat(b2bSupplyExport)).thenReturn(List.of(b2bDetail));
        when(exportNoteDetailRepository.findByPhieuXuat(retailSaleExport)).thenReturn(List.of(retailDetail));
    }

    @Test
    @DisplayName("Tách biệt doanh thu B2B Kho Tổng (10tr) và GMV Shop (12tr), không cộng trùng 22tr")
    void separatesB2bRevenueFromRetailGmv() {
        Map<String, Object> summary = financeService.getFinancialSummary();

        assertThat((BigDecimal) summary.get("income")).isEqualByComparingTo("10000000");
        assertThat((BigDecimal) summary.get("b2bIncome")).isEqualByComparingTo("10000000");
        assertThat((BigDecimal) summary.get("retailGmv")).isEqualByComparingTo("12000000");
        assertThat((BigDecimal) summary.get("expense")).isEqualByComparingTo("8000000");
        assertThat((BigDecimal) summary.get("profit")).isEqualByComparingTo("2000000"); // 10tr - 8tr
        assertThat(summary.get("b2bExportCount")).isEqualTo(1);
        assertThat(summary.get("retailExportCount")).isEqualTo(1);
    }

    @Test
    @DisplayName("Nhật ký giao dịch gắn nhãn tách biệt IN (B2B), GMV (Shop bán lẻ) và OUT (Nhập NCC)")
    void transactionsDistinguishStreams() {
        List<Map<String, Object>> txs = financeService.getTransactions(10);

        assertThat(txs).hasSize(3);
        assertThat(txs).anySatisfy(t -> {
            assertThat(t.get("maGiaoDich")).isEqualTo("PX-HD-001");
            assertThat(t.get("type")).isEqualTo("IN");
            assertThat(t.get("flowType")).isEqualTo("B2B_SUPPLY");
        });
        assertThat(txs).anySatisfy(t -> {
            assertThat(t.get("maGiaoDich")).isEqualTo("PX-002");
            assertThat(t.get("type")).isEqualTo("GMV");
            assertThat(t.get("flowType")).isEqualTo("RETAIL_GMV");
        });
        assertThat(txs).anySatisfy(t -> {
            assertThat(t.get("maGiaoDich")).isEqualTo("PN-001");
            assertThat(t.get("type")).isEqualTo("OUT");
            assertThat(t.get("flowType")).isEqualTo("IMPORT_NCC");
        });
    }

    @Test
    @DisplayName("Báo cáo chiến lược tách tổng doanh thu B2B và tổng GMV bán lẻ của các Shop")
    void strategicReportSeparatesDirectRevenueAndGmv() {
        Map<String, Object> report = financeService.getStrategicReport();

        assertThat((Double) report.get("totalRevenue")).isEqualTo(10_000_000.0);
        assertThat((Double) report.get("shopGmv")).isEqualTo(12_000_000.0);
        assertThat(report.get("b2bOrdersCount")).isEqualTo(1);
        assertThat(report.get("retailOrdersCount")).isEqualTo(1);
    }
}
