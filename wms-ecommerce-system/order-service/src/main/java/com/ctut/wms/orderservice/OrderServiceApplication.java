/**
 * ==============================================================================
 * Lớp Khởi Động: OrderServiceApplication
 * Phân hệ: Order Service (Quản lý đơn hàng & Tách đơn đa shop - Port 8082)
 * Mô tả: Điểm khởi chạy ứng dụng Spring Boot chính cho Order Service (Quản lý đơn hàng & Tách đơn đa shop - Port 8082).
 * ==============================================================================
 */
package com.ctut.wms.orderservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class OrderServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }

}
