/**
 * ==============================================================================
 * Entity: Voucher
 * Phân hệ: Order Service (Quản lý đơn hàng & Tách đơn đa shop - Port 8082)
 * Mô tả: Thực thể cơ sở dữ liệu ánh xạ bảng lưu trữ dữ liệu Voucher trong cơ sở dữ liệu.
 * ==============================================================================
 */
package com.ctut.wms.orderservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "voucher")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Voucher extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Logical FK Nullable: Null nếu là Voucher Toàn Sàn (Admin tạo), có ID nếu là Voucher riêng của Shop
    @Column(name = "cua_hang_id")
    private Long cuaHangId;

    @Column(name = "ma_voucher", unique = true, nullable = false)
    private String maVoucher;

    @Column(name = "phan_tram_giam")
    private Integer phanTramGiam;

    @Column(name = "giam_toi_da")
    private BigDecimal giamToiDa;

    @Column(name = "don_hang_toi_thieu")
    private BigDecimal donHangToiThieu;

    @Column(name = "so_luong_con_lai", nullable = false)
    private Integer soLuongConLai;

    @Column(name = "ngay_bat_dau")
    private LocalDateTime ngayBatDau;

    @Column(name = "ngay_het_han")
    private LocalDateTime ngayHetHan;

    // Khóa lạc quan (Optimistic Locking) giúp tránh lỗi khi 2 người cùng áp mã voucher cuối cùng
    @Version
    private Integer version;
}
