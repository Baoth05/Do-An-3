package com.ctut.wms.wmscoreservice.entity.inventory;

import com.ctut.wms.wmscoreservice.entity.product.Product;
import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "the_kho")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TheKho {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "kho_cua_hang_id", nullable = false)
    private Warehouse khoCuaHang;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "hang_hoa_id", nullable = false)
    private Product hangHoa;

    @Column(name = "phieu_nhap_id")
    private Long phieuNhapId;

    @Column(name = "phieu_xuat_id")
    private Long phieuXuatId;

    @Column(name = "ma_chung_tu", length = 50)
    private String maChungTu;

    @Column(name = "loai_giao_dich", length = 30, nullable = false)
    private String loaiGiaoDich; // NHAP_NCC, XUAT_CUNG_UNG, NHAP_CUA_HANG, XUAT_BAN_LE

    @Column(name = "so_luong_truoc_bien_dong", nullable = false)
    private Integer soLuongTruocBienDong;

    @Column(name = "so_luong_bien_dong", nullable = false)
    private Integer soLuongBienDong;

    @Column(name = "so_luong_sau_bien_dong", nullable = false)
    private Integer soLuongSauBienDong;

    @Column(name = "ngay_tao")
    @Builder.Default
    private LocalDateTime ngayTao = LocalDateTime.now();
}

