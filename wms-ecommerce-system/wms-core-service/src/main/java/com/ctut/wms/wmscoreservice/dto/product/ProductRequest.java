package com.ctut.wms.wmscoreservice.dto.product;

import lombok.Data;


@Data
public class ProductRequest {
    private String sku;
    private String tenSanPham;
    private String donViTinh;
    private Long danhMucId;
}
