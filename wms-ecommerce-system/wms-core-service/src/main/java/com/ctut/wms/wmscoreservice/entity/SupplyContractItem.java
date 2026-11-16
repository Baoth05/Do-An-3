package com.ctut.wms.wmscoreservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/** Một dòng hàng trong hợp đồng cung ứng (giá sỉ & tên được chụp lại tại thời điểm lập hợp đồng). */
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

    @Column(name = "san_pham_id", nullable = false)
    private Long sanPhamId;

    @Column(name = "sku", length = 100)
    private String sku;

    @Column(name = "ten_hang_hoa")
    private String tenHangHoa;

    @Column(name = "don_vi_tinh", length = 50)
    private String donViTinh;

    @Column(name = "danh_muc")
    private String danhMuc;

    @Column(name = "hinh_anh", columnDefinition = "TEXT")
    private String hinhAnh;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    @Column(name = "don_gia_si", nullable = false)
    private BigDecimal donGiaSi;

    @Column(name = "thanh_tien", nullable = false)
    private BigDecimal thanhTien;
}
