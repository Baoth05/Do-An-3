package com.ctut.wms.wmscoreservice.dto.transfer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransferResponse {
    private Long id;
    private String maDieuChuyen;
    private Long khoNguonId;
    private String tenKhoNguon;
    private Long khoDichId;
    private String tenKhoDich;
    private Long sanPhamId;
    private String sku;
    private String tenSanPham;
    private String donViTinh;
    private Integer soLuong;
    private LocalDateTime ngayDieuChuyen;
    private String trangThai;
}

