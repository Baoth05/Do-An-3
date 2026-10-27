package com.ctut.wms.wmscoreservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "ton_kho_chi_nhanh")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "san_pham_id", nullable = false)
    private Product sanPham; // Sản phẩm lưu trữ

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "kho_hang_id", nullable = false)
    private Warehouse khoHang; // Kho hàng / Gian hàng chứa sản phẩm

    @Column(name = "so_luong_thuc_te", nullable = false)
    private Integer soLuongThucTe = 0; // Số lượng hàng nằm thực tế trên kệ

    @Column(name = "so_luong_kha_dung", nullable = false)
    private Integer soLuongKhaDung = 0; // Hàng sẵn sàng bán (đã trừ đơn chờ đóng gói)

    @Column(name = "so_luong_canh_bao")
    private Integer soLuongToiThieu = 10; // Ngưỡng tối thiểu cảnh báo cạn kho

    @Column(name = "so_luong_toi_da")
    private Integer soLuongToiDa = 1000; // Ngưỡng tối đa cảnh báo quá tải kệ

    @Column(name = "gia_ban_hien_tai")
    private BigDecimal giaBanHienTai; // Giá niêm yết bán lẻ của Shop trên sàn

    @Column(name = "so_luong_da_ban")
    private Integer soLuongDaBan = 0; // Số lượng đã bán ("Đã bán X")

    @Column(name = "dang_ban")
    private Boolean dangBan = false; // Bật/tắt mở bán trên sàn TMĐT

    @Version
    private Integer version; // Khóa lạc quan chống race condition khi tranh mua
}
