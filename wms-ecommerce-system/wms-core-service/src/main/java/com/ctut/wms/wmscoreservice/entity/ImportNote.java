/**
 * ==============================================================================
 * Entity: ImportNote
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Thực thể cơ sở dữ liệu ánh xạ bảng lưu trữ dữ liệu ImportNote trong cơ sở dữ liệu.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "phieu_nhap_kho")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_phieu_nhap", unique = true, nullable = false)
    private String maPhieuNhap;

    @Column(name = "loai_nhap", length = 30)
    private String loaiNhap = "NHAP_TU_NCC"; // NHAP_TU_NCC hoặc NHAP_TU_KHO_TONG

    @Column(name = "ngay_nhap")
    private LocalDateTime ngayNhap = LocalDateTime.now();

    // Liên kết: Một phiếu nhập đến từ 1 nhà cung cấp (Nullable khi nhập từ kho tổng)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nha_cung_cap_id")
    private Supplier nhaCungCap;

    @Column(name = "phieu_xuat_nguon_id")
    private Long phieuXuatNguonId; // Khi Kho Cửa Hàng nhập định kỳ từ Phiếu Xuất của Kho Tổng

    @Column(name = "nhan_vien_id")
    private Long nhanVienId; // Logical FK người lập phiếu

    @Column(name = "nguoi_tao")
    private String nguoiTao; // Lưu tài khoản thủ kho / chủ shop tạo phiếu

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kho_hang_id")
    private Warehouse khoHang; // Kho tiếp nhận (Kho Tổng hoặc Kho Cửa Hàng)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "don_vi_van_chuyen_id")
    private ShippingProvider donViVanChuyen; // Ai giao hàng tới

    @Column(name = "trang_thai")
    private String trangThai = "CHỜ DUYỆT"; // REQUESTED, APPROVED, COMPLETED, CANCELLED

    @Column(name = "tong_tien_nhap")
    private BigDecimal tongTienNhap; // Tổng giá trị phiếu nhập
}
