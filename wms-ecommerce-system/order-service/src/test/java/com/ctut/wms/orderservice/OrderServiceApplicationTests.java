package com.ctut.wms.orderservice;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

// Test tích hợp: cần PostgreSQL đang chạy. Bật bằng biến môi trường RUN_INTEGRATION_TESTS=true
// (VD sau khi chạy docker compose up -d postgres) để không vô tình ghi vào CSDL đang dùng.
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "RUN_INTEGRATION_TESTS", matches = "true")
class OrderServiceApplicationTests {

    @Test
    void contextLoads() {
    }

}
