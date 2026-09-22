package com.ctut.wms.identityservice.service;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import org.springframework.beans.factory.annotation.Value;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String secretKey;
    public String generateToken(String taiKhoan) {
        return Jwts.builder()
                .subject(taiKhoan) // Đưa tên tài khoản vào Token
                .issuedAt(new Date(System.currentTimeMillis())) // Thời gian phát hành
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24)) // Hạn sử dụng 1 ngày
                .signWith(getSignInKey()) // Ký xác nhận bằng chuỗi bí mật của cậu
                .compact(); // Đóng gói thành chuỗi String
    }

    // Hàm chuyển chuỗi bí mật thành dạng Key bảo mật mà hệ thống yêu cầu
    private SecretKey getSignInKey() {
        // Sử dụng mảng byte trực tiếp từ chuỗi của cậu thay vì Base64
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
    public void validateToken(String token) {
        // parser() sẽ tự động dùng secretKey để giải mã.
        // Nếu token bị sửa đổi hoặc hết hạn, hàm này sẽ tự động quăng lỗi (Exception).
        Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token);
    }
}
