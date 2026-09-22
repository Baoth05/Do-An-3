package com.ctut.wms.identityservice.controller;

import com.ctut.wms.identityservice.dto.*;
import com.ctut.wms.identityservice.service.AuthService;
import jakarta.validation.Valid; // Thư viện bắt buộc để kích hoạt Validation
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*; // Dùng RestController thay cho Controller

@RestController // Đánh dấu đây là API trả về dữ liệu (JSON)
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // --- API ĐĂNG KÝ ---
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request){
        String result = authService.registerUser(request);
        return ResponseEntity.ok(result); // Không cần if(Lỗi), Trạm thu gom lỗi sẽ lo việc đó
    }

    // --- API ĐĂNG NHẬP ---
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response); // Đã dọn dẹp sạch try-catch
    }

    // --- API XÓA TÀI KHOẢN ---
    @DeleteMapping("/delete/{taiKhoan}")
    public ResponseEntity<String> deleteUser(@PathVariable String taiKhoan) {
        String response = authService.deleteUser(taiKhoan);
        return ResponseEntity.ok(response);
    }

    // --- API XÁC THỰC TOKEN ---
    @GetMapping("/validate")
    public ResponseEntity<String> validateToken(@RequestParam String token) {
        authService.validateToken(token);
        return ResponseEntity.ok("Token hợp lệ!");
    }

    // --- API LẤY THÔNG TIN CÁ NHÂN ---
    @GetMapping("/profile/{taiKhoan}")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable String taiKhoan) {
        UserProfileResponse response = authService.getUserProfile(taiKhoan);
        return ResponseEntity.ok(response);
    }

    // --- API CẬP NHẬT THÔNG TIN CÁ NHÂN ---
    @PutMapping("/profile/{taiKhoan}")
    public ResponseEntity<UserProfileResponse> updateUserProfile(
            @PathVariable String taiKhoan,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse response = authService.updateUserProfile(taiKhoan, request);
        return ResponseEntity.ok(response);
    }

    // --- API ĐỔI MẬT KHẨU ---
    @PutMapping("/change-password/{taiKhoan}")
    public ResponseEntity<String> changePassword(
            @PathVariable String taiKhoan,
            @Valid @RequestBody ChangePasswordRequest request) {
        String response = authService.changePassword(taiKhoan, request);
        return ResponseEntity.ok(response);
    }
}