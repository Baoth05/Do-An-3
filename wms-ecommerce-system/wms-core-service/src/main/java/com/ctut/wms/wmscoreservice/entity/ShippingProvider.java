/**
 * ==============================================================================
 * Entity: ShippingProvider
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Thực thể cơ sở dữ liệu ánh xạ bảng lưu trữ dữ liệu ShippingProvider trong cơ sở dữ liệu.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "don_vi_van_chuyen")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShippingProvider {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_don_vi")
    private String maDonVi;

    @Column(name = "ten_don_vi", nullable = false)
    private String tenDonVi;

    @Column(name = "thong_tin_lien_he")
    private String thongTinLienHe;

    @Column(name = "email")
    private String email;

    @Column(name = "website")
    private String website;

    @Column(name = "dia_chi")
    private String diaChi;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "trang_thai")
    private String trangThai = "HOAT_DONG";

    public String getSoDienThoai() {
        return thongTinLienHe;
    }

    public void setSoDienThoai(String soDienThoai) {
        this.thongTinLienHe = soDienThoai;
    }
}
