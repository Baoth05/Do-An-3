package com.ctut.wms.paymentservice.config;

import com.ctut.wms.paymentservice.security.InternalCallInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Hai RestTemplate tách biệt:
 *  - restTemplate (mặc định): gọi cổng MoMo BÊN NGOÀI, không gắn khóa nội bộ.
 *  - internalRestTemplate: gọi order-service qua Eureka (@LoadBalanced), có khóa nội bộ & vai trò SYSTEM.
 */
@Configuration
public class RestClientsConfig {

    private static SimpleClientHttpRequestFactory timeouts(long connectMs, long readMs) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(Duration.ofMillis(connectMs));
        f.setReadTimeout(Duration.ofMillis(readMs));
        return f;
    }

    @Bean
    @Primary
    public RestTemplate restTemplate(@Value("${momo.timeout-ms:10000}") long momoTimeoutMs) {
        return new RestTemplate(timeouts(momoTimeoutMs, momoTimeoutMs));
    }

    @Bean
    @LoadBalanced
    public RestTemplate internalRestTemplate(@Value("${internal.secret}") String internalSecret,
                                             @Value("${services.connect-timeout-ms:3000}") long connectMs,
                                             @Value("${services.read-timeout-ms:5000}") long readMs) {
        RestTemplate rt = new RestTemplate(timeouts(connectMs, readMs));
        rt.getInterceptors().add(new InternalCallInterceptor(internalSecret, "payment-service"));
        return rt;
    }
}
