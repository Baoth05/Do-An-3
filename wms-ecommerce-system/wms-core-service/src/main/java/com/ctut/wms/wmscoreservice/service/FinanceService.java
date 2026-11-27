package com.ctut.wms.wmscoreservice.service;

import com.ctut.wms.wmscoreservice.entity.ExportNote;
import com.ctut.wms.wmscoreservice.entity.ExportNoteDetail;
import com.ctut.wms.wmscoreservice.entity.ImportNote;
import com.ctut.wms.wmscoreservice.entity.Product;
import com.ctut.wms.wmscoreservice.repository.ExportNoteDetailRepository;
import com.ctut.wms.wmscoreservice.repository.ExportNoteRepository;
import com.ctut.wms.wmscoreservice.repository.ImportNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Báo cáo tài chính toàn hệ thống - 100% từ dữ liệu thật, phân tách rõ 2 luồng tiền để tránh trùng lặp:
 *   1. Doanh thu trực tiếp của Sàn/Kho Tổng: tổng giá trị các phiếu xuất cung ứng B2B (giá sỉ) đã xuất thực tế cho các Shop.
 *   2. Tổng giá trị giao dịch (GMV) của các Shop: tổng giá trị các phiếu xuất bán lẻ cho khách hàng cuối
 *      (doanh thu thuộc về Chủ shop, làm cơ sở đối soát — KHÔNG cộng gộp vào doanh thu trực tiếp Kho Tổng).
 *   3. CHI: phiếu nhập NCC ĐÃ NHẬP KHO.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinanceService {

    private final ImportNoteRepository importNoteRepository;
    private final ExportNoteRepository exportNoteRepository;
    private final ExportNoteDetailRepository exportNoteDetailRepository;

    private static final Locale VI = Locale.forLanguageTag("vi-VN");

    // ===================== DỮ LIỆU NGUỒN & PHÂN TÁCH 2 LUỒNG =====================

    private List<ImportNote> completedImports() {
        return importNoteRepository.findAll().stream()
                .filter(n -> NoteStatus.NHAP_DA_NHAP_KHO.equals(NoteStatus.normalizeImport(n.getTrangThai())))
                .collect(Collectors.toList());
    }

    private List<ExportNote> shippedExports() {
        return exportNoteRepository.findAll().stream()
                .filter(n -> NoteStatus.isExportShipped(n.getTrangThai()))
                .collect(Collectors.toList());
    }

    /** Phiếu xuất bán lẻ cho khách hàng cuối (thuộc GMV của Shop). */
    private boolean isRetailExport(ExportNote note) {
        if (note == null) return false;
        if (note.getDonHangId() != null && !note.getDonHangId().isBlank()) return true;
        if ("XUAT_BAN_LE_SAN_TMDT".equalsIgnoreCase(note.getLoaiXuat())) return true;
        return note.getKhoHang() != null
                && "KHO_CUA_HANG".equalsIgnoreCase(note.getKhoHang().getLoaiHinh())
                && note.getKhoNhan() == null;
    }

    /** Phiếu xuất cung ứng B2B (giá sỉ) từ Kho Tổng cho Shop (Doanh thu trực tiếp Sàn/Kho Tổng). */
    private boolean isB2bSupplyExport(ExportNote note) {
        return note != null && !isRetailExport(note);
    }

    private double exportValue(ExportNote note) {
        double total = 0.0;
        for (ExportNoteDetail d : exportNoteDetailRepository.findByPhieuXuat(note)) {
            if (d.getSoLuong() != null) {
                total += ExportNoteService.unitPriceOf(d) * d.getSoLuong();
            }
        }
        return total;
    }

    private static boolean inMonth(LocalDateTime t, int month, int year) {
        return t != null && t.getMonthValue() == month && t.getYear() == year;
    }

    private static boolean matches(LocalDateTime t, Integer month, Integer year) {
        if (month == null && year == null) return true;
        if (t == null) return false;
        return (month == null || t.getMonthValue() == month) && (year == null || t.getYear() == year);
    }

    // ===================== 1. TỔNG QUAN =====================

    /** Tổng quan thu (chỉ B2B giá sỉ) - chi (nhập NCC) - lợi nhuận Kho Tổng & GMV bán lẻ của các Shop. */
    public Map<String, Object> getFinancialSummary(Integer month, Integer year) {
        List<ImportNote> imports = completedImports().stream()
                .filter(n -> matches(n.getNgayNhap(), month, year)).collect(Collectors.toList());
        List<ExportNote> exports = shippedExports().stream()
                .filter(n -> matches(n.getNgayXuat(), month, year)).collect(Collectors.toList());

        List<ExportNote> b2bExports = exports.stream().filter(this::isB2bSupplyExport).collect(Collectors.toList());
        List<ExportNote> retailExports = exports.stream().filter(this::isRetailExport).collect(Collectors.toList());

        BigDecimal totalExpense = imports.stream()
                .map(ImportNote::getTongTienNhap).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Luồng 1: Doanh thu trực tiếp Sàn/Kho Tổng (chỉ tính phiếu xuất cung ứng B2B giá sỉ)
        BigDecimal b2bIncome = BigDecimal.valueOf(b2bExports.stream().mapToDouble(this::exportValue).sum())
                .setScale(0, RoundingMode.HALF_UP);

        // Luồng 2: GMV của các Shop (chỉ tính phiếu xuất bán lẻ cho khách cuối, dùng để đối soát)
        BigDecimal retailGmv = BigDecimal.valueOf(retailExports.stream().mapToDouble(this::exportValue).sum())
                .setScale(0, RoundingMode.HALF_UP);

        BigDecimal profit = b2bIncome.subtract(totalExpense);

        int profitMargin = 0;
        if (b2bIncome.signum() > 0) {
            profitMargin = profit.multiply(BigDecimal.valueOf(100))
                    .divide(b2bIncome, 0, RoundingMode.HALF_UP).intValue();
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("income", b2bIncome);
        summary.put("b2bIncome", b2bIncome);
        summary.put("retailGmv", retailGmv);
        summary.put("expense", totalExpense);
        summary.put("profit", profit);
        summary.put("profitMargin", profitMargin);
        summary.put("importCount", imports.size());
        summary.put("exportCount", b2bExports.size());
        summary.put("b2bExportCount", b2bExports.size());
        summary.put("retailExportCount", retailExports.size());
        return summary;
    }

    public Map<String, Object> getFinancialSummary() {
        return getFinancialSummary(null, null);
    }

    // ===================== 2. NHẬT KÝ GIAO DỊCH =====================

    public List<Map<String, Object>> getTransactions(int limit) {
        List<Map<String, Object>> transactions = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        for (ImportNote i : completedImports()) {
            Map<String, Object> tx = new HashMap<>();
            tx.put("maGiaoDich", i.getMaPhieuNhap());
            tx.put("type", "OUT");
            tx.put("flowType", "IMPORT_NCC");
            tx.put("streamLabel", "Chi Nhập Kho Tổng (NCC)");
            tx.put("amount", i.getTongTienNhap() != null ? i.getTongTienNhap() : BigDecimal.ZERO);
            tx.put("description", "Nhập hàng từ NCC: " + (i.getNhaCungCap() != null ? i.getNhaCungCap().getTenNhaCungCap() : "Chưa xác định"));
            tx.put("rawTime", i.getNgayNhap());
            tx.put("time", i.getNgayNhap() != null ? i.getNgayNhap().format(formatter) : "");
            transactions.add(tx);
        }

        for (ExportNote e : shippedExports()) {
            Map<String, Object> tx = new HashMap<>();
            tx.put("maGiaoDich", e.getMaPhieuXuat());
            tx.put("amount", BigDecimal.valueOf(exportValue(e)).setScale(0, RoundingMode.HALF_UP));
            if (isRetailExport(e)) {
                tx.put("type", "GMV");
                tx.put("flowType", "RETAIL_GMV");
                tx.put("streamLabel", "GMV Shop (Đối soát)");
                tx.put("description", "Xuất bán lẻ (GMV Shop): "
                        + (e.getDonHangId() != null ? e.getDonHangId() : "Khách lẻ")
                        + (e.getTenShop() != null && !e.getTenShop().isBlank() ? " • " + e.getTenShop() : ""));
            } else {
                tx.put("type", "IN");
                tx.put("flowType", "B2B_SUPPLY");
                tx.put("streamLabel", "Doanh thu Kho Tổng (B2B)");
                tx.put("description", "Xuất cung ứng B2B (giá sỉ): " + (e.getTenShop() != null ? e.getTenShop() : "Nội bộ"));
            }
            tx.put("rawTime", e.getNgayXuat());
            tx.put("time", e.getNgayXuat() != null ? e.getNgayXuat().format(formatter) : "");
            transactions.add(tx);
        }

        // Mới nhất lên đầu, bản ghi thiếu thời gian xuống cuối
        transactions.sort(Comparator.comparing(
                (Map<String, Object> t) -> (LocalDateTime) t.get("rawTime"),
                Comparator.nullsLast(Comparator.reverseOrder())));

        return transactions.stream().limit(Math.max(0, limit)).collect(Collectors.toList());
    }

    // ===================== 3. BIỂU ĐỒ 6 THÁNG =====================

    public List<Map<String, Object>> getChartData() {
        List<ImportNote> imports = completedImports();
        List<ExportNote> exports = shippedExports();
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = now.minusMonths(i);
            int m = monthDate.getMonthValue();
            int y = monthDate.getYear();

            double expense = imports.stream()
                    .filter(n -> inMonth(n.getNgayNhap(), m, y))
                    .map(ImportNote::getTongTienNhap).filter(Objects::nonNull)
                    .mapToDouble(BigDecimal::doubleValue).sum();
            double b2bIncome = exports.stream()
                    .filter(this::isB2bSupplyExport)
                    .filter(n -> inMonth(n.getNgayXuat(), m, y))
                    .mapToDouble(this::exportValue).sum();
            double retailGmv = exports.stream()
                    .filter(this::isRetailExport)
                    .filter(n -> inMonth(n.getNgayXuat(), m, y))
                    .mapToDouble(this::exportValue).sum();

            Map<String, Object> point = new HashMap<>();
            point.put("name", "Tháng " + m + (i == 0 ? " (Hiện tại)" : ""));
            // Đơn vị: triệu đồng
            point.put("income", Math.round(b2bIncome / 1_000_000.0 * 10.0) / 10.0);
            point.put("expense", Math.round(expense / 1_000_000.0 * 10.0) / 10.0);
            point.put("gmv", Math.round(retailGmv / 1_000_000.0 * 10.0) / 10.0);
            result.add(point);
        }
        return result;
    }

    // ===================== 4. BÁO CÁO CHIẾN LƯỢC =====================

    public Map<String, Object> getStrategicReport() {
        List<ExportNote> allExports = exportNoteRepository.findAll();
        List<ExportNote> shipped = allExports.stream()
                .filter(n -> NoteStatus.isExportShipped(n.getTrangThai())).collect(Collectors.toList());

        List<ExportNote> b2bShipped = shipped.stream().filter(this::isB2bSupplyExport).collect(Collectors.toList());
        List<ExportNote> retailShipped = shipped.stream().filter(this::isRetailExport).collect(Collectors.toList());

        // Luồng 1: Doanh thu trực tiếp Sàn/Kho Tổng (từ phiếu xuất cung ứng B2B giá sỉ)
        double b2bRev = 0.0;
        Map<Long, Double> productRev = new HashMap<>();
        Map<Long, Integer> productQty = new HashMap<>();
        Map<Long, Product> productMap = new HashMap<>();
        for (ExportNote note : b2bShipped) {
            for (ExportNoteDetail d : exportNoteDetailRepository.findByPhieuXuat(note)) {
                Product p = d.getSanPham();
                if (p == null || d.getSoLuong() == null) continue;
                double line = ExportNoteService.unitPriceOf(d) * d.getSoLuong();
                b2bRev += line;
                productMap.put(p.getId(), p);
                productRev.merge(p.getId(), line, Double::sum);
                productQty.merge(p.getId(), d.getSoLuong(), Integer::sum);
            }
        }

        // Luồng 2: GMV của các Shop (từ phiếu xuất bán lẻ cho khách hàng cuối)
        double retailGmv = retailShipped.stream().mapToDouble(this::exportValue).sum();

        List<Map.Entry<Long, Double>> sorted = new ArrayList<>(productRev.entrySet());
        sorted.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));
        double maxRev = sorted.isEmpty() ? 1.0 : Math.max(1.0, sorted.get(0).getValue());

        List<Map<String, Object>> topProducts = new ArrayList<>();
        int rank = 1;
        for (Map.Entry<Long, Double> entry : sorted) {
            if (rank > 5) break;
            Product p = productMap.get(entry.getKey());
            Map<String, Object> item = new HashMap<>();
            item.put("id", rank);
            item.put("name", p != null ? p.getTenSanPham() : "Sản phẩm #" + entry.getKey());
            item.put("rev", formatVnd(entry.getValue()));
            item.put("orders", productQty.getOrDefault(entry.getKey(), 0));
            item.put("percent", (int) Math.round(entry.getValue() / maxRev * 100));
            item.put("rankClass", "rank-" + rank);
            topProducts.add(item);
            rank++;
        }

        // Phân bố trạng thái phiếu xuất
        long successCount = shipped.size();
        long pendingCount = allExports.stream().filter(e -> NoteStatus.isExportPending(e.getTrangThai())
                || NoteStatus.isExportApproved(e.getTrangThai())).count();
        long cancelCount = allExports.stream().filter(e -> NoteStatus.isExportCancelled(e.getTrangThai())).count();
        int totalOrders = allExports.size();

        // Tăng trưởng doanh thu B2B & GMV: tháng hiện tại so với tháng trước
        LocalDate now = LocalDate.now();
        LocalDate prev = now.minusMonths(1);
        double revThis = b2bShipped.stream().filter(e -> inMonth(e.getNgayXuat(), now.getMonthValue(), now.getYear()))
                .mapToDouble(this::exportValue).sum();
        double revPrev = b2bShipped.stream().filter(e -> inMonth(e.getNgayXuat(), prev.getMonthValue(), prev.getYear()))
                .mapToDouble(this::exportValue).sum();
        double gmvThis = retailShipped.stream().filter(e -> inMonth(e.getNgayXuat(), now.getMonthValue(), now.getYear()))
                .mapToDouble(this::exportValue).sum();
        double gmvPrev = retailShipped.stream().filter(e -> inMonth(e.getNgayXuat(), prev.getMonthValue(), prev.getYear()))
                .mapToDouble(this::exportValue).sum();
        long ordThis = allExports.stream().filter(e -> inMonth(e.getNgayXuat(), now.getMonthValue(), now.getYear())).count();
        long ordPrev = allExports.stream().filter(e -> inMonth(e.getNgayXuat(), prev.getMonthValue(), prev.getYear())).count();

        // Số đối tác nhận hàng (gian hàng / điểm nhận) khác nhau đã giao dịch
        long partners = shipped.stream().map(ExportNote::getTenShop).filter(Objects::nonNull)
                .filter(s -> !s.isBlank()).distinct().count();

        Map<String, Object> report = new HashMap<>();
        report.put("totalRevenue", b2bRev);
        report.put("totalRevenueFormatted", formatVnd(b2bRev));
        report.put("b2bRevenue", b2bRev);
        report.put("b2bRevenueFormatted", formatVnd(b2bRev));
        report.put("shopGmv", retailGmv);
        report.put("shopGmvFormatted", formatVnd(retailGmv));
        report.put("b2bOrdersCount", b2bShipped.size());
        report.put("retailOrdersCount", retailShipped.size());
        report.put("totalOrders", totalOrders);
        report.put("newCustomers", partners);
        report.put("revenueGrowth", growth(revThis, revPrev));
        report.put("gmvGrowth", growth(gmvThis, gmvPrev));
        report.put("orderGrowth", growth(ordThis, ordPrev));
        report.put("topProducts", topProducts);

        Map<String, Object> statusDist = new HashMap<>();
        statusDist.put("total", totalOrders);
        statusDist.put("successCount", successCount);
        statusDist.put("successPct", pct(successCount, totalOrders));
        statusDist.put("pendingCount", pendingCount);
        statusDist.put("pendingPct", pct(pendingCount, totalOrders));
        statusDist.put("cancelCount", cancelCount);
        statusDist.put("cancelPct", pct(cancelCount, totalOrders));
        report.put("statusDistribution", statusDist);

        report.put("strategicAdvice", buildAdvice(topProducts, b2bRev, retailGmv, pendingCount, cancelCount, totalOrders));
        return report;
    }

    // ===================== HÀM HỖ TRỢ =====================

    private static String formatVnd(double value) {
        return String.format(VI, "%,.0f đ", value);
    }

    private static int pct(long part, long total) {
        return total <= 0 ? 0 : (int) Math.round(part * 100.0 / total);
    }

    /** "+12.5%", "-3.0%" hoặc "Chưa đủ dữ liệu" khi kỳ trước bằng 0. */
    private static String growth(double current, double previous) {
        if (previous <= 0) {
            return current > 0 ? "Mới phát sinh" : "Chưa đủ dữ liệu";
        }
        double g = (current - previous) / previous * 100.0;
        return String.format(Locale.US, "%+.1f%%", g);
    }

    private static String buildAdvice(List<Map<String, Object>> top, double b2bRev, double retailGmv,
                                      long pending, long cancel, int total) {
        if (total == 0) {
            return "Chưa có phiếu xuất kho nào. Báo cáo sẽ được cập nhật khi phát sinh giao dịch.";
        }
        StringBuilder sb = new StringBuilder();
        if (!top.isEmpty() && b2bRev > 0) {
            Map<String, Object> first = top.get(0);
            sb.append("Sản phẩm dẫn đầu doanh thu cung ứng B2B: ").append(first.get("name"))
                    .append(" (").append(first.get("rev")).append("). ");
            sb.append("Nên ưu tiên duy trì tồn kho an toàn tại Kho Tổng. ");
        }
        if (retailGmv > 0) {
            sb.append("Tổng GMV bán lẻ đối soát của các Shop đạt ").append(formatVnd(retailGmv)).append(". ");
        }
        if (pending > 0) {
            sb.append("Hiện còn ").append(pending).append(" phiếu xuất đang chờ xử lý. ");
        }
        int cancelPct = pct(cancel, total);
        if (cancelPct >= 20) {
            sb.append("Tỷ lệ hủy/từ chối ở mức cao (").append(cancelPct).append("%), cần rà soát nguyên nhân.");
        }
        return sb.toString().trim();
    }
}
