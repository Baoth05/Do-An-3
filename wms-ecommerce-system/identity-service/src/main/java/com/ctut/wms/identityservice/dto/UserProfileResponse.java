package com.ctut.wms.identityservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
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

