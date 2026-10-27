/**
 * ==============================================================================
 * Lớp Khởi Động: WmsCoreServiceApplication
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Điểm khởi chạy ứng dụng Spring Boot chính cho WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081).
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class WmsCoreServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(WmsCoreServiceApplication.class, args);
    }

}
