package com.ctut.wms.interactionservice.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Client gọi nội bộ sang order-service để xác minh người đánh giá đã thực sự mua sản phẩm.
 */
@Component
@Slf4j
public class OrderClient {

    private final RestTemplate restTemplate;
    private final String orderUrl;

    public OrderClient(@Qualifier("internalRestTemplate") RestTemplate restTemplate,
                       @Value("${services.order-url:http://order-service}") String orderUrl) {
        this.restTemplate = restTemplate; // @LoadBalanced: "order-service" được phân giải qua Eureka
        this.orderUrl = orderUrl;
    }

    /** true nếu người dùng đã mua & nhận sản phẩm; false nếu chưa hoặc không xác minh được. */
    public boolean hasPurchased(Long nguoiDungId, String maHangHoa) {
        if (nguoiDungId == null || maHangHoa == null) return false;
        try {
            Boolean result = restTemplate.getForObject(
                    orderUrl + "/orders/purchased?nguoiDungId={uid}&maHangHoa={ma}",
                    Boolean.class, nguoiDungId, maHangHoa);
            return Boolean.TRUE.equals(result);
        } catch (RestClientException e) {
            log.warn("Không xác minh được lịch sử mua hàng của user {}: {}", nguoiDungId, e.getMessage());
            return false;
        }
    }
}
