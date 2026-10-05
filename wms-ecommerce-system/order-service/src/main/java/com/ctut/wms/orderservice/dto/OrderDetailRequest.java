package com.ctut.wms.orderservice.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderDetailRequest {
    private Long sanPhamId;
    private String maHangHoa; // Mã SKU của sản phẩm
    private String tenHangHoaSnapshot; // Tên sản phẩm lúc khách bấm mua
    private BigDecimal giaMuaSnapshot; // Giá bán lúc khách bấm mua
    private Integer soLuong;
}