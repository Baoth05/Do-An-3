package com.ctut.wms.wmscoreservice.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryResponse {
    private Long id;
    private Long sanPhamId;
    private String sku;
    private String tenSanPham;
    private String donViTinh;
    private Double giaBan; // Giá niêm yết gốc Master Catalog
    private Long khoHangId;
    private String tenKho;
    private String maKho;
    private String tenShop;
    private String moTaShop;
    private String logoShop;
    private Integer soLuongThucTe;
    private Integer soLuongKhaDung;
    private Integer soLuongToiThieu; // Ngưỡng cảnh báo
    private Integer soLuongToiDa;
    private BigDecimal giaBanHienTai; // Giá đăng bán thực tế của Shop
    private Integer soLuongDaBan; // Đã bán X cái
    private Boolean dangBan; // Trạng thái mở bán trên Sàn
    private String hinhAnh;
    private String moTa;
    private String danhMuc;
}
