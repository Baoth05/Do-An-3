package com.ctut.wms.wmscoreservice.entity.importnote;

import com.ctut.wms.wmscoreservice.entity.shipping.ShippingProvider;
import com.ctut.wms.wmscoreservice.entity.supplier.Supplier;
import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "phieu_nhap_kho")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_phieu_nhap", unique = true, nullable = false)
    private String maPhieuNhap;

    @Column(name = "ngay_nhap")
    private LocalDateTime ngayNhap = LocalDateTime.now();

    // Liên kết: Một phiếu nhập đến từ 1 nhà cung cấp
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nha_cung_cap_id")
    private Supplier nhaCungCap;

    @Column(name = "nguoi_tao")
    private String nguoiTao; // Lưu tài khoản thủ kho tạo phiếu
    // BỔ SUNG CÁC TRƯỜNG CÒN THIẾU:
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kho_hang_id")
    private Warehouse khoHang; // Nhập vào kho nào

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "don_vi_van_chuyen_id")
    private ShippingProvider donViVanChuyen; // Ai giao hàng tới

    @Column(name = "trang_thai")
    private String trangThai = "NHÁP"; // NHÁP, CHỜ DUYỆT, ĐÃ NHẬP

    @Column(name = "tong_tien_nhap")
    private BigDecimal tongTienNhap; // Tổng giá trị phiếu nhập
}
