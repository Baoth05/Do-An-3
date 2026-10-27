package com.ctut.wms.wmscoreservice.dto.exportnote;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportNoteDetailResponse {
    private Long id;
    private Long sanPhamId;
    private String sku;
    private String tenSanPham;
    private String donViTinh;
    private Integer soLuong;
    private Double donGia;
    private Double thanhTien;
}

