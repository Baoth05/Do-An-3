/**
 * ==============================================================================
 * Lớp Khởi Động: ApiGatewayApplication
 * Phân hệ: API Gateway (Cổng định tuyến tập trung - Port 8080)
 * Mô tả: Điểm khởi chạy ứng dụng Spring Boot chính cho API Gateway (Cổng định tuyến tập trung - Port 8080).
 * ==============================================================================
 */
package com.ctut.wms.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

}
