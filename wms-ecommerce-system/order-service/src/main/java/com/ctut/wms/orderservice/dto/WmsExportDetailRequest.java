package com.ctut.wms.orderservice.dto;

import lombok.Data;

@Data
public class WmsExportDetailRequest {
    private Long sanPhamId;
    private Integer soLuong;
}