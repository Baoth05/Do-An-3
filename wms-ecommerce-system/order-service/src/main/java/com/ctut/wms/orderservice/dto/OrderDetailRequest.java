/**
 * ==============================================================================
 * DTO (Data Transfer Object): OrderDetailRequest
 * Phân hệ: Order Service (Quản lý đơn hàng & Tách đơn đa shop - Port 8082)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API OrderDetailRequest.
 * ==============================================================================
 */
package com.ctut.wms.orderservice.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderDetailRequest {
    private Long sanPhamId;
    private Long cuaHangId; // Gian hàng bán sản phẩm này
    private String maHangHoa; // Mã SKU của sản phẩm
    private String tenHangHoaSnapshot; // Tên sản phẩm lúc khách bấm mua
    private BigDecimal giaMuaSnapshot; // Giá bán lúc khách bấm mua
    private Integer soLuong;
}

