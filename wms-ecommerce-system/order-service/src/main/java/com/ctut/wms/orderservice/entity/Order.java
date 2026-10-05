package com.ctut.wms.orderservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "don_hang")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_don_hang", unique = true, nullable = false)
    private String maDonHang = "DH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

    @Column(name = "nguoi_dung_id", nullable = false)
    private Long nguoiDungId; // Đổi từ khachHangId thành nguoiDungId cho khớp ERD

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id")
    private Voucher voucher;
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
    private String phuongThucThanhToan; // VD: MOMO, COD

    @Column(name = "trang_thai_don_hang")
    private String trangThaiDonHang = "CHỜ XÁC NHẬN";

    @Column(name = "trang_thai_thanh_toan")
    private String trangThaiThanhToan = "CHƯA THANH TOÁN";

    @Column(name = "trang_thai_giao_hang")
    private String trangThaiGiaoHang = "CHƯA GIAO";

    // Cascade.ALL: Khi lưu Order, tự động lưu luôn các Chi tiết bên trong
    @OneToMany(mappedBy = "donHang", cascade = CascadeType.ALL)
    private List<OrderDetail> chiTietDonHangs;
}