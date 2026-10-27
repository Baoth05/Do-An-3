/**
 * ==============================================================================
 * DTO (Data Transfer Object): ProductRequest
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API ProductRequest.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.dto.product;

import lombok.Data;

@Data
public class ProductRequest {
    private String sku;
    private String tenSanPham;
    private String donViTinh;
    private Long danhMucId;
    private Double giaBan;
    private Double giaNhap;
    private String moTa;
    private String hinhAnh;
    private Double khoiLuong;
    private String trangThai;
}
