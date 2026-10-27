/**
 * ==============================================================================
 * Entity: ExportNote
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Thực thể cơ sở dữ liệu ánh xạ bảng lưu trữ dữ liệu ExportNote trong cơ sở dữ liệu.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "phieu_xuat_kho")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExportNote extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_phieu_xuat", unique = true, nullable = false)
    private String maPhieuXuat;

    @Column(name = "loai_xuat", length = 30)
    private String loaiXuat = "XUAT_CUNG_UNG_CUA_HANG"; // XUAT_CUNG_UNG_CUA_HANG hoặc XUAT_BAN_LE_SAN_TMDT

    // Chỉ lưu String mã đơn hàng từ E-commerce truyền sang khi xuất bán lẻ
    @Column(name = "don_hang_id")
    private String donHangId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kho_hang_id", nullable = false)
    private Warehouse khoHang; // Kho xuất hàng (Kho Tổng hoặc Kho Cửa Hàng)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kho_nhan_id")
    private Warehouse khoNhan; // Kho nhận khi Kho Tổng xuất cung ứng cho Cửa hàng

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "don_vi_van_chuyen_id")
    private ShippingProvider donViVanChuyen; // Giao cho bưu tá / đơn vị nào

    @Column(name = "nhan_vien_id")
    private Long nhanVienId; // Logical FK người thực hiện xuất

    @Column(name = "nguoi_tao")
    private String nguoiTao;

    @Column(name = "ngay_xuat")
    private LocalDateTime ngayXuat;

    @Column(name = "trang_thai")
    private String trangThai = "CHỜ GOM HÀNG"; // CHỜ GOM HÀNG, ĐÃ XUẤT, HỦY
}
