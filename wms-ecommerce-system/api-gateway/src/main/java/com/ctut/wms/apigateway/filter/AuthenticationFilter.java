package com.ctut.wms.apigateway.filter;

import com.ctut.wms.apigateway.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
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
            // Kiểm tra xem yêu cầu này có chứa Header "Authorization" không
            if (!exchange.getRequest().getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                throw new RuntimeException("Thiếu Header Authorization: Không có quyền truy cập!");
            }

            // Lấy chuỗi Token ra
            String authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION).get(0);

            // Xóa chữ "Bearer " ở đầu chuỗi (do chuẩn OAuth2 thường gắn thêm vào)
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                authHeader = authHeader.substring(7);
            }

            try {
                // Xác minh Token
                jwtUtil.validateToken(authHeader);
            } catch (Exception e) {
                throw new RuntimeException("Token không hợp lệ hoặc đã hết hạn!");
            }

            // Nếu không có lỗi gì, cho phép đi tiếp vào các module bên trong
            return chain.filter(exchange);
        });
    }

    public static class Config {
        // Có thể để trống, chỉ dùng để cấu hình thêm nếu cần
    }
}