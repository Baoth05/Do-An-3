/**
 * ==============================================================================
 * Service: JwtService
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Cung cấp logic nghiệp vụ, giao dịch cơ sở dữ liệu và xử lý dữ liệu cho JwtService.
 * ==============================================================================
 */
package com.ctut.wms.identityservice.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    // Khóa bí mật (Base64) đọc từ cấu hình jwt.secret / biến môi trường JWT_SECRET, phải khớp với Gateway
    @Value("${jwt.secret}")
    private String secret;

    public String generateToken(String taiKhoan) {
        return generateToken(taiKhoan, "CUSTOMER", null);
    }

    public String generateToken(String taiKhoan, String role, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("vaiTro", role);
        if (userId != null) {
            claims.put("userId", userId);
        }

        return Jwts.builder()
                .claims(claims)
                .subject(taiKhoan)
                .issuedAt(new Date(System.currentTimeMillis()))
                // Hạn sử dụng 1 ngày
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24))
                .signWith(getSignInKey())
                .compact();
    }

    // Ở bản 0.12.x, bắt buộc trả về SecretKey thay vì Key chung chung
    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public void validateToken(String token) {
        // Cú pháp giải mã chuẩn của thư viện JJWT từ phiên bản 0.12.0 trở lên
        Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token);
    }
}
