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
