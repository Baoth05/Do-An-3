package com.ctut.wms.wmscoreservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Hợp đồng cung ứng nội bộ B2B: Kho Tổng (Bên A) cung ứng hàng cho Kho Cửa Hàng (Bên B).
 * Vòng đời: CHO_ADMIN_DUYET -> CHO_SHOP_KY -> DA_KY_CHO_DUYET_KHO -> CHUYEN_QUA_KHO -> DANG_GIAO_HANG -> HOAN_THANH
 *           (TU_CHOI ở bất kỳ bước nào trước khi Kho Tổng xuất hàng)
 */
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

    // ----- Bên B: Kho cửa hàng -----
    @Column(name = "cua_hang_id", nullable = false)
    private Long storeId;
    @Column(name = "ten_kho_cua_hang")
    private String tenKhoCuaHang;
    @Column(name = "ma_kho_cua_hang", length = 50)
    private String maKhoCuaHang;

    // ----- Bên A: Kho tổng -----
    @Column(name = "kho_tong_id", nullable = false)
    private Long khoTongId;
    @Column(name = "kho_cung_ung")
    private String khoCungUng;
    @Column(name = "dia_chi_kho_cung_ung", columnDefinition = "TEXT")
    private String diaChiKhoCungUng;
    @Column(name = "sdt_kho_cung_ung", length = 20)
    private String soDienThoaiKhoCungUng;

    // ----- Giá trị hợp đồng (do server tính) -----
    @Column(name = "tong_tien", nullable = false)
    private BigDecimal tongTien = BigDecimal.ZERO;
    @Column(name = "so_luong_mat_hang")
    private Integer soLuongMatHang;
    @Column(name = "tong_so_luong_hang")
    private Integer tongSoLuongHang;

    // ----- Người yêu cầu -----
    @Column(name = "nguoi_yeu_cau_id")
    private Long nguoiYeuCauId;
    @Column(name = "nguoi_yeu_cau")
    private String nguoiYeuCau;
    @Column(name = "chuc_vu_yeu_cau")
    private String chucVuYeuCau;
    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao = LocalDateTime.now();

    // ----- Bước 2: Admin duyệt vòng 1 -----
    @Column(name = "duyet1_nguoi")
    private String duyet1Nguoi;
    @Column(name = "duyet1_ngay")
    private LocalDateTime duyet1Ngay;
    @Column(name = "duyet1_ghi_chu", columnDefinition = "TEXT")
    private String duyet1GhiChu;

    // ----- Bước 3: Shop ký số -----
    @Column(name = "ky_nguoi")
    private String kyNguoi;
    @Column(name = "ky_chuc_vu")
    private String kyChucVu;
    @Column(name = "ky_ma_chu_ky_so", length = 100)
    private String kyMaChuKySo;
    @Column(name = "ky_ngay")
    private LocalDateTime kyNgay;

    // ----- Bước 4: Admin duyệt vòng 2 -----
    @Column(name = "duyet2_nguoi")
    private String duyet2Nguoi;
    @Column(name = "duyet2_ngay")
    private LocalDateTime duyet2Ngay;
    @Column(name = "duyet2_ghi_chu", columnDefinition = "TEXT")
    private String duyet2GhiChu;

    // ----- Bước 5: Kho Tổng xuất hàng -----
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

    // ----- Bước 6: Shop nhận hàng -----
    @Column(name = "ngay_hoan_thanh")
    private LocalDateTime ngayHoanThanh;
    @Column(name = "nguoi_nhan_hang")
    private String nguoiNhanHang;

    // ----- Từ chối -----
    @Column(name = "ly_do_tu_choi", columnDefinition = "TEXT")
    private String lyDoTuChoi;
    @Column(name = "nguoi_tu_choi")
    private String nguoiTuChoi;
    @Column(name = "ngay_tu_choi")
    private LocalDateTime ngayTuChoi;

    @OneToMany(mappedBy = "hopDong", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SupplyContractItem> danhSachHang = new ArrayList<>();
}
