/**
 * ==============================================================================
 * DTO (Data Transfer Object): LoginRequest
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API LoginRequest.
 * ==============================================================================
 */
package com.ctut.wms.identityservice.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String taiKhoan;
    private String matKhau;
}
