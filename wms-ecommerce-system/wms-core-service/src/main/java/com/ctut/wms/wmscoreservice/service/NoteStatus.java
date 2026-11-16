package com.ctut.wms.wmscoreservice.service;

import java.util.Locale;
import java.util.Set;

/**
 * Danh mục trạng thái & quy tắc chuyển trạng thái của Phiếu Nhập / Phiếu Xuất kho.
 */
public final class NoteStatus {

    private NoteStatus() {
    }

    // ===================== PHIẾU XUẤT =====================
    public static final String XUAT_CHO_DUYET = "CHỜ DUYỆT";
    public static final String XUAT_CHO_XUAT_KHO = "CHỜ XUẤT KHO";
    public static final String XUAT_HOAN_THANH = "HOÀN THÀNH";
    public static final String XUAT_DA_HUY = "ĐÃ HỦY";

    private static final Set<String> XUAT_PENDING = Set.of("CHỜ DUYỆT", "CHO_DUYET", "CHỜ GOM HÀNG");
    private static final Set<String> XUAT_CANCEL = Set.of("TỪ CHỐI", "TU_CHOI", "ĐÃ HỦY", "DA_HUY", "HỦY", "HUY", "CANCELLED");

    public static String norm(String s) {
        return s == null ? "" : s.trim().toUpperCase(Locale.ROOT);
    }

    public static boolean isExportPending(String s) {
        return XUAT_PENDING.contains(norm(s)) || norm(s).isEmpty();
    }

    public static boolean isExportApproved(String s) {
        return XUAT_CHO_XUAT_KHO.equals(norm(s));
    }

    public static boolean isExportCancelled(String s) {
        return XUAT_CANCEL.contains(norm(s));
    }

    /** Hàng đã thực sự rời kho (HOÀN THÀNH hoặc các trạng thái giao vận phía sau). */
    public static boolean isExportShipped(String s) {
        return !isExportPending(s) && !isExportApproved(s) && !isExportCancelled(s);
    }

    // ===================== PHIẾU NHẬP =====================
    public static final String NHAP_CHO_DUYET = "CHO_DUYET";
    public static final String NHAP_DA_DUYET = "DA_DUYET";
    public static final String NHAP_DA_NHAP_KHO = "DA_NHAP_KHO";
    public static final String NHAP_TU_CHOI = "TU_CHOI";

    /** Chuẩn hóa các cách viết khác nhau về mã trạng thái phiếu nhập. */
    public static String normalizeImport(String s) {
        String n = norm(s);
        return switch (n) {
            case "", "CHỜ DUYỆT", "CHO_DUYET", "PENDING" -> NHAP_CHO_DUYET;
            case "ĐÃ DUYỆT", "DA_DUYET", "APPROVED" -> NHAP_DA_DUYET;
            case "ĐÃ NHẬP KHO", "DA_NHAP_KHO" -> NHAP_DA_NHAP_KHO;
            case "TỪ CHỐI", "TU_CHOI", "REJECTED", "ĐÃ HỦY", "DA_HUY" -> NHAP_TU_CHOI;
            default -> n;
        };
    }

    /** CHO_DUYET -> DA_DUYET | TU_CHOI ; DA_DUYET -> DA_NHAP_KHO | TU_CHOI ; DA_NHAP_KHO, TU_CHOI là trạng thái cuối. */
    public static boolean canImportTransition(String from, String to) {
        String f = normalizeImport(from);
        String t = normalizeImport(to);
        return switch (f) {
            case NHAP_CHO_DUYET -> t.equals(NHAP_DA_DUYET) || t.equals(NHAP_TU_CHOI);
            case NHAP_DA_DUYET -> t.equals(NHAP_DA_NHAP_KHO) || t.equals(NHAP_TU_CHOI);
            default -> false;
        };
    }
}
