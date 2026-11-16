package com.ctut.wms.orderservice.config;

import com.ctut.wms.orderservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Job đối soát định kỳ: đơn thanh toán online (MoMo / Crypto) quá thời hạn mà chưa thanh toán
 * sẽ bị hủy tự động (CANCELLED_PAYMENT_FAILED), nhả tồn kho giữ chỗ và hoàn lượt voucher.
 * Job cũng thử lại các đơn đã nhận IPN thất bại nhưng chưa rollback được do kho tạm thời không phản hồi.
 */
@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class PaymentTimeoutJob {

    private final OrderService orderService;

    @Value("${order.payment-timeout-minutes:30}")
    private long timeoutMinutes;

    @Scheduled(fixedDelayString = "${order.payment-timeout-check-ms:300000}", initialDelay = 60000)
    public void cancelExpiredUnpaidOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(timeoutMinutes);
        List<Long> expired = orderService.findExpiredUnpaidOnlineOrders(cutoff);
        if (expired.isEmpty()) return;

        int done = 0;
        for (Long id : expired) {
            try {
                if (orderService.rollbackUnpaidOrder(id, "quá hạn thanh toán " + timeoutMinutes + " phút")) {
                    done++;
                }
            } catch (RuntimeException e) {
                // Kho chưa phản hồi / đơn đã xuất kho: để lần chạy sau xử lý hoặc cần Admin can thiệp
                log.warn("Chưa thể hủy đơn quá hạn ID {}: {}", id, e.getMessage());
            }
        }
        log.info("Job đối soát thanh toán: đã hủy {}/{} đơn quá hạn.", done, expired.size());
    }
}
