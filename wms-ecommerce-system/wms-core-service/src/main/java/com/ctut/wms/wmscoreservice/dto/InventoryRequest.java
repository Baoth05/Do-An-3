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
public class InventoryRequest {
    private Long sanPhamId;
    private Long khoHangId;
    private Integer soLuong;
    private BigDecimal giaBanHienTai;
    private Integer soLuongCanhBao;
    private Boolean dangBan;
}

