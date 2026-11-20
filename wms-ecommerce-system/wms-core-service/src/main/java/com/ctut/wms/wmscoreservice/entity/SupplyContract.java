package com.ctut.wms.wmscoreservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "hop_dong_cung_ung")
@Getter
@Setter
@NoArgsConstructor
public class SupplyContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_hop_dong", unique = true, nullable = false, length = 60)
    private String maHopDong;

    @Column(name = "trang_thai", nullable = false, length = 40)
    private String trangThai;

    // SỬA: Dùng đối tượng Warehouse làm khóa ngoại thay vì chỉ lưu Long storeId
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cua_hang_id", nullable = false)
    private Warehouse store;

    // SỬA: Dùng đối tượng Warehouse thay vì Long khoTongId
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kho_tong_id", nullable = false)
    private Warehouse khoTong;

    @Column(name = "tong_tien", nullable = false)
    private BigDecimal tongTien = BigDecimal.ZERO;

    @Column(name = "so_luong_mat_hang")
    private Integer soLuongMatHang;

    @Column(name = "tong_so_luong_hang")
    private Integer tongSoLuongHang;

    @Column(name = "nguoi_yeu_cau_id")
    private Long nguoiYeuCauId;
    @Column(name = "nguoi_yeu_cau")
    private String nguoiYeuCau;
    @Column(name = "chuc_vu_yeu_cau")
    private String chucVuYeuCau;
    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao = LocalDateTime.now();

    @Column(name = "duyet1_nguoi")
    private String duyet1Nguoi;
    @Column(name = "duyet1_ngay")
    private LocalDateTime duyet1Ngay;
    @Column(name = "duyet1_ghi_chu", columnDefinition = "TEXT")
    private String duyet1GhiChu;

    @Column(name = "ky_nguoi")
    private String kyNguoi;
    @Column(name = "ky_chuc_vu")
    private String kyChucVu;
    @Column(name = "ky_ma_chu_ky_so", length = 100)
    private String kyMaChuKySo;
    @Column(name = "ky_ngay")
    private LocalDateTime kyNgay;

    @Column(name = "duyet2_nguoi")
    private String duyet2Nguoi;
    @Column(name = "duyet2_ngay")
    private LocalDateTime duyet2Ngay;
    @Column(name = "duyet2_ghi_chu", columnDefinition = "TEXT")
    private String duyet2GhiChu;

    @Column(name = "xuat_phieu_id")
    private Long xuatPhieuId;
    @Column(name = "xuat_ma_phieu", length = 50)
    private String xuatMaPhieu;
    @Column(name = "xuat_nguoi")
    private String xuatNguoi;
    @Column(name = "xuat_ngay")
    private LocalDateTime xuatNgay;
    @Column(name = "xuat_don_vi_van_chuyen")
    private String xuatDonViVanChuyen;

    @Column(name = "ngay_hoan_thanh")
    private LocalDateTime ngayHoanThanh;
    @Column(name = "nguoi_nhan_hang")
    private String nguoiNhanHang;

    @Column(name = "ly_do_tu_choi", columnDefinition = "TEXT")
    private String lyDoTuChoi;
    @Column(name = "nguoi_tu_choi")
    private String nguoiTuChoi;
    @Column(name = "ngay_tu_choi")
    private LocalDateTime ngayTuChoi;

    @OneToMany(mappedBy = "hopDong", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SupplyContractItem> danhSachHang = new ArrayList<>();
}