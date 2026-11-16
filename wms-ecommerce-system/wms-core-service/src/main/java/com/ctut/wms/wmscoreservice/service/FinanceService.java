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
 * Báo cáo tài chính kho - 100% từ dữ liệu thật:
 *   - THU: phiếu xuất ĐÃ XUẤT KHO THỰC TẾ (HOÀN THÀNH / giao vận), tính theo đơn giá thực tế lúc xuất.
 *   - CHI: phiếu nhập ĐÃ NHẬP KHO.
 * Phiếu chờ duyệt, bị từ chối hoặc bị hủy không được tính vào dòng tiền.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinanceService {

    private final ImportNoteRepository importNoteRepository;
    private final ExportNoteRepository exportNoteRepository;
    private final ExportNoteDetailRepository exportNoteDetailRepository;

    private static final Locale VI = Locale.forLanguageTag("vi-VN");

    // ===================== DỮ LIỆU NGUỒN =====================

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
        if (t == null) return month == null && year == null;
        return (month == null || t.getMonthValue() == month) && (year == null || t.getYear() == year);
    }

    // ===================== 1. TỔNG QUAN =====================

    /** Tổng quan thu - chi - lợi nhuận, lọc theo tháng/năm nếu có. */
    public Map<String, Object> getFinancialSummary(Integer month, Integer year) {
        List<ImportNote> imports = completedImports().stream()
                .filter(n -> matches(n.getNgayNhap(), month, year)).collect(Collectors.toList());
        List<ExportNote> exports = shippedExports().stream()
                .filter(n -> matches(n.getNgayXuat(), month, year)).collect(Collectors.toList());

        BigDecimal totalExpense = imports.stream()
                .map(ImportNote::getTongTienNhap).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalIncome = BigDecimal.valueOf(exports.stream().mapToDouble(this::exportValue).sum())
                .setScale(0, RoundingMode.HALF_UP);
        BigDecimal profit = totalIncome.subtract(totalExpense);

        int profitMargin = 0;
        if (totalIncome.signum() > 0) {
            profitMargin = profit.multiply(BigDecimal.valueOf(100))
                    .divide(totalIncome, 0, RoundingMode.HALF_UP).intValue();
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("income", totalIncome);
        summary.put("expense", totalExpense);
        summary.put("profit", profit);
        summary.put("profitMargin", profitMargin);
        summary.put("importCount", imports.size());
        summary.put("exportCount", exports.size());
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
            tx.put("amount", i.getTongTienNhap() != null ? i.getTongTienNhap() : BigDecimal.ZERO);
            tx.put("description", "Nhập hàng từ NCC: " + (i.getNhaCungCap() != null ? i.getNhaCungCap().getTenNhaCungCap() : "Chưa xác định"));
            tx.put("rawTime", i.getNgayNhap());
            tx.put("time", i.getNgayNhap() != null ? i.getNgayNhap().format(formatter) : "");
            transactions.add(tx);
        }

        for (ExportNote e : shippedExports()) {
            Map<String, Object> tx = new HashMap<>();
            tx.put("maGiaoDich", e.getMaPhieuXuat());
            tx.put("type", "IN");
            tx.put("amount", BigDecimal.valueOf(exportValue(e)).setScale(0, RoundingMode.HALF_UP));
            tx.put("description", e.getDonHangId() != null
                    ? "Xuất bán theo đơn hàng: " + e.getDonHangId()
                    : "Xuất kho cung ứng: " + (e.getTenShop() != null ? e.getTenShop() : "Nội bộ"));
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
            double income = exports.stream()
                    .filter(n -> inMonth(n.getNgayXuat(), m, y))
                    .mapToDouble(this::exportValue).sum();

            Map<String, Object> point = new HashMap<>();
            point.put("name", "Tháng " + m + (i == 0 ? " (Hiện tại)" : ""));
            // Đơn vị: triệu đồng
            point.put("income", Math.round(income / 1_000_000.0 * 10.0) / 10.0);
            point.put("expense", Math.round(expense / 1_000_000.0 * 10.0) / 10.0);
            result.add(point);
        }
        return result;
    }

    // ===================== 4. BÁO CÁO CHIẾN LƯỢC =====================

    public Map<String, Object> getStrategicReport() {
        List<ExportNote> allExports = exportNoteRepository.findAll();
        List<ExportNote> shipped = allExports.stream()
                .filter(n -> NoteStatus.isExportShipped(n.getTrangThai())).collect(Collectors.toList());

        // Doanh thu & số lượng theo sản phẩm (chỉ hàng đã xuất thực tế)
        double totalRev = 0.0;
        Map<Long, Double> productRev = new HashMap<>();
        Map<Long, Integer> productQty = new HashMap<>();
        Map<Long, Product> productMap = new HashMap<>();
        for (ExportNote note : shipped) {
            for (ExportNoteDetail d : exportNoteDetailRepository.findByPhieuXuat(note)) {
                Product p = d.getSanPham();
                if (p == null || d.getSoLuong() == null) continue;
                double line = ExportNoteService.unitPriceOf(d) * d.getSoLuong();
                totalRev += line;
                productMap.put(p.getId(), p);
                productRev.merge(p.getId(), line, Double::sum);
                productQty.merge(p.getId(), d.getSoLuong(), Integer::sum);
            }
        }

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

        // Tăng trưởng: tháng hiện tại so với tháng trước
        LocalDate now = LocalDate.now();
        LocalDate prev = now.minusMonths(1);
        double revThis = shipped.stream().filter(e -> inMonth(e.getNgayXuat(), now.getMonthValue(), now.getYear()))
                .mapToDouble(this::exportValue).sum();
        double revPrev = shipped.stream().filter(e -> inMonth(e.getNgayXuat(), prev.getMonthValue(), prev.getYear()))
                .mapToDouble(this::exportValue).sum();
        long ordThis = allExports.stream().filter(e -> inMonth(e.getNgayXuat(), now.getMonthValue(), now.getYear())).count();
        long ordPrev = allExports.stream().filter(e -> inMonth(e.getNgayXuat(), prev.getMonthValue(), prev.getYear())).count();

        // Số đối tác nhận hàng (gian hàng / điểm nhận) khác nhau đã giao dịch
        long partners = shipped.stream().map(ExportNote::getTenShop).filter(Objects::nonNull)
                .filter(s -> !s.isBlank()).distinct().count();

        Map<String, Object> report = new HashMap<>();
        report.put("totalRevenue", totalRev);
        report.put("totalRevenueFormatted", formatVnd(totalRev));
        report.put("totalOrders", totalOrders);
        report.put("newCustomers", partners);
        report.put("revenueGrowth", growth(revThis, revPrev));
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

        report.put("strategicAdvice", buildAdvice(topProducts, totalRev, pendingCount, cancelCount, totalOrders));
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

    private static String buildAdvice(List<Map<String, Object>> top, double totalRev, long pending, long cancel, int total) {
        if (total == 0) {
            return "Chưa có phiếu xuất kho nào. Báo cáo sẽ được cập nhật khi phát sinh giao dịch.";
        }
        StringBuilder sb = new StringBuilder();
        if (!top.isEmpty() && totalRev > 0) {
            Map<String, Object> first = top.get(0);
            sb.append("Sản phẩm dẫn đầu doanh thu: ").append(first.get("name"))
                    .append(" (").append(first.get("rev")).append("). ");
            sb.append("Nên ưu tiên duy trì tồn kho an toàn cho nhóm sản phẩm bán chạy. ");
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
