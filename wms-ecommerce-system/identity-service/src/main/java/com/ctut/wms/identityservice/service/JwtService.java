package com.ctut.wms.identityservice.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    // Khóa bí mật đã đồng bộ chuẩn Base64 để khớp với Gateway
    public static final String SECRET = "5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437";

    public String generateToken(String taiKhoan) {
        return Jwts.builder()
                .subject(taiKhoan) // Ở bản 0.12.x dùng subject() thay vì setSubject()
                .issuedAt(new Date(System.currentTimeMillis())) // Dùng issuedAt() thay vì setIssuedAt()
                // Hạn sử dụng 1 ngày
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24))
                // Ở bản 0.12.x, chỉ cần truyền SecretKey, hệ thống sẽ tự nhận diện thuật toán mã hóa
                .signWith(getSignInKey())
                .compact();
    }

    // Ở bản 0.12.x, bắt buộc trả về SecretKey thay vì Key chung chung
    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET);
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