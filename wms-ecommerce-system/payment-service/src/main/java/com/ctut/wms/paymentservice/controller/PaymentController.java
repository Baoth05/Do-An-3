/**
 * ==============================================================================
 * Controller: PaymentController
 * Phân hệ: Payment Service (Cổng thanh toán đa kênh - Port 8085)
 * Mô tả: Xử lý giao dịch thanh toán MoMo VietQR và Web3 Crypto (USDT/ETH).
 * Chức năng chính:
 *   - POST /payments/momo/create: Khởi tạo giao dịch MoMo, sinh mã QR thanh toán.
 *   - POST /payments/momo/ipn: Nhận Webhook IPN từ MoMo để cập nhật trạng thái đơn hàng.
 *   - POST /payments/crypto/submit: Tiếp nhận và xác thực TxHash thanh toán On-chain Web3.
 * ==============================================================================
 */
package com.ctut.wms.paymentservice.controller;

import com.ctut.wms.paymentservice.dto.CryptoPaymentRequest;
import com.ctut.wms.paymentservice.dto.MomoIpnRequest;
import com.ctut.wms.paymentservice.dto.PaymentRequest;
import com.ctut.wms.paymentservice.dto.PaymentResponse;
import com.ctut.wms.paymentservice.entity.GiaoDichCrypto;
import com.ctut.wms.paymentservice.service.CryptoPaymentService;
import com.ctut.wms.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final CryptoPaymentService cryptoPaymentService;

    // 1. Khởi tạo giao dịch & liên kết thanh toán MoMo (hỗ trợ cả Cổng MoMo và Quét mã QR nhận tiền)
    @PostMapping("/create")
    public ResponseEntity<?> createPayment(@RequestBody PaymentRequest request) {
        try {
            return ResponseEntity.ok(paymentService.createPayment(request));
        } catch (com.ctut.wms.paymentservice.security.ForbiddenException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 2. Webhook nhận kết quả từ MoMo IPN tự động
    @PostMapping("/momo-ipn")
    public ResponseEntity<String> handleMomoIpn(@RequestBody MomoIpnRequest ipnRequest) {
        try {
            return ResponseEntity.ok(paymentService.processIpn(ipnRequest));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 3. Kiểm tra trạng thái giao dịch theo mã đơn hàng
    @GetMapping("/status/{donHangId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable String donHangId) {
        try {
            return ResponseEntity.ok(paymentService.getPaymentStatus(donHangId));
        } catch (com.ctut.wms.paymentservice.security.ForbiddenException e) {
            return ResponseEntity.status(403).body(e.getMessage());
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

    // 7. Web3 / Crypto: Gửi xác nhận giao dịch thanh toán Crypto trên Blockchain
    @PostMapping("/crypto/submit")
    public ResponseEntity<?> submitCryptoPayment(@RequestBody CryptoPaymentRequest request) {
        try {
            return ResponseEntity.ok(cryptoPaymentService.submitCryptoPayment(request));
        } catch (com.ctut.wms.paymentservice.security.ForbiddenException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 7b. Web3 / Crypto: Admin xác nhận giao dịch sau khi đã đối soát trên Blockchain Explorer
    @PostMapping("/crypto/{id}/confirm")
    public ResponseEntity<?> confirmCryptoPayment(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(cryptoPaymentService.confirmTransaction(id));
        } catch (com.ctut.wms.paymentservice.security.ForbiddenException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 7c. Web3 / Crypto: Admin từ chối giao dịch (đơn hàng tự động được hủy & nhả tồn kho)
    @PostMapping("/crypto/{id}/reject")
    public ResponseEntity<?> rejectCryptoPayment(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(cryptoPaymentService.rejectTransaction(id));
        } catch (com.ctut.wms.paymentservice.security.ForbiddenException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 8. Web3 / Crypto: Tra cứu các giao dịch Crypto theo mã phiên Checkout gộp
    @GetMapping("/crypto/session/{maGiaoDichGoc}")
    public ResponseEntity<List<GiaoDichCrypto>> getCryptoTransactionsBySession(@PathVariable String maGiaoDichGoc) {
        return ResponseEntity.ok(cryptoPaymentService.getTransactionsBySession(maGiaoDichGoc));
    }

    // 9. Web3 / Crypto: Lấy tất cả giao dịch Crypto
    @GetMapping("/crypto")
    public ResponseEntity<List<GiaoDichCrypto>> getAllCryptoTransactions() {
        com.ctut.wms.paymentservice.security.CurrentUser.requireAdmin();
        return ResponseEntity.ok(cryptoPaymentService.getAllTransactions());
    }
}
