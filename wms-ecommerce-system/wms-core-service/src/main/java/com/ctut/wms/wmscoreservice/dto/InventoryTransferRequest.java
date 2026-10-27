package com.ctut.wms.wmscoreservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransferRequest {
    private Long khoNguonId;
    private Long khoDichId;
    private Long sanPhamId;
    private Integer soLuong;
    private String ghiChu;
}

