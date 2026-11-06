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

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public int getOrder() {
        return -1; // Ưu tiên chạy đầu tiên trước mọi filter khác
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        // 1. Cho phép yêu cầu OPTIONS (CORS preflight) đi qua không cần kiểm tra
        if (method == HttpMethod.OPTIONS) {
            return chain.filter(exchange);
        }

        // 2. Kiểm tra xem có phải là Endpoint công khai (Public) hay không
        if (isPublicEndpoint(path, method)) {
            // Nếu có gửi kèm Authorization header thì parse để forward, nếu không thì cứ cho qua
            if (request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    try {
                        jwtUtil.validateToken(token);
                        String username = jwtUtil.extractUsername(token);
                        String role = jwtUtil.extractRole(token);
                        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                                .header("X-User-Account", username != null ? username : "")
                                .header("X-User-Role", role != null ? role : "CUSTOMER")
                                .build();
                        return chain.filter(exchange.mutate().request(mutatedRequest).build());
                    } catch (Exception ignored) {
                    }
                }
            }
            return chain.filter(exchange);
        }

        // 3. Nếu là Endpoint được bảo vệ, bắt buộc phải có Authorization Header
        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            return sendErrorResponse(exchange, HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để thực hiện thao tác này!");
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return sendErrorResponse(exchange, HttpStatus.UNAUTHORIZED, "Header Authorization không đúng định dạng Bearer Token!");
        }

        String token = authHeader.substring(7);

        // Bỏ qua xác thực cho token dev/mock
        if ("mock-jwt-token-wms-2026".equals(token)) {
            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                    .header("X-User-Account", "admin_dev")
                    .header("X-User-Role", "ADMIN")
                    .build();
            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        }

        String username;
        String role;
        try {
            jwtUtil.validateToken(token);
            username = jwtUtil.extractUsername(token);
            role = jwtUtil.extractRole(token);
            if (role != null) {
                role = role.toUpperCase().replace("ROLE_", "");
            } else {
                role = "CUSTOMER";
            }
        } catch (Exception e) {
            return sendErrorResponse(exchange, HttpStatus.UNAUTHORIZED, "Token xác thực không hợp lệ hoặc đã hết hạn!");
        }

        // 4. KIỂM TRA PHÂN QUYỀN RBAC (Role-Based Access Control)
        if (!isAuthorized(path, method, role)) {
            return sendErrorResponse(exchange, HttpStatus.FORBIDDEN, 
                    "Từ chối truy cập (403): Vai trò [" + role + "] không có quyền truy cập tài nguyên này!");
        }

        // 5. Gắn Header người dùng và vai trò để chuyển tiếp đến các Microservice bên trong
        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .header("X-User-Account", username != null ? username : "")
                .header("X-User-Role", role)
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    /**
     * Xác định xem URL có phải là endpoint công khai hay không.
     */
    private boolean isPublicEndpoint(String path, HttpMethod method) {
        // Cổng xác thực công khai
        if (path.startsWith("/auth/login") || 
            path.startsWith("/auth/register") || 
            path.startsWith("/auth/validate")) {
            return true;
        }

        // Các API đọc công khai trên Sàn TMĐT cho khách hàng & người xem
        if (path.startsWith("/inventory/marketplace")) return true;
        if (path.startsWith("/categories") && method == HttpMethod.GET) return true;
        if (path.startsWith("/products") && method == HttpMethod.GET) return true;
        if (path.startsWith("/stores") && method == HttpMethod.GET) return true;
        if (path.startsWith("/vouchers/global") && method == HttpMethod.GET) return true;
        if (path.startsWith("/vouchers/store") && method == HttpMethod.GET) return true;
        if (path.startsWith("/vouchers/check") && method == HttpMethod.GET) return true;
        if (path.startsWith("/interactions") && method == HttpMethod.GET) return true;
        if (path.startsWith("/binh-luan") && method == HttpMethod.GET) return true;
        if (path.startsWith("/danh-gia") && method == HttpMethod.GET) return true;

        // Callback thanh toán
        if (path.startsWith("/payments/momo/ipn") || path.startsWith("/payments/callback")) {
            return true;
        }

        return false;
    }

    /**
     * Kiểm tra vai trò của người dùng có quyền truy cập endpoint hay không.
     */
    private boolean isAuthorized(String path, HttpMethod method, String role) {
        // 1. ADMIN có toàn quyền vào TẤT CẢ chức năng
        if ("ADMIN".equals(role)) {
            return true;
        }

        // 2. Nhóm quyền Quản trị hệ thống (Chỉ ADMIN)
        boolean isAdminOnlyEndpoint = path.startsWith("/auth/users") ||
                                      path.startsWith("/auth/staff") ||
                                      path.startsWith("/auth/stats") ||
                                      path.startsWith("/auth/delete");
        if (isAdminOnlyEndpoint) {
            return "ADMIN".equals(role);
        }

        // 3. Nhóm quyền Quản lý Kho bãi WMS:
        // Thủ kho, Nhân viên kho và Admin có quyền
        boolean isWarehouseEndpoint = path.startsWith("/warehouses") ||
                                      path.startsWith("/export-notes") ||
                                      path.startsWith("/import-notes") ||
                                      path.startsWith("/actual-imports") ||
                                      path.startsWith("/stock-cards") ||
                                      path.startsWith("/suppliers") ||
                                      path.startsWith("/transfers") ||
                                      path.startsWith("/shippers") ||
                                      path.startsWith("/shipping-providers") ||
                                      path.startsWith("/purchase-orders") ||
                                      path.startsWith("/wms");

        if (isWarehouseEndpoint) {
            return isWarehouseRole(role);
        }

        // Chỉnh sửa danh mục master/sản phẩm master catalog: Chỉ kho và admin
        if ((path.startsWith("/products") || path.startsWith("/categories")) && 
            (method == HttpMethod.POST || method == HttpMethod.PUT || method == HttpMethod.DELETE)) {
            return isWarehouseRole(role);
        }

        // 4. Nhóm quyền Kênh Người Bán (Chủ Cửa Hàng):
        // Chỉ Chủ shop (STORE_OWNER / SELLER) và Admin có quyền
        boolean isSellerEndpoint = path.contains("/publish") ||
                                   path.startsWith("/orders/store") ||
                                   (path.startsWith("/orders/") && path.contains("/status")) ||
                                   (path.startsWith("/orders/") && path.contains("/shipping-status")) ||
                                   (path.startsWith("/vouchers") && method == HttpMethod.POST) ||
                                   (path.startsWith("/stores") && (method == HttpMethod.PUT || method == HttpMethod.POST));

        if (isSellerEndpoint) {
            return isSellerRole(role);
        }

        // 5. Nếu là Thủ kho / Nhân viên kho: Chỉ có quyền ở kho bãi, không được vào các thao tác người bán
        if (isWarehouseRole(role)) {
            // Thủ kho có thể xem thông tin cá nhân và đổi mật khẩu
            if (path.startsWith("/auth/profile") || path.startsWith("/auth/change-password")) {
                return true;
            }
            // Không cho phép nhân viên kho truy cập Kênh người bán hoặc đặt đơn gian hàng
            return false;
        }

        // 6. Nhóm quyền Khách Hàng (CUSTOMER):
        // Chỉ xem và thao tác ở phần Khách Hàng (Đặt hàng, xem đơn cá nhân, thanh toán, đánh giá)
        if ("CUSTOMER".equals(role)) {
            boolean isCustomerAllowed = path.startsWith("/orders/checkout") ||
                                        path.startsWith("/orders/user") ||
                                        (path.startsWith("/orders/") && path.endsWith("/cancel")) ||
                                        path.startsWith("/payments") ||
                                        path.startsWith("/interactions") ||
                                        path.startsWith("/binh-luan") ||
                                        path.startsWith("/danh-gia") ||
                                        path.startsWith("/auth/profile") ||
                                        path.startsWith("/auth/change-password");
            return isCustomerAllowed;
        }

        // 7. Chủ shop (STORE_OWNER / SELLER) cũng có thể mua sắm như khách hàng
        if (isSellerRole(role)) {
            return true;
        }

        return false;
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
