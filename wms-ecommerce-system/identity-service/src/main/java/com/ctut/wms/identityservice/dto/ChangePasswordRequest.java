/**
 * ==============================================================================
 * DTO (Data Transfer Object): ChangePasswordRequest
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API ChangePasswordRequest.
 * ==============================================================================
 */
package com.ctut.wms.identityservice.dto;

import lombok.Data;

@Data
public class ChangePasswordRequest {
    private String matKhauCu;
    private String matKhauMoi;
}
