package com.ctut.wms.interactionservice.config;

import com.ctut.wms.interactionservice.security.InternalCallInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/** RestTemplate gọi nội bộ sang order-service qua Eureka (@LoadBalanced), có timeout và khóa nội bộ. */
@Configuration
public class RestClientsConfig {

    @Bean
    @LoadBalanced
    public RestTemplate internalRestTemplate(@Value("${internal.secret}") String internalSecret,
                                             @Value("${services.connect-timeout-ms:3000}") long connectMs,
                                             @Value("${services.read-timeout-ms:5000}") long readMs) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(Duration.ofMillis(connectMs));
        f.setReadTimeout(Duration.ofMillis(readMs));
        RestTemplate rt = new RestTemplate(f);
        rt.getInterceptors().add(new InternalCallInterceptor(internalSecret, "interaction-service"));
        return rt;
    }
}
