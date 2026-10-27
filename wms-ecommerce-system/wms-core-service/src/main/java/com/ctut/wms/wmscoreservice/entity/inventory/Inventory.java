package com.ctut.wms.wmscoreservice.entity.inventory;

import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import com.ctut.wms.wmscoreservice.entity.product.Product;
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
    private Product sanPham; // Tham chiếu HANG_HOA

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "kho_hang_id", nullable = false)
    private Warehouse khoHang; // Tham chiếu KHO_VA_CUA_HANG

    @Column(name = "so_luong_thuc_te", nullable = false)
    private Integer soLuongThucTe = 0; // Hàng đang nằm thực tế trên kệ

    @Column(name = "so_luong_kha_dung", nullable = false)
    private Integer soLuongKhaDung = 0; // Hàng thực tế trừ đi hàng đang chờ đóng gói

    @Column(name = "so_luong_canh_bao")
    private Integer soLuongToiThieu = 10; // Ngưỡng cảnh báo sắp hết hàng

    @Column(name = "so_luong_toi_da")
    private Integer soLuongToiDa = 1000; // Ngưỡng cảnh báo quá tải sức chứa

    @Column(name = "gia_ban_hien_tai")
    private BigDecimal giaBanHienTai; // Giá đăng bán thực tế trên Gian hàng của Shop

    @Column(name = "so_luong_da_ban")
    private Integer soLuongDaBan = 0; // Thống kê số lượng đã bán của Shop ("Đã bán X")

    @Column(name = "dang_ban")
    private Boolean dangBan = false; // Cờ cho phép hiển thị lên Sàn TMĐT chung

    @Version
    private Integer version; // Khóa lạc quan chống Race Condition khi trừ kho

    public Product getHangHoa() {
        return sanPham;
    }

    public void setHangHoa(Product hangHoa) {
        this.sanPham = hangHoa;
    }

    public Warehouse getKhoCuaHang() {
        return khoHang;
    }

    public void setKhoCuaHang(Warehouse khoCuaHang) {
        this.khoHang = khoCuaHang;
    }

    public Integer getSoLuongCanhBao() {
        return soLuongToiThieu;
    }

    public void setSoLuongCanhBao(Integer soLuongCanhBao) {
        this.soLuongToiThieu = soLuongCanhBao;
    }
}
