package com.ctut.wms.wmscoreservice.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

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

    @Column(nullable = false)
    private BigDecimal gia;

    // Mối quan hệ: Nhiều Sản phẩm thuộc về 1 Danh mục
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "danh_muc_id")
    private Category danhMuc;
}
