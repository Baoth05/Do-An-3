package com.ctut.wms.wmscoreservice.entity.supplier;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "nha_cung_cap")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_nha_cung_cap")
    private String maNhaCungCap;

    @Column(name = "ten_nha_cung_cap", nullable = false)
    private String tenNhaCungCap;

    @Column(name = "so_dien_thoai")
    private String soDienThoai;

    @Column(name = "email")
    private String email;

    @Column(name = "dia_chi")
    private String diaChi;

    @Column(name = "ma_so_thue")
    private String maSoThue;

    @Column(name = "nguoi_lien_he")
    private String nguoiLienHe;

    @Column(name = "chuc_vu_nguoi_lien_he")
    private String chucVuNguoiLienHe;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "trang_thai")
    private String trangThai = "HOAT_DONG";
}
