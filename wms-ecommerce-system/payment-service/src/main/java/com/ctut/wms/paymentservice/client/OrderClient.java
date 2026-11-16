package com.ctut.wms.paymentservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

/**
 * Client gọi nội bộ sang order-service (kèm khóa nội bộ + vai trò SYSTEM).
 * Dùng RestTemplate nội bộ riêng (internalRestTemplate) để KHÔNG gửi khóa nội bộ sang cổng MoMo bên ngoài.
 */
@Component
@Slf4j
public class OrderClient {

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OrderSummary {
        private Long id;
        private String maDonHang;
        private String maGiaoDichGoc;
        private Long nguoiDungId;
        private BigDecimal tongThanhToan;
        private String trangThaiDonHang;
        private String trangThaiThanhToan;
    }

    private final RestTemplate restTemplate;
    private final String orderUrl;

    public OrderClient(@Qualifier("internalRestTemplate") RestTemplate restTemplate,
                       @Value("${services.order-url:http://order-service}") String orderUrl) {
        this.restTemplate = restTemplate; // @LoadBalanced: "order-service" được phân giải qua Eureka
        this.orderUrl = orderUrl;
    }

    /** Lấy các đơn hàng thuộc một mã đơn (DH-xxx) hoặc một phiên checkout gộp (CHECKOUT-xxx). */
    public List<OrderSummary> findOrders(String maDonHang, String maGiaoDichGoc) {
        try {
            if (maGiaoDichGoc != null && !maGiaoDichGoc.isBlank()) {
                OrderSummary[] arr = restTemplate.getForObject(
                        orderUrl + "/orders/checkout-session/{id}", OrderSummary[].class, maGiaoDichGoc);
                return arr != null ? Arrays.asList(arr) : List.of();
            }
            if (maDonHang != null && !maDonHang.isBlank()) {
                if (maDonHang.startsWith("CHECKOUT-")) {
                    return findOrders(null, maDonHang);
                }
                OrderSummary o = restTemplate.getForObject(orderUrl + "/orders/{ma}", OrderSummary.class, maDonHang);
                return o != null ? List.of(o) : List.of();
            }
            return List.of();
        } catch (HttpClientErrorException.NotFound e) {
            return List.of();
        } catch (RestClientException e) {
            log.error("Không kết nối được order-service: {}", e.getMessage());
            throw new RuntimeException("Lỗi: Hệ thống đơn hàng đang bận, vui lòng thử lại sau!");
        }
    }

    /** Đồng bộ trạng thái thanh toán sang order-service. */
    public void syncPaymentStatus(String maDonHangOrSession, String paymentStatus) {
        if (maDonHangOrSession == null) return;
        try {
            if (maDonHangOrSession.startsWith("CHECKOUT-")) {
                restTemplate.put(orderUrl + "/orders/checkout-session/{id}/payment-status?paymentStatus={st}",
                        null, maDonHangOrSession, paymentStatus);
            } else {
                restTemplate.put(orderUrl + "/orders/{id}/payment-status?paymentStatus={st}",
                        null, maDonHangOrSession, paymentStatus);
            }
        } catch (RestClientException e) {
            log.warn("Không thể gọi sang order-service để đồng bộ đơn {}: {}", maDonHangOrSession, e.getMessage());
        }
    }
}
