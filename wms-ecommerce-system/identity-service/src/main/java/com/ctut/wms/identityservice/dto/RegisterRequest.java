package com.ctut.wms.identityservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterRequest {
    @NotBlank(message = "Tài khoản không được để trống")
    @Size(min = 4, message = "Tài khoản phải có ít nhất 4 ký tự")
    private String taiKhoan;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String matKhau;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Họ tên không được để trống")
    private String hoTen;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String soDienThoai;

    private String diaChi; // Các trường không bắt buộc thì không cần gắn nhãn
    private LocalDate ngaySinh;
    private String gioiTinh;
}
