package com.ctut.wms.identityservice.dto;

import lombok.Data;

@Data
public class ChangePasswordRequest {
    private String matKhauCu;
    private String matKhauMoi;
}
