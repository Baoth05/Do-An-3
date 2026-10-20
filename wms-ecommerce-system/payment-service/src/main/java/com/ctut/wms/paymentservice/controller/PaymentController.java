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

    // 1. Khởi tạo giao dịch & liên kết thanh toán MoMo (hỗ trợ cả Cổng MoMo và Quét mã QR nhận tiền)
    @PostMapping("/create")
    public ResponseEntity<PaymentResponse> createPayment(@RequestBody PaymentRequest request) {
        return ResponseEntity.ok(paymentService.createPayment(request));
    }

    // 2. Webhook nhận kết quả từ MoMo IPN tự động
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

    // 4. Xác nhận tiền đã vào tài khoản MoMo (Dành cho Quản trị viên / Thủ kho đối soát giao dịch)
    @PostMapping("/confirm-manual/{donHangId}")
    public ResponseEntity<PaymentResponse> confirmManualPayment(
            @PathVariable String donHangId,
            @RequestParam(required = false) Long transId,
            @RequestParam(required = false) String ghiChu) {
        return ResponseEntity.ok(paymentService.confirmManualPayment(donHangId, transId, ghiChu));
    }

    // 5. Tiện ích Mock thanh toán thành công theo momoOrderId (phục vụ Demo / Test)
    @PostMapping("/mock-success/{momoOrderId}")
    public ResponseEntity<PaymentResponse> mockPaymentSuccess(@PathVariable String momoOrderId) {
        return ResponseEntity.ok(paymentService.mockPaymentSuccess(momoOrderId));
    }

    // 6. Tiện ích Mock thanh toán thành công theo mã đơn hàng donHangId (phục vụ Demo / Test)
    @PostMapping("/mock-success-order/{donHangId}")
    public ResponseEntity<PaymentResponse> mockPaymentSuccessByDonHangId(@PathVariable String donHangId) {
        return ResponseEntity.ok(paymentService.mockPaymentSuccessByDonHangId(donHangId));
    }
}
