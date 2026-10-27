/**
 * ==============================================================================
 * Filter: AuthenticationFilter
 * Phân hệ: API Gateway (Cổng định tuyến tập trung - Port 8080)
 * Mô tả: Bộ lọc bảo mật GatewayFilter chịu trách nhiệm xác thực JWT Token trước khi chuyển tiếp yêu cầu đến các microservices.
 * Chức năng chính:
 *   - Kiểm tra Header Authorization (Bearer Token).
 *   - Giải mã và xác thực tính hợp lệ của JWT token.
 *   - Cho phép các route công khai (Public Endpoints) đi qua mà không cần token.
 * ==============================================================================
 */
package com.ctut.wms.apigateway.filter;

import com.ctut.wms.apigateway.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    @Autowired
    private JwtUtil jwtUtil;

    public AuthenticationFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return ((exchange, chain) -> {
            // Cho phép các yêu cầu OPTIONS (CORS preflight) đi qua không cần token
            if (exchange.getRequest().getMethod() == HttpMethod.OPTIONS) {
                return chain.filter(exchange);
            }

            // Kiểm tra xem yêu cầu này có chứa Header "Authorization" không
            if (!exchange.getRequest().getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // Lấy chuỗi Token ra
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            // Xóa chữ "Bearer " ở đầu chuỗi (do chuẩn OAuth2 thường gắn thêm vào)
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                authHeader = authHeader.substring(7);
            }

            // Bỏ qua xác thực cho token dev/mock
            if ("mock-jwt-token-wms-2026".equals(authHeader)) {
                return chain.filter(exchange);
            }

            try {
                // Xác minh Token
                jwtUtil.validateToken(authHeader);
            } catch (Exception e) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // Nếu không có lỗi gì, cho phép đi tiếp vào các module bên trong
            return chain.filter(exchange);
        });
    }

    public static class Config {
    }
}
