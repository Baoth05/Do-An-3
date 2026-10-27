/**
 * ==============================================================================
 * Entity: OrderDetail
 * Phân hệ: Order Service (Quản lý đơn hàng & Tách đơn đa shop - Port 8082)
 * Mô tả: Thực thể cơ sở dữ liệu ánh xạ bảng lưu trữ dữ liệu OrderDetail trong cơ sở dữ liệu.
 * ==============================================================================
 */
package com.ctut.wms.orderservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.math.BigDecimal;

@Entity
@Table(name = "chi_tiet_don_hang")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetail extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "don_hang_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Order donHang;

    @Column(name = "ma_hang_hoa", nullable = false)
    private String maHangHoa; // Lưu chuỗi mã SKU thay vì ID dài

    // Snapshot: Chụp lại tên sản phẩm lúc mua, lỡ sau này kho WMS đổi tên thì hóa đơn vẫn giữ nguyên
    @Column(name = "ten_hang_hoa_snapshot", nullable = false)
    private String tenHangHoaSnapshot;

    @Column(name = "gia_mua_snapshot", nullable = false)
    private BigDecimal giaMuaSnapshot;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;
}