package com.ctut.wms.wmscoreservice.entity.product;

import com.ctut.wms.wmscoreservice.entity.category.Category;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "san_pham")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sku; // Mã vạch hoặc SKU duy nhất

    @Column(name = "ten_san_pham", nullable = false)
    private String tenSanPham;

    @Column(name = "don_vi_tinh", nullable = false)
    private String donViTinh;

    @Column(name = "gia_ban")
    private Double giaBan;

    @Column(name = "gia_nhap")
    private Double giaNhap;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "hinh_anh")
    private String hinhAnh;

    @Column(name = "khoi_luong")
    private Double khoiLuong;

    @Column(name = "trang_thai")
    private String trangThai = "DANG_KINH_DOANH";

    // Mối quan hệ: Nhiều Sản phẩm thuộc về 1 Danh mục
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "danh_muc_id")
    private Category danhMuc;
}
