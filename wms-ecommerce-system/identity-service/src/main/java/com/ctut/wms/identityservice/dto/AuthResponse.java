/**
 * ==============================================================================
 * DTO (Data Transfer Object): AuthResponse
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API AuthResponse.
 * ==============================================================================
 */
package com.ctut.wms.identityservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token; // Chìa khóa JWT
    private String message; // Câu thông báo (Ví dụ: Đăng nhập thành công)
    private Long id; // ID người dùng (dùng để đặt hàng, đánh giá)
    private String taiKhoan;
    private String email;
    private String vaiTro; // ADMIN, USER, STAFF...
    private String hoTen;
    // 🌟 THÊM ĐOẠN NÀY VÀO ĐỂ SỬA LỖI:
    // Tạo thêm một "khuôn" chỉ nhận 2 tham số String để khớp với lệnh gọi của cậu
    public AuthResponse(String token, String message) {
        this.token = token;
        this.message = message;
    }
}
