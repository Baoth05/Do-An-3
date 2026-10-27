package com.ctut.wms.identityservice.controller;

import com.ctut.wms.identityservice.dto.*;
import com.ctut.wms.identityservice.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // --- API ĐĂNG KÝ ---
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request){
        String result = authService.registerUser(request);
        return ResponseEntity.ok(result);
    }

    // --- API ĐĂNG NHẬP ---
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
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
    @PutMapping("/users/{id}")
    public ResponseEntity<String> updateUser(@PathVariable Long id, @RequestBody com.ctut.wms.identityservice.dto.UpdateUserRequest request) {
        String result = authService.updateUser(id, request);
        return ResponseEntity.ok(result);
    }

    // --- API KHÓA / MỞ KHÓA TÀI KHOẢN ---
    @PutMapping("/users/{id}/toggle-status")
    public ResponseEntity<String> toggleUserStatus(@PathVariable Long id) {
        String result = authService.toggleUserStatus(id);
        return ResponseEntity.ok(result);
    }

    // --- API ĐỔI MẬT KHẨU ---
    @PutMapping("/change-password/{taiKhoan}")
    public ResponseEntity<String> changePassword(
            @PathVariable String taiKhoan,
            @Valid @RequestBody ChangePasswordRequest request) {
        String response = authService.changePassword(taiKhoan, request);
        return ResponseEntity.ok(response);
    }

    // --- API LẤY TOÀN BỘ NGƯỜI DÙNG ---
    @GetMapping("/users")
    public ResponseEntity<List<UserProfileResponse>> getAllUsers() {
        List<UserProfileResponse> userList = authService.getAllUsers();
        return ResponseEntity.ok(userList);
    }
}
