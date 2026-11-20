package com.ctut.wms.wmscoreservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "chi_tiet_hop_dong_cung_ung")
@Getter
@Setter
@NoArgsConstructor
public class SupplyContractItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hop_dong_id", nullable = false)
    private SupplyContract hopDong;

    // SỬA: Thay thế Long sanPhamId bằng khóa ngoại trỏ về bảng Sản Phẩm gốc
    // Giả sử class Sản phẩm của bạn tên là Product. Hãy Import nó vào nếu cần.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "san_pham_id", nullable = false)
    private Product sanPham;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    @Column(name = "don_gia_si", nullable = false)
    private BigDecimal donGiaSi;

    @Column(name = "thanh_tien", nullable = false)
    private BigDecimal thanhTien;
}