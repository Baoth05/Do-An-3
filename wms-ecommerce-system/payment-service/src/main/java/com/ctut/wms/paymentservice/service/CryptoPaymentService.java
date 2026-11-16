/**
 * ==============================================================================
 * Service: CryptoPaymentService
 * Phân hệ: Payment Service (Cổng thanh toán MoMo VietQR & Web3 Crypto - Port 8085)
 * Mô tả: Tiếp nhận TxHash thanh toán Crypto.
 *   Hệ thống CHƯA kết nối node Blockchain để tự xác minh giao dịch, vì vậy giao dịch được lưu ở trạng thái
 *   PENDING_VERIFICATION và chỉ chuyển đơn hàng sang ĐÃ THANH TOÁN khi Admin đã đối soát và xác nhận.
 * ==============================================================================
 */
package com.ctut.wms.paymentservice.service;

import com.ctut.wms.paymentservice.client.OrderClient;
import com.ctut.wms.paymentservice.dto.CryptoPaymentRequest;
import com.ctut.wms.paymentservice.entity.GiaoDichCrypto;
import com.ctut.wms.paymentservice.repository.GiaoDichCryptoRepository;
import com.ctut.wms.paymentservice.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class CryptoPaymentService {

    public static final String PENDING_VERIFICATION = "PENDING_VERIFICATION";
    public static final String PENDING_VERIFICATION_ORDER_STATUS = "CHỜ XÁC MINH";

    // TxHash EVM chuẩn: 0x + 64 ký tự hex
    private static final Pattern TX_HASH = Pattern.compile("^0x[0-9a-fA-F]{64}$");

    private final GiaoDichCryptoRepository cryptoRepository;
    private final OrderClient orderClient;

    @Transactional
    public GiaoDichCrypto submitCryptoPayment(CryptoPaymentRequest request) {
        if (request.getTxHash() == null || !TX_HASH.matcher(request.getTxHash()).matches()) {
            throw new IllegalArgumentException("Lỗi định dạng: TxHash Blockchain không hợp lệ!");
        }
        // Chống Replay Attack (TxHash đã từng dùng trước đó)
        if (cryptoRepository.findByTxHash(request.getTxHash()).isPresent()) {
            throw new IllegalArgumentException("Lỗi bảo mật: TxHash " + request.getTxHash() + " đã tồn tại hoặc đã được xử lý!");
        }
        if (request.getMaGiaoDichGoc() == null || request.getMaGiaoDichGoc().isBlank()) {
            throw new IllegalArgumentException("Thiếu mã phiên thanh toán!");
        }

        // Phiên checkout phải tồn tại và thuộc về người đang thanh toán
        List<OrderClient.OrderSummary> orders = orderClient.findOrders(null, request.getMaGiaoDichGoc());
        if (orders.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy phiên thanh toán " + request.getMaGiaoDichGoc() + "!");
        }
        orders.forEach(o -> CurrentUser.requireSelfOrAdmin(o.getNguoiDungId()));
        for (OrderClient.OrderSummary o : orders) {
            if (o.getTrangThaiDonHang() != null && o.getTrangThaiDonHang().toUpperCase().startsWith("CANCELLED")) {
                throw new IllegalArgumentException("Đơn hàng " + o.getMaDonHang() + " đã bị hủy (quá hạn thanh toán), không thể thanh toán!");
            }
        }

        GiaoDichCrypto tx = GiaoDichCrypto.builder()
                .donHangId(request.getDonHangId())
                .maGiaoDichGoc(request.getMaGiaoDichGoc())
                .txHash(request.getTxHash())
                .walletAddress(request.getWalletAddress())
                .soTien(request.getSoTien())
                .tokenSymbol(request.getTokenSymbol() != null ? request.getTokenSymbol() : "USDT")
                .chainId(request.getChainId() != null ? request.getChainId() : 56) // Default BSC
                .trangThaiGiaoDich(PENDING_VERIFICATION) // Chờ Admin đối soát on-chain
                .ngayTao(LocalDateTime.now())
                .ngayCapNhat(LocalDateTime.now())
                .build();

        GiaoDichCrypto saved = cryptoRepository.save(tx);
        // Đánh dấu đơn đang chờ xác minh để job hủy đơn quá hạn không hủy nhầm
        orderClient.syncPaymentStatus(request.getMaGiaoDichGoc(), PENDING_VERIFICATION_ORDER_STATUS);
        log.info("Đã ghi nhận TxHash {} cho phiên {}, chờ Admin xác minh.", request.getTxHash(), request.getMaGiaoDichGoc());
        return saved;
    }

    /** Admin xác nhận giao dịch Crypto sau khi đã kiểm tra trên Blockchain Explorer. */
    @Transactional
    public GiaoDichCrypto confirmTransaction(Long id) {
        CurrentUser.requireAdmin();
        GiaoDichCrypto tx = cryptoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch Crypto ID = " + id));
        if ("SUCCESS".equalsIgnoreCase(tx.getTrangThaiGiaoDich())) {
            return tx;
        }
        tx.setTrangThaiGiaoDich("SUCCESS");
        tx.setNgayCapNhat(LocalDateTime.now());
        GiaoDichCrypto saved = cryptoRepository.save(tx);
        orderClient.syncPaymentStatus(tx.getMaGiaoDichGoc(), "PAID");
        return saved;
    }

    /** Admin từ chối giao dịch Crypto (TxHash không hợp lệ / sai số tiền) => đơn bị rollback. */
    @Transactional
    public GiaoDichCrypto rejectTransaction(Long id) {
        CurrentUser.requireAdmin();
        GiaoDichCrypto tx = cryptoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch Crypto ID = " + id));
        if ("SUCCESS".equalsIgnoreCase(tx.getTrangThaiGiaoDich())) {
            throw new RuntimeException("Giao dịch đã được xác nhận thành công, không thể từ chối!");
        }
        tx.setTrangThaiGiaoDich("INVALID");
        tx.setNgayCapNhat(LocalDateTime.now());
        GiaoDichCrypto saved = cryptoRepository.save(tx);
        // order-service tự động hủy đơn (CANCELLED_PAYMENT_FAILED), nhả tồn kho & hoàn voucher
        orderClient.syncPaymentStatus(tx.getMaGiaoDichGoc(), "THANH TOÁN THẤT BẠI");
        return saved;
    }

    public List<GiaoDichCrypto> getTransactionsBySession(String maGiaoDichGoc) {
        List<OrderClient.OrderSummary> orders = orderClient.findOrders(null, maGiaoDichGoc);
        orders.forEach(o -> CurrentUser.requireSelfOrAdmin(o.getNguoiDungId()));
        return cryptoRepository.findByMaGiaoDichGoc(maGiaoDichGoc);
    }

    public List<GiaoDichCrypto> getAllTransactions() {
        CurrentUser.requireAdmin();
        return cryptoRepository.findAll();
    }
}
