/**
 * ==============================================================================
 * Lớp Khởi Động: DiscoveryServerApplication
 * Phân hệ: Discovery Server (Eureka Service Registry - Port 8761)
 * Mô tả: Điểm khởi chạy ứng dụng Spring Boot chính cho Discovery Server (Eureka Service Registry - Port 8761).
 * ==============================================================================
 */
package com.ctut.wms.discoveryserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;
@SpringBootApplication
@EnableEurekaServer
public class DiscoveryServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(DiscoveryServerApplication.class, args);
    }

}
