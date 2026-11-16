/**
 * ==============================================================================
 * Tiện Ích (Utility): JwtUtil
 * Phân hệ: API Gateway (Cổng định tuyến tập trung - Port 8080)
 * Mô tả: Lớp tiện ích cung cấp các hàm hỗ trợ kỹ thuật dùng chung cho API Gateway (Cổng định tuyến tập trung - Port 8080).
 * ==============================================================================
 */
package com.ctut.wms.apigateway.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;

@Component
public class JwtUtil {

    // Khóa bí mật (Base64) đọc từ cấu hình jwt.secret / biến môi trường JWT_SECRET, phải khớp với identity-service
    @Value("${jwt.secret}")
    private String secret;

    // Hàm kiểm tra tính hợp lệ của Token
    public void validateToken(final String token) {
        Jwts.parserBuilder().setSigningKey(getSignKey()).build().parseClaimsJws(token);
    }

    public Claims extractAllClaims(final String token) {
        return Jwts.parserBuilder().setSigningKey(getSignKey()).build().parseClaimsJws(token).getBody();
    }

    public String extractUsername(final String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(final String token) {
        try {
            Claims claims = extractAllClaims(token);
            Object role = claims.get("role");
            if (role != null && !role.toString().isEmpty()) return role.toString();
            Object vaiTro = claims.get("vaiTro");
            if (vaiTro != null && !vaiTro.toString().isEmpty()) return vaiTro.toString();
        } catch (Exception ignored) {
        }
        return "CUSTOMER";
    }

    public String extractUserId(final String token) {
        try {
            Object userId = extractAllClaims(token).get("userId");
            return userId != null ? userId.toString() : null;
        } catch (Exception ignored) {
            return null;
        }
    }

    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
