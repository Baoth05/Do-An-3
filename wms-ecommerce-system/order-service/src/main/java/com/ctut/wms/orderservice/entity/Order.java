/**
 * ==============================================================================
 * Entity: Order
 * Phân hệ: Order Service (Quản lý đơn hàng & Tách đơn đa shop - Port 8082)
 * Mô tả: Thực thể cơ sở dữ liệu ánh xạ bảng lưu trữ dữ liệu Order trong cơ sở dữ liệu.
 * ==============================================================================
 */
package com.ctut.wms.orderservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import lombok.ToString;

@Entity
@Table(name = "don_hang")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mã phiên Checkout chung (gom các đơn hàng tách ra từ 1 lần bấm thanh toán giỏ hàng đa shop)
    @Column(name = "ma_giao_dich_goc", length = 50)
    private String maGiaoDichGoc;

    // Logical FK ID Gian hàng bán đơn này (từ wms_core_db)
    @Column(name = "cua_hang_id")
    private Long cuaHangId;

    @Column(name = "ma_don_hang", unique = true, nullable = false)
    private String maDonHang = "DH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

    @Column(name = "nguoi_dung_id", nullable = false)
    private Long nguoiDungId; // Logical FK Khách hàng mua (từ identity_service)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id")
    @ToString.Exclude
    private Voucher voucher;

    // Đơn vị vận chuyển do Chủ cửa hàng điều phối
    @Column(name = "don_vi_van_chuyen", length = 100)
    private String donViVanChuyen;

    @Column(name = "dia_chi_giao_hang")
    private String diaChiGiaoHang;

    @Column(name = "so_dien_thoai")
    private String soDienThoai;

    @Column(name = "tong_tien_hang", nullable = false)
    private BigDecimal tongTienHang = BigDecimal.ZERO;

    @Column(name = "tien_giam_gia", nullable = false)
    private BigDecimal tienGiamGia = BigDecimal.ZERO;

    @Column(name = "tong_thanh_toan", nullable = false)
    private BigDecimal tongThanhToan = BigDecimal.ZERO;

    @Column(name = "phuong_thuc_thanh_toan")
    private String phuongThucThanhToan; // MOMO, CRYPTO, COD

    @Column(name = "trang_thai_don_hang")
    private String trangThaiDonHang = "PENDING"; // PENDING, CONFIRMED, CANCELLED_PAYMENT_FAILED, COMPLETED

    @Column(name = "trang_thai_thanh_toan")
    private String trangThaiThanhToan = "UNPAID"; // UNPAID, PAID, REFUNDED

    @Column(name = "trang_thai_giao_hang")
    private String trangThaiGiaoHang = "WAITING"; // WAITING, PACKING, SHIPPING, DELIVERED

    // Cascade.ALL: Khi lưu Order, tự động lưu luôn các Chi tiết bên trong
    @OneToMany(mappedBy = "donHang", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<OrderDetail> chiTietDonHangs;
}
