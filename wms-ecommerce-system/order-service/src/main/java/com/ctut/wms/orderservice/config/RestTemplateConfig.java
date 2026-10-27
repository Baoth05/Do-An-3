/**
 * ==============================================================================
 * Cấu Hình (Configuration): RestTemplateConfig
 * Phân hệ: Order Service (Quản lý đơn hàng & Tách đơn đa shop - Port 8082)
 * Mô tả: Lớp cấu hình hệ thống, bảo mật hoặc thiết lập các Spring Bean cho Order Service (Quản lý đơn hàng & Tách đơn đa shop - Port 8082).
 * ==============================================================================
 */
package com.ctut.wms.orderservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}