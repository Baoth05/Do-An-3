/**
 * ==============================================================================
 * Entity: Warehouse
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Thực thể cơ sở dữ liệu ánh xạ bảng lưu trữ dữ liệu Warehouse trong cơ sở dữ liệu.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "kho_va_cua_hang")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Warehouse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_kho_cua_hang", nullable = false, unique = true)
    private String maKho; // Đồng bộ maKhoCuaHang theo V2.0

    @Column(name = "ten_kho_cua_hang", nullable = false)
    private String tenKho; // Đồng bộ tenKhoCuaHang theo V2.0

    @Column(name = "mo_ta_gian_hang", columnDefinition = "TEXT")
    private String moTaGianHang; // Giới thiệu Gian hàng trên trang Shop Page

    @Column(name = "anh_dai_dien_shop")
    private String anhDaiDienShop; // Logo/Banner của Gian hàng

    @Column(name = "loai_hinh", length = 30)
    private String loaiHinh = "KHO_TONG"; // KHO_TONG hoặc KHO_CUA_HANG

    @Column(name = "quan_ly_id")
    private Long quanLyId; // ID của Thủ kho hoặc Chủ cửa hàng (STORE_OWNER từ identity_service)

    @Column(name = "dia_chi")
    private String diaChi;

    @Column(name = "suc_chua_toi_da")
    private Integer sucChuaToiDa = 50000;

    @Column(name = "trang_thai")
    private String trangThai = "HOAT_DONG";

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao = LocalDateTime.now();

    public String getMaKhoCuaHang() {
        return maKho;
    }

    public void setMaKhoCuaHang(String maKhoCuaHang) {
        this.maKho = maKhoCuaHang;
    }

    public String getTenKhoCuaHang() {
        return tenKho;
    }

    public void setTenKhoCuaHang(String tenKhoCuaHang) {
        this.tenKho = tenKhoCuaHang;
    }
}
