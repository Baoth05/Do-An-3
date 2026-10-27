/**
 * ==============================================================================
 * Lớp Khởi Động: IdentityServiceApplication
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Điểm khởi chạy ứng dụng Spring Boot chính cho Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084).
 * ==============================================================================
 */
package com.ctut.wms.identityservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class IdentityServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(IdentityServiceApplication.class, args);
    }

}
