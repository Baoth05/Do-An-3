/**
 * ==============================================================================
 * DTO (Data Transfer Object): PaymentRequest
 * Phân hệ: Payment Service (Cổng thanh toán MoMo VietQR & Web3 Crypto - Port 8085)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API PaymentRequest.
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
public class PaymentRequest {
    private String donHangId;
    private String maGiaoDichGoc; // Thanh toán gộp cho phiên Checkout đa shop
    private BigDecimal soTien;
    private String thongTinDonHang;
    private String redirectUrl;
    private String extraData;
}
