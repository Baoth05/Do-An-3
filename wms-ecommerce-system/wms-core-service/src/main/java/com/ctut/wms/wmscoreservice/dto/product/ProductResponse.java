package com.ctut.wms.wmscoreservice.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String sku;
    private String tenSanPham;
    private String donViTinh;
    private String tenDanhMuc;
    private Long danhMucId;
    private Double giaBan;
    private Double giaNhap;
    private String moTa;
    private String hinhAnh;
    private Double khoiLuong;
    private String trangThai;
}
