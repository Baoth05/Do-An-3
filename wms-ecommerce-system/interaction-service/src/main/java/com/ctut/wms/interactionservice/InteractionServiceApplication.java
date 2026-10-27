/**
 * ==============================================================================
 * Lớp Khởi Động: InteractionServiceApplication
 * Phân hệ: Interaction Service (Đánh giá, nhận xét & hỏi đáp - Port 8083)
 * Mô tả: Điểm khởi chạy ứng dụng Spring Boot chính cho Interaction Service (Đánh giá, nhận xét & hỏi đáp - Port 8083).
 * ==============================================================================
 */
package com.ctut.wms.interactionservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class InteractionServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(InteractionServiceApplication.class, args);
    }

}
