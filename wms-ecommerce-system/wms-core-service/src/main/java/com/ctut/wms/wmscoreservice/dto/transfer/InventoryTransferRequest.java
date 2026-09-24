package com.ctut.wms.wmscoreservice.dto.transfer;

import lombok.Data;

@Data
public class InventoryTransferRequest {
    private Long khoNguonId; // ID kho xuất hàng đi
    private Long khoDichId;  // ID kho nhận hàng đến
    private Long sanPhamId;  // ID sản phẩm cần chuyển
    private Integer soLuong; // Số lượng chuyển
}