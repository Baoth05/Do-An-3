package com.ctut.wms.wmscoreservice.entity.product;
import com.ctut.wms.wmscoreservice.entity.category.Category;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "san_pham")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sku; // Mã vạch hoặc định danh duy nhất của sản phẩm

    @Column(name = "ten_san_pham", nullable = false)
    private String tenSanPham;
    @Column(name = "don_vi_tinh", nullable = false)
    private String donViTinh;


    // Mối quan hệ: Nhiều Sản phẩm thuộc về 1 Danh mục
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "danh_muc_id")
    private Category danhMuc;
}
