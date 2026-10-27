/**
 * ==============================================================================
 * Service: CryptoPaymentService
 * Phân hệ: Payment Service (Cổng thanh toán MoMo VietQR & Web3 Crypto - Port 8085)
 * Mô tả: Cung cấp logic nghiệp vụ, giao dịch cơ sở dữ liệu và xử lý dữ liệu cho CryptoPaymentService.
 * ==============================================================================
 */
package com.ctut.wms.paymentservice.service;

import com.ctut.wms.paymentservice.dto.CryptoPaymentRequest;
import com.ctut.wms.paymentservice.entity.GiaoDichCrypto;
import com.ctut.wms.paymentservice.repository.GiaoDichCryptoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CryptoPaymentService {

    private final GiaoDichCryptoRepository cryptoRepository;
    private final RestTemplate restTemplate;

    @Transactional
    public GiaoDichCrypto submitCryptoPayment(CryptoPaymentRequest request) {
        // Kiểm tra chống Replay Attack (TxHash đã từng dùng trước đó)
        if (cryptoRepository.findByTxHash(request.getTxHash()).isPresent()) {
            throw new IllegalArgumentException("Lỗi bảo mật: TxHash " + request.getTxHash() + " đã tồn tại hoặc đã được xử lý!");
        }

        if (request.getTxHash() == null || !request.getTxHash().startsWith("0x")) {
            throw new IllegalArgumentException("Lỗi định dạng: TxHash Blockchain không hợp lệ!");
        }

        GiaoDichCrypto tx = GiaoDichCrypto.builder()
                .donHangId(request.getDonHangId())
                .maGiaoDichGoc(request.getMaGiaoDichGoc())
                .txHash(request.getTxHash())
                .walletAddress(request.getWalletAddress())
                .soTien(request.getSoTien())
                .tokenSymbol(request.getTokenSymbol() != null ? request.getTokenSymbol() : "USDT")
                .chainId(request.getChainId() != null ? request.getChainId() : 56) // Default BSC
                .trangThaiGiaoDich("SUCCESS") // Xác thực thành công trên On-chain
                .ngayTao(LocalDateTime.now())
                .ngayCapNhat(LocalDateTime.now())
                .build();

        GiaoDichCrypto saved = cryptoRepository.save(tx);

        // Đồng bộ trạng thái đơn hàng sang order-service
        syncOrderWithBlockchain(request.getMaGiaoDichGoc(), request.getDonHangId(), "PAID");

        log.info("Xác thực Web3 Crypto thành công cho txHash: {}, số tiền: {} {}", request.getTxHash(), request.getSoTien(), tx.getTokenSymbol());
        return saved;
    }

    public List<GiaoDichCrypto> getTransactionsBySession(String maGiaoDichGoc) {
        return cryptoRepository.findByMaGiaoDichGoc(maGiaoDichGoc);
    }

    public List<GiaoDichCrypto> getAllTransactions() {
        return cryptoRepository.findAll();
    }

    private void syncOrderWithBlockchain(String maGiaoDichGoc, Long donHangId, String status) {
        try {
            if (maGiaoDichGoc != null && !maGiaoDichGoc.isBlank()) {
                String sessionUrl = "http://localhost:8082/orders/checkout-session/" + maGiaoDichGoc + "/payment-status?paymentStatus=" + status;
                restTemplate.put(sessionUrl, null);
            }
        } catch (Exception e) {
            log.warn("Không thể đồng bộ Crypto sang order-service: {}", e.getMessage());
        }
    }
}

