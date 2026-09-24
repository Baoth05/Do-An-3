package com.ctut.wms.wmscoreservice.dto.product;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String sku;
    private String tenSanPham;
    private String donViTinh;
    private String tenDanhMuc;
}
