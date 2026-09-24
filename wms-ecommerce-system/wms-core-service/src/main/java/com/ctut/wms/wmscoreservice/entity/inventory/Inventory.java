package com.ctut.wms.wmscoreservice.entity.inventory;

import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import com.ctut.wms.wmscoreservice.entity.product.Product;
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

    @Column(name = "so_luong_thuc_te", nullable = false)
    private Integer soLuongThucTe = 0; // Hàng đang nằm thực tế trên kệ

    @Column(name = "so_luong_kha_dung", nullable = false)
    private Integer soLuongKhaDung = 0; // Hàng thực tế trừ đi hàng đang chờ đóng gói

    @Column(name = "so_luong_toi_thieu")
    private Integer soLuongToiThieu = 10; // Ngưỡng cảnh báo sắp hết hàng

    @Column(name = "so_luong_toi_da")
    private Integer soLuongToiDa = 1000; // Ngưỡng cảnh báo quá tải sức chứa
}