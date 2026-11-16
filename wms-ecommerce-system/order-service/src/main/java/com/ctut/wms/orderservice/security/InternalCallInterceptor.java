package com.ctut.wms.orderservice.security;

import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;

import java.io.IOException;

/**
 * Gắn khóa nội bộ + vai trò SYSTEM cho các lời gọi RestTemplate sang microservice khác.
 */
public class InternalCallInterceptor implements ClientHttpRequestInterceptor {

    private final String internalSecret;
    private final String serviceName;

    public InternalCallInterceptor(String internalSecret, String serviceName) {
        this.internalSecret = internalSecret;
        this.serviceName = serviceName;
    }

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
        request.getHeaders().set(InternalAuthFilter.HEADER_INTERNAL_SECRET, internalSecret);
        request.getHeaders().set(CurrentUser.HEADER_ROLE, "SYSTEM");
        request.getHeaders().set(CurrentUser.HEADER_ACCOUNT, serviceName);
        return execution.execute(request, body);
    }
}
