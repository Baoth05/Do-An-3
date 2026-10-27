/**
 * ==============================================================================
 * DTO (Data Transfer Object): UpdateProfileRequest
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API UpdateProfileRequest.
 * ==============================================================================
 */
package com.ctut.wms.identityservice.dto;

import lombok.Data;

import java.time.LocalDate;
@Data
public class UpdateProfileRequest {
    private String hoTen;
    private String soDienThoai;
    private String diaChi;
    private LocalDate ngaySinh;
    private String gioiTinh;
    private String anhDaiDien;
}
