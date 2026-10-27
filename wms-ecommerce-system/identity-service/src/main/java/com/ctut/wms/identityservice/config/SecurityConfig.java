/**
 * ==============================================================================
 * Cấu Hình (Configuration): SecurityConfig
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Lớp cấu hình hệ thống, bảo mật hoặc thiết lập các Spring Bean cho Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084).
 * ==============================================================================
 */
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
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // 1. Tắt CSRF
        http.csrf(AbstractHttpConfigurer::disable);

        // 2. Phân quyền các đường dẫn API
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/register", "/auth/login", "/auth/validate").permitAll()

                // 🌟 ĐÃ SỬA: Cung cấp cả đường dẫn chính xác (không có /**) và đường dẫn bao quát (có /**)
                .requestMatchers(
                        "/auth/stats", "/auth/stats/**",
                        "/auth/customers", "/auth/customers/**",
                        "/auth/staff", "/auth/staff/**",
                        "/auth/users", "/auth/users/**",
                        "/auth/change-password/**"


                ).permitAll()

                .anyRequest().authenticated()
        );

        return http.build();
    }

    // 🌟 ĐÃ XÓA TOÀN BỘ HÀM corsConfigurationSource() Ở DƯỚI NÀY
}