package com.ctut.wms.paymentservice.controller;

import com.ctut.wms.paymentservice.dto.MomoIpnRequest;
import com.ctut.wms.paymentservice.dto.PaymentRequest;
import com.ctut.wms.paymentservice.dto.PaymentResponse;
import com.ctut.wms.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // 1. Tạo liên kết thanh toán MoMo
    @PostMapping("/create")
    public ResponseEntity<PaymentResponse> createPayment(@RequestBody PaymentRequest request) {
        return ResponseEntity.ok(paymentService.createPayment(request));
    }

    // 2. Webhook nhận kết quả từ MoMo IPN
    @PostMapping("/momo-ipn")
    public ResponseEntity<String> handleMomoIpn(@RequestBody MomoIpnRequest ipnRequest) {
        return ResponseEntity.ok(paymentService.processIpn(ipnRequest));
    }

    // 3. Kiểm tra trạng thái giao dịch theo mã đơn hàng
    @GetMapping("/status/{donHangId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable String donHangId) {
        try {
            return ResponseEntity.ok(paymentService.getPaymentStatus(donHangId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 4. Tiện ích Mock thanh toán thành công theo momoOrderId (phục vụ Demo / Test)
    @PostMapping("/mock-success/{momoOrderId}")
    public ResponseEntity<PaymentResponse> mockPaymentSuccess(@PathVariable String momoOrderId) {
        return ResponseEntity.ok(paymentService.mockPaymentSuccess(momoOrderId));
    }

    // 5. Tiện ích Mock thanh toán thành công theo mã đơn hàng donHangId (phục vụ Demo / Test)
    @PostMapping("/mock-success-order/{donHangId}")
    public ResponseEntity<PaymentResponse> mockPaymentSuccessByDonHangId(@PathVariable String donHangId) {
        return ResponseEntity.ok(paymentService.mockPaymentSuccessByDonHangId(donHangId));
    }
}