/**
 * ==============================================================================
 * Ngoại Lệ (Exception): GlobalExceptionHandler
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Định nghĩa và xử lý các ngoại lệ nghiệp vụ tùy chỉnh trong Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084).
 * ==============================================================================
 */
package com.ctut.wms.identityservice.exception;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    // 1. Xử lý các lỗi Logic kinh doanh (Tài khoản tồn tại, Sai mật khẩu,...)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    // 2. Xử lý các lỗi do Kiểm duyệt dữ liệu (Validation) văng ra
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        // Lấy danh sách các trường bị lỗi và tin nhắn lỗi tương ứng
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );
        return ResponseEntity.badRequest().body(errors);
    }
}
