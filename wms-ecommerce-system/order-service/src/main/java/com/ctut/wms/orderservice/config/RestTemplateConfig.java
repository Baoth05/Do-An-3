/**
 * ==============================================================================
 * Cấu Hình (Configuration): RestTemplateConfig
 * Phân hệ: Order Service (Quản lý đơn hàng & Tách đơn đa shop - Port 8082)
 * Mô tả: RestTemplate gọi nội bộ sang các microservice khác (WMS Core):
 *   - @LoadBalanced: gọi theo TÊN service đăng ký trên Eureka (http://wms-core-service), không viết cứng host/port.
 *   - Timeout kết nối / đọc để một service chậm không kéo treo order-service.
 *   - Tự động gắn khóa nội bộ X-Internal-Secret và vai trò SYSTEM.
 * ==============================================================================
 */
package com.ctut.wms.orderservice.config;

import com.ctut.wms.orderservice.security.InternalCallInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class RestTemplateConfig {

    @Bean
    @LoadBalanced
    public RestTemplate restTemplate(@Value("${internal.secret}") String internalSecret,
                                     @Value("${services.connect-timeout-ms:3000}") long connectTimeoutMs,
                                     @Value("${services.read-timeout-ms:5000}") long readTimeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        factory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        RestTemplate restTemplate = new RestTemplate(factory);
        restTemplate.getInterceptors().add(new InternalCallInterceptor(internalSecret, "order-service"));
        return restTemplate;
    }
}
