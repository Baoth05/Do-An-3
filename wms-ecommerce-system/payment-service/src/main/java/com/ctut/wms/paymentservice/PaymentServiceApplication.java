/**
 * ==============================================================================
 * Lớp Khởi Động: PaymentServiceApplication
 * Phân hệ: Payment Service (Cổng thanh toán MoMo VietQR & Web3 Crypto - Port 8085)
 * Mô tả: Điểm khởi chạy ứng dụng Spring Boot chính cho Payment Service (Cổng thanh toán MoMo VietQR & Web3 Crypto - Port 8085).
 * ==============================================================================
 */
package com.ctut.wms.paymentservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;


@SpringBootApplication
@EnableDiscoveryClient
public class PaymentServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaymentServiceApplication.class, args);
    }

    // RestTemplate được cấu hình trong config/RestClientsConfig (tách gọi MoMo bên ngoài và gọi nội bộ qua Eureka)

}
