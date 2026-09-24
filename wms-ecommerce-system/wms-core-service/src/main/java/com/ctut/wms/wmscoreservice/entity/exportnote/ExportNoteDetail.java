package com.ctut.wms.wmscoreservice.entity.exportnote;

import com.ctut.wms.wmscoreservice.entity.common.BaseEntity;
import com.ctut.wms.wmscoreservice.entity.product.Product;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chi_tiet_phieu_xuat")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExportNoteDetail extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phieu_xuat_id", nullable = false)
    private ExportNote phieuXuat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "san_pham_id", nullable = false)
    private Product sanPham;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;
}