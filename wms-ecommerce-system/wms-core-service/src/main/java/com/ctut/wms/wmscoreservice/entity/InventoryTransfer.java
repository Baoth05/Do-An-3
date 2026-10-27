package com.ctut.wms.wmscoreservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "dieu_chuyen_kho")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransfer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_dieu_chuyen", unique = true, nullable = false)
    private String maDieuChuyen;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "kho_nguon_id", nullable = false)
    private Warehouse khoNguon; // Kho xuất điều chuyển

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "kho_dich_id", nullable = false)
    private Warehouse khoDich; // Kho tiếp nhận điều chuyển

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "san_pham_id", nullable = false)
    private Product sanPham; // Sản phẩm điều chuyển

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    @Column(name = "ngay_dieu_chuyen")
    private LocalDateTime ngayDieuChuyen;

    @Column(name = "trang_thai")
    private String trangThai = "HOÀN THÀNH"; // HOÀN THÀNH, ĐANG DI CHUYỂN, HỦY
}

