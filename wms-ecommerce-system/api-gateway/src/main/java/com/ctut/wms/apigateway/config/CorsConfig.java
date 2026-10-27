/**
 * ==============================================================================
 * Cấu Hình (Configuration): CorsConfig
 * Phân hệ: API Gateway (Cổng định tuyến tập trung - Port 8080)
 * Mô tả: Lớp cấu hình hệ thống, bảo mật hoặc thiết lập các Spring Bean cho API Gateway (Cổng định tuyến tập trung - Port 8080).
 * ==============================================================================
 */
package com.ctut.wms.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();

        // Cho phép các nguồn từ Frontend truy cập vào hệ thống
        corsConfig.addAllowedOrigin("http://localhost:5173");
        corsConfig.addAllowedOrigin("http://localhost:5174");

        // Cho phép mọi phương thức HTTP (GET, POST, PUT, DELETE, OPTIONS,...)
        corsConfig.addAllowedMethod("*");

        // Cho phép mọi tiêu đề (Headers) gửi kèm trong yêu cầu
        corsConfig.addAllowedHeader("*");

        // Cho phép lưu trữ thông tin xác thực (Token, Cookie)
        corsConfig.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}