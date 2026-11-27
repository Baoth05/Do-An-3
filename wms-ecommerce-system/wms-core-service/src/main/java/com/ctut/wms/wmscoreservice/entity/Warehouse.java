package com.ctut.wms.wmscoreservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "kho_va_cua_hang")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_kho_cua_hang", length = 50, unique = true, nullable = false)
    private String maKho;

    @Column(name = "ten_kho_cua_hang", nullable = false)
    private String tenKho;

    @Column(name = "dia_chi", columnDefinition = "TEXT")
    private String diaChi;

    @Column(name = "so_dien_thoai", length = 20)
    private String soDienThoai;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "suc_chua_toi_da")
    private Integer sucChuaToiDa;

    @Column(name = "loai_hinh", length = 50)
    private String loaiHinh;

    @Column(name = "mo_ta_gian_hang", columnDefinition = "TEXT")
    private String moTaGianHang;

    @Column(name = "anh_dai_dien_shop", columnDefinition = "TEXT")
    private String anhDaiDienShop;

    @Column(name = "anh_bia_shop", columnDefinition = "TEXT")
    private String anhBiaShop;

    @Column(name = "gio_mo_cua", length = 120)
    private String gioMoCua;

    @Column(name = "lien_ket_mang_xa_hoi", columnDefinition = "TEXT")
    private String websiteHoacMangXaHoi;

    @Column(name = "chinh_sach_bao_hanh", columnDefinition = "TEXT")
    private String chinhSachBaoHanh;

    @Column(name = "chinh_sach_giao_hang", columnDefinition = "TEXT")
    private String chinhSachGiaoHang;

    @Column(name = "hinh_anh_cua_hang", columnDefinition = "TEXT")
    private String hinhAnhCuaHang;

    @Column(name = "quan_ly_id")
    private Long quanLyId;

    @Column(name = "trang_thai", length = 50)
    private String trangThai;

    @Column(name = "ngay_tao")
    @Builder.Default
    private LocalDateTime ngayTao = LocalDateTime.now();

    // THÊM MỚI: Khóa ngoại tự tham chiếu (Self-referencing) để quản lý cây Kho Tổng -> Cửa hàng
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kho_cha_id")
    private Warehouse khoCha;
}