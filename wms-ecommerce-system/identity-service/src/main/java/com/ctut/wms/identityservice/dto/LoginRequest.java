package com.ctut.wms.identityservice.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String taiKhoan;
    private String matKhau;
}
