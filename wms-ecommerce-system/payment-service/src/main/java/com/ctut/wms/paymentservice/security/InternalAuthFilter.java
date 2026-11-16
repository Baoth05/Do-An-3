package com.ctut.wms.paymentservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Chỉ chấp nhận request đi qua API Gateway (hoặc từ microservice nội bộ) có kèm header X-Internal-Secret.
 * Ngăn việc gọi thẳng vào cổng của service để bỏ qua xác thực JWT và giả mạo header X-User-*.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class InternalAuthFilter extends OncePerRequestFilter {

    public static final String HEADER_INTERNAL_SECRET = "X-Internal-Secret";

    @Value("${internal.secret}")
    private String internalSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String provided = request.getHeader(HEADER_INTERNAL_SECRET);
        if (provided == null || !MessageDigest.isEqual(
                provided.getBytes(StandardCharsets.UTF_8), internalSecret.getBytes(StandardCharsets.UTF_8))) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"status\":403,\"message\":\"Vui lòng truy cập qua API Gateway!\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
