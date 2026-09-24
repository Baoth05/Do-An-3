package com.ctut.wms.wmscoreservice.entity.transfer;

import com.ctut.wms.wmscoreservice.entity.common.BaseEntity;
import com.ctut.wms.wmscoreservice.entity.product.Product;
import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kho_nguon_id", nullable = false)
    private Warehouse khoNguon; // Lấy hàng từ đâu

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kho_dich_id", nullable = false)
    private Warehouse khoDich; // Chuyển hàng đến đâu

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "san_pham_id", nullable = false)
    private Product sanPham;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    @Column(name = "ngay_dieu_chuyen")
    private LocalDateTime ngayDieuChuyen;

    @Column(name = "trang_thai")
    private String trangThai = "ĐANG DI CHUYỂN"; // ĐANG DI CHUYỂN, ĐÃ NHẬN, HỦY
}