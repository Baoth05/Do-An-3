/**
 * ==============================================================================
 * DTO (Data Transfer Object): CryptoPaymentRequest
 * Phân hệ: Payment Service (Cổng thanh toán MoMo VietQR & Web3 Crypto - Port 8085)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API CryptoPaymentRequest.
 * ==============================================================================
 */
package com.ctut.wms.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CryptoPaymentRequest {
    private Long donHangId;
    private String maGiaoDichGoc;
    private String txHash;
    private String walletAddress;
    private BigDecimal soTien;
    private String tokenSymbol; // USDT, ETH, BNB...
    private Integer chainId; // 1 (ETH), 56 (BSC), 137 (Polygon)
}

