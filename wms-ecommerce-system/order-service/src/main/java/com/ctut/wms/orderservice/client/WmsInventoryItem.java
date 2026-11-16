package com.ctut.wms.orderservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Bản ghi tồn kho của 1 sản phẩm tại 1 gian hàng, trả về từ WMS Core (GET /inventory/item).
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WmsInventoryItem {
    private Long id;
    private Long sanPhamId;
    private String sku;
    private String tenSanPham;
    private Long khoHangId;
    private Integer soLuongKhaDung;
    private BigDecimal giaBanHienTai;
    private Boolean dangBan;
}
