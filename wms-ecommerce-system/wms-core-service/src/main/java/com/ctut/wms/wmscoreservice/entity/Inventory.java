package com.ctut.wms.wmscoreservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ton_kho")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "san_pham_id", nullable = false)
    private Product sanPham;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kho_hang_id", nullable = false)
    private Warehouse khoHang;
    @Column(name = "so_luong", nullable = false)
    private Integer soLuong = 0;
}