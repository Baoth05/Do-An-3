package com.ctut.wms.identityservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token; // Chìa khóa JWT
    private String message; // Câu thông báo (Ví dụ: Đăng nhập thành công)
}
