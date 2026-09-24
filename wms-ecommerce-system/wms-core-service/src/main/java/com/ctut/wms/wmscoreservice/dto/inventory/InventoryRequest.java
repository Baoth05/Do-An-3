package com.ctut.wms.wmscoreservice.dto.inventory;

import lombok.Data;

@Data
public class InventoryRequest {
    private Long sanPhamId;
    private Long khoHangId;
    private Integer soLuong;
}
