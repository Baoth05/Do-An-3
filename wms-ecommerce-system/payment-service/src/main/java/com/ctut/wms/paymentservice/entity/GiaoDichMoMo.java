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

    @Column(name = "don_hang_id", nullable = false)
    private String donHangId; // Nhận từ Order Service

    @Column(name = "momo_order_id", unique = true, nullable = false)
    private String momoOrderId; // Mã nội bộ gửi cho MoMo

    @Column(name = "momo_trans_id")
    private Long momoTransId; // Mã MoMo trả về sau khi thanh toán

    @Column(name = "so_tien", nullable = false)
    private BigDecimal soTien;

    @Column(name = "phuong_thuc")
    private String phuongThuc = "MOMO";

    // PENDING (Đang chờ), SUCCESS (Thành công), FAILED (Thất bại)
    @Column(name = "trang_thai")
    private String trangThai = "PENDING";
}