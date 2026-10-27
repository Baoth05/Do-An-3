/**
 * ==============================================================================
 * Entity: GiaoDichMoMo
 * Phân hệ: Payment Service (Cổng thanh toán MoMo VietQR & Web3 Crypto - Port 8085)
 * Mô tả: Thực thể cơ sở dữ liệu ánh xạ bảng lưu trữ dữ liệu GiaoDichMoMo trong cơ sở dữ liệu.
 * ==============================================================================
 */
package com.ctut.wms.paymentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "giao_dich_momo")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GiaoDichMoMo extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "don_hang_id")
    private String donHangId; // Mã đơn hàng từ E-commerce / Order Service

    @Column(name = "ma_giao_dich_goc", length = 50)
    private String maGiaoDichGoc; // Mã phiên Checkout gộp đa shop

    @Column(name = "momo_order_id", unique = true, nullable = false)
    private String momoOrderId; // Mã giao dịch định danh phía MoMo

    @Column(name = "momo_request_id")
    private String momoRequestId; // Request ID gửi MoMo

    @Column(name = "momo_trans_id")
    private Long momoTransId; // Mã giao dịch thực tế MoMo sinh ra sau khi trả tiền

    @Column(name = "so_tien", nullable = false)
    private BigDecimal soTien;

    @Column(name = "phuong_thuc")
    private String phuongThuc = "MOMO";

    @Column(name = "thong_tin_don_hang")
    private String thongTinDonHang;

    @Column(name = "pay_url", columnDefinition = "TEXT")
    private String payUrl; // Đường dẫn trang thanh toán MoMo

    @Column(name = "qr_code_url", columnDefinition = "TEXT")
    private String qrCodeUrl; // Link ảnh QR Code MoMo để quét thanh toán

    @Column(name = "deeplink", columnDefinition = "TEXT")
    private String deeplink; // Deeplink mở ứng dụng MoMo trên điện thoại

    @Column(name = "so_dien_thoai_nhan_tien")
    private String soDienThoaiNhanTien; // Số điện thoại ví MoMo thụ hưởng

    @Column(name = "ten_nguoi_nhan")
    private String tenNguoiNhan;

    // PENDING, SUCCESS, FAILED, AMOUNT_MISMATCH
    @Column(name = "trang_thai")
    private String trangThai = "PENDING";
}
