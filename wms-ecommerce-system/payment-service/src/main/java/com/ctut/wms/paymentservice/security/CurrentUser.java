package com.ctut.wms.paymentservice.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Đọc thông tin người dùng hiện tại từ các header do API Gateway gắn sau khi đã xác thực JWT.
 * Vai trò SYSTEM dành cho lời gọi nội bộ giữa các microservice.
 */
public final class CurrentUser {

    public static final String HEADER_ACCOUNT = "X-User-Account";
    public static final String HEADER_ROLE = "X-User-Role";
    public static final String HEADER_USER_ID = "X-User-Id";

    private CurrentUser() {
    }

    private static String header(String name) {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)) {
            return null;
        }
        HttpServletRequest request = attrs.getRequest();
        String value = request.getHeader(name);
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    public static String account() {
        return header(HEADER_ACCOUNT);
    }

    public static String role() {
        return header(HEADER_ROLE);
    }

    public static Long id() {
        String raw = header(HEADER_USER_ID);
        if (raw == null) return null;
        try {
            return Long.valueOf(raw);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static boolean isAuthenticated() {
        return role() != null;
    }

    public static boolean isSystem() {
        return "SYSTEM".equals(role());
    }

    /** ADMIN hoặc lời gọi nội bộ giữa các service. */
    public static boolean isAdmin() {
        return "ADMIN".equals(role()) || isSystem();
    }

    public static boolean isSeller() {
        String r = role();
        return "STORE_OWNER".equals(r) || "SELLER".equals(r) || "CHU_CUA_HANG".equals(r);
    }

    public static boolean isWarehouse() {
        String r = role();
        return "WAREHOUSE_MANAGER".equals(r) || "WAREHOUSE_STAFF".equals(r) || "THUKHO".equals(r) || "NVKHO".equals(r);
    }

    public static void requireAuthenticated() {
        if (!isAuthenticated()) {
            throw new ForbiddenException("Vui lòng đăng nhập để thực hiện thao tác này!");
        }
    }

    public static void requireAdmin() {
        if (!isAdmin()) {
            throw new ForbiddenException("Từ chối truy cập: Chỉ Quản trị viên mới được thực hiện thao tác này!");
        }
    }

    /** Bắt buộc là chính chủ (theo userId) hoặc Admin. */
    public static void requireSelfOrAdmin(Long ownerId) {
        if (isAdmin()) return;
        Long me = id();
        if (me == null || ownerId == null || !me.equals(ownerId)) {
            throw new ForbiddenException("Từ chối truy cập: Bạn không có quyền với dữ liệu của người khác!");
        }
    }
}
