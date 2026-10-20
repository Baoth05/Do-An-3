package com.ctut.wms.paymentservice.service;

import com.ctut.wms.paymentservice.dto.MomoIpnRequest;
import com.ctut.wms.paymentservice.dto.PaymentRequest;
import com.ctut.wms.paymentservice.dto.PaymentResponse;
import com.ctut.wms.paymentservice.entity.GiaoDichMoMo;
import com.ctut.wms.paymentservice.repository.GiaoDichMoMoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final GiaoDichMoMoRepository repository;
    private final RestTemplate restTemplate;

    /**
     * Khởi tạo giao dịch thanh toán
     */
    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        if (request.getSoTien() == null || request.getSoTien().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0!");
        }

        String momoOrderId = "MOMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        GiaoDichMoMo giaoDich = new GiaoDichMoMo();
        giaoDich.setDonHangId(request.getDonHangId());
        giaoDich.setMomoOrderId(momoOrderId);
        giaoDich.setSoTien(request.getSoTien());
        giaoDich.setTrangThai("PENDING");

        repository.save(giaoDich);

        String paymentUrl = "https://test-payment.momo.vn/pay?orderId=" + momoOrderId + "&amount=" + request.getSoTien();

        return PaymentResponse.builder()
                .paymentUrl(paymentUrl)
                .momoOrderId(momoOrderId)
                .donHangId(request.getDonHangId())
                .soTien(request.getSoTien())
                .trangThai("PENDING")
                .message("Khởi tạo liên kết thanh toán MoMo thành công!")
                .build();
    }

    /**
     * Xử lý IPN từ MoMo Webhook (với kiểm tra chống gian lận & Idempotency)
     */
    @Transactional
    public String processIpn(MomoIpnRequest ipnRequest) {
        log.info("Nhận IPN từ MoMo cho đơn hàng MoMo: {}", ipnRequest.getOrderId());

        GiaoDichMoMo giaoDich = repository.findByMomoOrderId(ipnRequest.getOrderId())
                .orElseThrow(() -> new RuntimeException("Lỗ hổng: Không tìm thấy giao dịch tương ứng với orderId: " + ipnRequest.getOrderId()));

        // Kiểm tra Idempotency: Tránh xử lý lặp lại nếu MoMo retry IPN
        if ("SUCCESS".equalsIgnoreCase(giaoDich.getTrangThai())) {
            log.info("Giao dịch {} đã được xử lý thành công trước đó, bỏ qua lặp lại.", ipnRequest.getOrderId());
            return "SUCCESS_ALREADY_PROCESSED";
        }

        // Kiểm tra chống gian lận số tiền: Đối soát số tiền MoMo báo về với số tiền lưu trong DB
        if (ipnRequest.getAmount() != null && ipnRequest.getAmount().compareTo(giaoDich.getSoTien()) != 0) {
            log.error("CẢNH BÁO BẢO MẬT: Gian lận số tiền! DB yêu cầu: {}, MoMo báo về: {}", giaoDich.getSoTien(), ipnRequest.getAmount());
            giaoDich.setTrangThai("AMOUNT_MISMATCH");
            repository.save(giaoDich);
            throw new RuntimeException("Lỗi bảo mật: Số tiền thanh toán không khớp với hóa đơn!");
        }

        giaoDich.setMomoTransId(ipnRequest.getTransId());

        if (ipnRequest.getResultCode() != null && ipnRequest.getResultCode() == 0) {
            giaoDich.setTrangThai("SUCCESS");
            repository.save(giaoDich);

            // 🌟 KHẮC PHỤC LỖ HỔNG: Tự động đồng bộ sang Order Service để cập nhật Đơn Hàng
            syncOrderStatus(giaoDich.getDonHangId(), "ĐÃ THANH TOÁN");
            log.info("Đã đồng bộ đơn hàng {} sang trạng thái ĐÃ THANH TOÁN", giaoDich.getDonHangId());
        } else {
            giaoDich.setTrangThai("FAILED");
            repository.save(giaoDich);
            syncOrderStatus(giaoDich.getDonHangId(), "THANH TOÁN THẤT BẠI");
        }

        return "Processed IPN";
    }

    /**
     * Tiện ích Mock giả lập thanh toán thành công (Phục vụ Demo / Test nội bộ)
     */
    @Transactional
    public PaymentResponse mockPaymentSuccess(String momoOrderId) {
        GiaoDichMoMo giaoDich = repository.findByMomoOrderId(momoOrderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch với mã: " + momoOrderId));

        giaoDich.setMomoTransId(System.currentTimeMillis());
        giaoDich.setTrangThai("SUCCESS");
        repository.save(giaoDich);

        // Đồng bộ trạng thái đơn hàng sang order-service
        syncOrderStatus(giaoDich.getDonHangId(), "ĐÃ THANH TOÁN");

        return PaymentResponse.builder()
                .paymentUrl("https://test-payment.momo.vn/pay?orderId=" + momoOrderId)
                .momoOrderId(momoOrderId)
                .donHangId(giaoDich.getDonHangId())
                .soTien(giaoDich.getSoTien())
                .trangThai("SUCCESS")
                .message("Giả lập thanh toán MoMo thành công!")
                .build();
    }

    /**
     * Giả lập thanh toán theo mã đơn hàng
     */
    @Transactional
    public PaymentResponse mockPaymentSuccessByDonHangId(String donHangId) {
        GiaoDichMoMo giaoDich = repository.findByDonHangId(donHangId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch cho mã đơn hàng: " + donHangId));
        return mockPaymentSuccess(giaoDich.getMomoOrderId());
    }

    /**
     * Lấy trạng thái thanh toán hiện tại của đơn hàng
     */
    public GiaoDichMoMo getPaymentStatus(String donHangId) {
        return repository.findByDonHangId(donHangId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch cho đơn hàng: " + donHangId));
    }

    /**
     * Hàm gọi HTTP sang order-service để đồng bộ trạng thái đơn
     */
    private void syncOrderStatus(String maDonHang, String paymentStatus) {
        try {
            String orderUrl = "http://localhost:8082/orders/" + maDonHang + "/payment-status?paymentStatus=" + paymentStatus;
            restTemplate.put(orderUrl, null);
        } catch (Exception e) {
            log.warn("Không thể gọi sang order-service để đồng bộ đơn {}: {}", maDonHang, e.getMessage());
        }
    }
}