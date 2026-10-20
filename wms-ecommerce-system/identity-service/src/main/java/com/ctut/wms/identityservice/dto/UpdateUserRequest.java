package com.ctut.wms.identityservice.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String hoTen;
    private String email;
    private String soDienThoai;
    private String vaiTro;
}