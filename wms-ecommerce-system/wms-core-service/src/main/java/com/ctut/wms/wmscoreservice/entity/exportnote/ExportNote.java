package com.ctut.wms.wmscoreservice.entity.exportnote;

import com.ctut.wms.wmscoreservice.entity.shipping.ShippingProvider;
import com.ctut.wms.wmscoreservice.entity.common.BaseEntity;
import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "phieu_xuat_kho")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExportNote extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_phieu_xuat", unique = true, nullable = false)
    private String maPhieuXuat;

    // Chỉ lưu String mã đơn hàng từ E-commerce truyền sang, không ràng buộc khóa ngoại
    @Column(name = "don_hang_id")
    private String donHangId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kho_hang_id", nullable = false)
    private Warehouse khoHang; // Xuất từ kho nào

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "don_vi_van_chuyen_id")
    private ShippingProvider donViVanChuyen; // Giao cho bưu tá nào

    @Column(name = "nguoi_tao")
    private String nguoiTao;

    @Column(name = "ngay_xuat")
    private LocalDateTime ngayXuat;

    @Column(name = "trang_thai")
    private String trangThai = "CHỜ GOM HÀNG"; // CHỜ GOM HÀNG, ĐÃ XUẤT, HỦY
}