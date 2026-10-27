/**
 * ==============================================================================
 * DTO (Data Transfer Object): WmsExportDetailRequest
 * Phân hệ: Order Service (Quản lý đơn hàng & Tách đơn đa shop - Port 8082)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API WmsExportDetailRequest.
 * ==============================================================================
 */
package com.ctut.wms.orderservice.dto;

import lombok.Data;

@Data
public class WmsExportDetailRequest {
    private Long sanPhamId;
    private Integer soLuong;
}