/**
 * ==============================================================================
 * DTO (Data Transfer Object): PaymentResponse
 * Phân hệ: Payment Service (Cổng thanh toán MoMo VietQR & Web3 Crypto - Port 8085)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API PaymentResponse.
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
public class PaymentResponse {
    private String paymentUrl;     // URL thanh toán qua Cổng MoMo chính thức
    private String qrCodeUrl;       // Link hình ảnh QR Code quét bằng App MoMo
    private String deeplink;        // Link mở trực tiếp App MoMo trên điện thoại
    private String momoOrderId;     // Mã giao dịch MoMo
    private String donHangId;       // Mã đơn hàng
    private String maGiaoDichGoc;   // Mã phiên checkout gộp
    private BigDecimal soTien;      // Số tiền cần thanh toán
    private String trangThai;       // Trạng thái giao dịch
    private String message;         // Thông báo phản hồi
    private String accountNumber;   // Số điện thoại tài khoản MoMo nhận tiền
    private String accountName;     // Tên chủ tài khoản MoMo thụ hưởng
    private String transferContent; // Nội dung chuyển khoản đối soát
}
