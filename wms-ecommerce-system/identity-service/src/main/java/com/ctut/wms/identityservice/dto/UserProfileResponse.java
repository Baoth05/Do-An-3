/**
 * ==============================================================================
 * DTO (Data Transfer Object): UserProfileResponse
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API UserProfileResponse.
 * ==============================================================================
 */
package com.ctut.wms.identityservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id; // ID người dùng
    private String taiKhoan;
    private String email;
    private String vaiTro; // Thêm vai trò
    private String hoTen;
    private String soDienThoai;
    private String diaChi; // Thêm địa chỉ
    private LocalDate ngaySinh; // Thêm ngày sinh
    private String gioiTinh; // Thêm giới tính
    private String anhDaiDien; // Thêm link ảnh
}

