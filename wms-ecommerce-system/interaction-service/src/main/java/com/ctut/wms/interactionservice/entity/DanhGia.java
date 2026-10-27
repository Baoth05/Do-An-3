package com.ctut.wms.interactionservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "danh_gia")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DanhGia extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Lưu mã ID người dùng (từ module Identity)
    @Column(name = "nguoi_dung_id", nullable = false)
    private Long nguoiDungId;

    // Logical FK Đánh giá cho sản phẩm của Gian hàng nào trên Sàn
    @Column(name = "cua_hang_id")
    private Long cuaHangId;

    // Lưu mã SKU sản phẩm (từ module WMS)
    @Column(name = "ma_hang_hoa", nullable = false)
    private String maHangHoa;

    // Lưu ID đơn hàng để xác thực (từ module Order)
    @Column(name = "don_hang_id", nullable = false)
    private String donHangId;

    @Column(name = "so_sao", nullable = false)
    private Integer soSao; // Giá trị từ 1 đến 5

    @Column(name = "noi_dung", columnDefinition = "TEXT")
    private String noiDung;

    // Đánh dấu xem người này có thực sự mua hàng hay không
    @Column(name = "da_mua_hang")
    private Boolean daMuaHang = false;

    // CHỜ DUYỆT, ĐÃ DUYỆT, ẨN
    @Column(name = "trang_thai")
    private String trangThai = "ĐÃ DUYỆT";
}
