package com.ctut.wms.wmscoreservice.dto;

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
    private Double giaBan;
    private Long khoHangId;
    private String tenKho;
    private String maKho;
    private String tenShop;
    private String moTaShop;
    private String logoShop;
    private Integer soLuongThucTe;
    private Integer soLuongKhaDung;
    private Integer soLuongToiThieu;
    private Integer soLuongToiDa;
    private BigDecimal giaBanHienTai;
    private Integer soLuongDaBan;
    private Boolean dangBan;
    private String hinhAnh;
    private String moTa;
    private String danhMuc;
}

