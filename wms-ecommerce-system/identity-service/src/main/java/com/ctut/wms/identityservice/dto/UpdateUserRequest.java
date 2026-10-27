/**
 * ==============================================================================
 * DTO (Data Transfer Object): UpdateUserRequest
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API UpdateUserRequest.
 * ==============================================================================
 */
package com.ctut.wms.identityservice.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String hoTen;
    private String email;
    private String soDienThoai;
    private String vaiTro;
}