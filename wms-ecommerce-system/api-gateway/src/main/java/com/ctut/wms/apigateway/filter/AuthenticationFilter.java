package com.ctut.wms.apigateway.filter;

import com.ctut.wms.apigateway.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

import org.springframework.http.HttpStatus;

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
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // Lấy chuỗi Token ra
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            // Xóa chữ "Bearer " ở đầu chuỗi (do chuẩn OAuth2 thường gắn thêm vào)
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                authHeader = authHeader.substring(7);
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
        // Có thể để trống, chỉ dùng để cấu hình thêm nếu cần
    }
}