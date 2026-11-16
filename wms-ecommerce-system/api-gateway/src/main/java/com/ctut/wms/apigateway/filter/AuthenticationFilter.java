/**
 * ==============================================================================
 * Filter: AuthenticationFilter
 * Phân hệ: API Gateway (Cổng định tuyến tập trung - Port 8080)
 * Mô tả: Bộ lọc bảo mật toàn cục (GlobalFilter) chịu trách nhiệm:
 *   1. Bỏ qua các Endpoint công khai (Public Endpoints / Preflight CORS).
 *   2. Giải mã và kiểm tra tính hợp lệ của JWT Token (Bearer).
 *   3. Phân quyền truy cập theo vai trò (RBAC):
 *      - ADMIN: Toàn quyền truy cập tất cả hệ thống và API.
 *      - THỦ KHO / NHÂN VIÊN KHO (WAREHOUSE_MANAGER, WAREHOUSE_STAFF, THUKHO, NVKHO):
 *        Chỉ có quyền vận hành kho (WMS), không vào được Kênh Người Bán hay Quản trị người dùng.
 *      - CHỦ CỬA HÀNG (STORE_OWNER, SELLER):
 *        Chỉ có quyền quản lý gian hàng của mình (đăng bán, xử lý đơn shop, tạo voucher shop).
 *      - KHÁCH HÀNG (CUSTOMER):
 *        Chỉ có quyền mua sắm, đặt hàng, quản lý đơn cá nhân, đánh giá/bình luận.
 *   4. Gắn Header xác thực X-User-Account và X-User-Role chuyển tiếp đến các Microservice.
 * ==============================================================================
 */
package com.ctut.wms.apigateway.filter;

import com.ctut.wms.apigateway.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Component
public class AuthenticationFilter implements GlobalFilter, Ordered {

    public static final String HEADER_ACCOUNT = "X-User-Account";
    public static final String HEADER_ROLE = "X-User-Role";
    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_INTERNAL_SECRET = "X-Internal-Secret";

    @Autowired
    private JwtUtil jwtUtil;

    // Khóa bí mật nội bộ: các microservice chỉ chấp nhận request có header này (tức là đi qua Gateway)
    @Value("${internal.secret}")
    private String internalSecret;

    @Override
    public int getOrder() {
        return -1; // Ưu tiên chạy đầu tiên trước mọi filter khác
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        // 0. Chặn các đường dẫn bất thường có thể dùng để lách luật phân quyền theo path
        String rawPath = request.getURI().getRawPath();
        String lowerRaw = rawPath != null ? rawPath.toLowerCase() : "";
        if (lowerRaw.contains("//") || lowerRaw.contains("..") || lowerRaw.contains("%2e")
                || lowerRaw.contains("%2f") || lowerRaw.contains("%5c") || lowerRaw.contains(";")
                || lowerRaw.contains("\\")) {
            return sendErrorResponse(exchange, HttpStatus.BAD_REQUEST, "Đường dẫn không hợp lệ!");
        }

        // 1. Cho phép yêu cầu OPTIONS (CORS preflight) đi qua không cần kiểm tra
        if (method == HttpMethod.OPTIONS) {
            return chain.filter(forward(exchange, null, null, null));
        }

        // 2. Giải mã token (nếu có). Không bao giờ tin các header X-User-* do client tự gửi lên.
        String username = null;
        String role = null;
        String userId = null;
        boolean tokenValid = false;

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                jwtUtil.validateToken(token);
                username = jwtUtil.extractUsername(token);
                role = normalizeRole(jwtUtil.extractRole(token));
                userId = jwtUtil.extractUserId(token);
                tokenValid = true;
            } catch (Exception ignored) {
                tokenValid = false;
            }
        }

        // 3. Endpoint công khai: cho qua, kèm thông tin người dùng nếu token hợp lệ
        if (isPublicEndpoint(path, method)) {
            return tokenValid
                    ? chain.filter(forward(exchange, username, role, userId))
                    : chain.filter(forward(exchange, null, null, null));
        }

        // 4. Endpoint được bảo vệ: bắt buộc có token hợp lệ
        if (authHeader == null) {
            return sendErrorResponse(exchange, HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để thực hiện thao tác này!");
        }
        if (!authHeader.startsWith("Bearer ")) {
            return sendErrorResponse(exchange, HttpStatus.UNAUTHORIZED, "Header Authorization không đúng định dạng Bearer Token!");
        }
        if (!tokenValid) {
            return sendErrorResponse(exchange, HttpStatus.UNAUTHORIZED, "Token xác thực không hợp lệ hoặc đã hết hạn!");
        }

        // 5. KIỂM TRA PHÂN QUYỀN RBAC (Role-Based Access Control)
        if (!isAuthorized(path, method, role)) {
            return sendErrorResponse(exchange, HttpStatus.FORBIDDEN,
                    "Từ chối truy cập (403): Vai trò [" + role + "] không có quyền truy cập tài nguyên này!");
        }

        // 6. Gắn Header người dùng, vai trò và khóa nội bộ để chuyển tiếp đến các Microservice
        return chain.filter(forward(exchange, username, role, userId));
    }

    /**
     * Xóa mọi header định danh do client gửi lên, sau đó gắn lại header do Gateway xác thực.
     */
    private ServerWebExchange forward(ServerWebExchange exchange, String username, String role, String userId) {
        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .headers(h -> {
                    h.remove(HEADER_ACCOUNT);
                    h.remove(HEADER_ROLE);
                    h.remove(HEADER_USER_ID);
                    h.remove(HEADER_INTERNAL_SECRET);
                    h.set(HEADER_INTERNAL_SECRET, internalSecret);
                    if (role != null) {
                        h.set(HEADER_ACCOUNT, username != null ? username : "");
                        h.set(HEADER_ROLE, role);
                        if (userId != null) {
                            h.set(HEADER_USER_ID, userId);
                        }
                    }
                })
                .build();
        return exchange.mutate().request(mutatedRequest).build();
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "CUSTOMER";
        }
        return role.toUpperCase().replace("ROLE_", "");
    }

    /**
     * Xác định xem URL có phải là endpoint công khai hay không.
     */
    private boolean isPublicEndpoint(String path, HttpMethod method) {
        // Cổng xác thực công khai
        if (path.equals("/auth/login") ||
            path.equals("/auth/register") ||
            path.equals("/auth/validate")) {
            return true;
        }

        // Các API đọc công khai trên Sàn TMĐT cho khách hàng & người xem
        if (method == HttpMethod.GET) {
            if (path.startsWith("/inventory")) return true;
            if (path.startsWith("/categories")) return true;
            if (path.startsWith("/products")) return true;
            if (path.startsWith("/stores")) return true;
            if (path.startsWith("/warehouses")) return true;
            if (path.startsWith("/vouchers")) return true;
            if (path.startsWith("/interactions")) return true;
            if (path.startsWith("/binh-luan")) return true;
            if (path.startsWith("/danh-gia")) return true;
        }

        // Webhook IPN của MoMo (được bảo vệ bằng chữ ký HMAC ở payment-service)
        if (path.equals("/payments/momo-ipn") && method == HttpMethod.POST) {
            return true;
        }

        return false;
    }

    /**
     * Kiểm tra vai trò của người dùng có quyền truy cập endpoint hay không.
     * Nguyên tắc: liệt kê tường minh từng nhóm endpoint, MẶC ĐỊNH TỪ CHỐI.
     * (Quyền sở hữu dữ liệu - "của ai" - được kiểm tra thêm tại từng microservice.)
     */
    private boolean isAuthorized(String path, HttpMethod method, String role) {
        // 1. ADMIN có toàn quyền vào TẤT CẢ chức năng
        if ("ADMIN".equals(role)) {
            return true;
        }

        // 2. Nhóm chỉ dành cho ADMIN
        if (isAdminOnlyEndpoint(path, method)) {
            return false;
        }

        // 3a. Hợp đồng cung ứng Kho Tổng -> Cửa hàng: Chủ shop & nhân sự kho
        //     (service kiểm tra chi tiết: ai được duyệt / ký / xuất / nhận ở từng bước)
        if (path.equals("/supply-contracts") || path.startsWith("/supply-contracts/")) {
            return isSellerRole(role) || isWarehouseRole(role);
        }

        // 3. Nhóm Quản lý Kho bãi WMS: Thủ kho, Nhân viên kho
        if (isWarehouseEndpoint(path, method)) {
            return isWarehouseRole(role);
        }

        // 4. Tài khoản cá nhân (xem/sửa hồ sơ, đổi mật khẩu): mọi vai trò đã đăng nhập
        if (isSelfAccountEndpoint(path, method)) {
            return true;
        }

        // 5. Ngưỡng cảnh báo tồn kho: Chủ shop (gian hàng của mình) hoặc nhân sự kho
        if (method == HttpMethod.PUT && path.matches("^/inventory/\\d+/thresholds$")) {
            return isSellerRole(role) || isWarehouseRole(role);
        }

        // 6. Kênh Người Bán: Chủ cửa hàng
        if (isSellerEndpoint(path, method)) {
            return isSellerRole(role);
        }

        // 7. Mua sắm: Khách hàng và Chủ shop (chủ shop cũng có thể mua hàng)
        if (isShoppingEndpoint(path, method)) {
            return "CUSTOMER".equals(role) || isSellerRole(role);
        }

        // 8. Mặc định: từ chối
        return false;
    }

    private boolean isAdminOnlyEndpoint(String path, HttpMethod method) {
        return (path.equals("/auth/users") && (method == HttpMethod.GET || method == HttpMethod.POST))
                || path.matches("^/auth/users/\\d+/toggle-status$")
                || path.matches("^/auth/users/\\d+/approve$")
                || path.startsWith("/auth/staff")
                || path.startsWith("/auth/stats")
                || path.startsWith("/auth/delete/")
                || path.startsWith("/auth/customers")
                || (path.equals("/orders") && method == HttpMethod.GET)
                // Trạng thái thanh toán: chỉ Admin (payment-service gọi nội bộ, không qua Gateway)
                || path.endsWith("/payment-status")
                || path.startsWith("/payments/confirm-manual/")
                || (path.equals("/payments/crypto") && method == HttpMethod.GET)
                || path.matches("^/payments/crypto/\\d+/(confirm|reject)$")
                // Báo cáo tài chính & chiến lược: chỉ Quản trị viên
                || path.startsWith("/wms/finance");
    }

    private boolean isWarehouseEndpoint(String path, HttpMethod method) {
        boolean wmsArea = path.startsWith("/wms/")
                || path.startsWith("/warehouses")
                || path.startsWith("/export-notes")
                || path.startsWith("/import-notes")
                || path.startsWith("/stock-cards")
                || path.startsWith("/suppliers")
                || path.startsWith("/transfers")
                || path.startsWith("/shippers")
                || path.startsWith("/shipping-providers");
        // Chỉnh sửa danh mục master / sản phẩm master catalog
        boolean catalogWrite = (path.startsWith("/products") || path.startsWith("/categories"))
                && (method == HttpMethod.POST || method == HttpMethod.PUT || method == HttpMethod.DELETE);
        return wmsArea || catalogWrite;
    }

    private boolean isSelfAccountEndpoint(String path, HttpMethod method) {
        return (method == HttpMethod.GET && path.matches("^/auth/profile/[^/]+$"))
                || (method == HttpMethod.PUT && path.matches("^/auth/users/\\d+$"))
                || (method == HttpMethod.PUT && path.matches("^/auth/change-password/[^/]+$"))
                || (method == HttpMethod.PUT && path.equals("/auth/upgrade-to-seller"));
    }

    private boolean isSellerEndpoint(String path, HttpMethod method) {
        return (method == HttpMethod.PUT && path.matches("^/inventory/\\d+/publish$"))
                || (method == HttpMethod.POST && path.equals("/inventory/add"))
                || (method == HttpMethod.GET && path.matches("^/orders/store/\\d+$"))
                || (method == HttpMethod.PUT && path.matches("^/orders/\\d+/status$"))
                || (method == HttpMethod.PUT && path.matches("^/orders/\\d+/shipping-status$"))
                || (method == HttpMethod.POST && path.equals("/vouchers"))
                || (method == HttpMethod.PUT && path.matches("^/vouchers/[^/]+/deactivate$"))
                || (method == HttpMethod.POST && path.equals("/stores"))
                || (method == HttpMethod.PUT && path.matches("^/stores/\\d+$"));
    }

    private boolean isShoppingEndpoint(String path, HttpMethod method) {
        return (method == HttpMethod.POST && path.equals("/orders"))
                || (method == HttpMethod.POST && path.equals("/orders/checkout-multishop"))
                || (method == HttpMethod.GET && path.matches("^/orders/checkout-session/[^/]+$"))
                || (method == HttpMethod.GET && path.matches("^/orders/user/\\d+$"))
                || (method == HttpMethod.GET && path.matches("^/orders/DH-[^/]+$"))
                || (method == HttpMethod.PUT && path.matches("^/orders/\\d+/cancel$"))
                || (method == HttpMethod.POST && path.equals("/payments/create"))
                || (method == HttpMethod.GET && path.matches("^/payments/status/[^/]+$"))
                || (method == HttpMethod.POST && path.equals("/payments/crypto/submit"))
                || (method == HttpMethod.GET && path.matches("^/payments/crypto/session/[^/]+$"))
                || path.startsWith("/interactions/")
                || path.equals("/binh-luan") || path.startsWith("/binh-luan/")
                || path.equals("/danh-gia") || path.startsWith("/danh-gia/");
    }

    private boolean isWarehouseRole(String role) {
        return "WAREHOUSE_MANAGER".equals(role) ||
               "WAREHOUSE_STAFF".equals(role) ||
               "THUKHO".equals(role) ||
               "NVKHO".equals(role) ||
               "ADMIN".equals(role);
    }

    private boolean isSellerRole(String role) {
        return "STORE_OWNER".equals(role) ||
               "SELLER".equals(role) ||
               "CHU_CUA_HANG".equals(role) ||
               "ADMIN".equals(role);
    }

    private Mono<Void> sendErrorResponse(ServerWebExchange exchange, HttpStatus status, String message) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String json = "{\"status\": " + status.value() + ", \"error\": \"" + status.getReasonPhrase() + "\", \"message\": \"" + message + "\"}";
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bytes);
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}
