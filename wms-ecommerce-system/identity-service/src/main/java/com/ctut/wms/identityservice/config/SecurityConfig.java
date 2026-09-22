package com.ctut.wms.identityservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // Sử dụng thuật toán Bcrypt
    }
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. Tắt tính năng bảo vệ CSRF vì hệ thống sử dụng REST API (JSON)
                .csrf(AbstractHttpConfigurer::disable)

                // 2. Thiết lập quy tắc cấp quyền truy cập cho các đường dẫn
                .authorizeHttpRequests(auth -> auth
                        // Cho phép tất cả mọi người truy cập tự do vào nhóm API xác thực
                        .requestMatchers("/auth/**").permitAll()
                        // Yêu cầu phải đăng nhập đối với tất cả các API còn lại
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}