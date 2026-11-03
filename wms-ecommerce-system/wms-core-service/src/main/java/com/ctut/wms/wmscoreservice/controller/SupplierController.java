/**
 * ==============================================================================
 * Controller: SupplierController
 * Phân hệ: WMS Core Service (Hệ thống quản lý kho cốt lõi - Port 8081)
 * Mô tả: Cung cấp API quản lý Nhà cung cấp và Hợp đồng cung cấp sản phẩm.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.controller;

import com.ctut.wms.wmscoreservice.dto.SupplierRequest; // 🌟 Đảm bảo đúng đường dẫn import này
import com.ctut.wms.wmscoreservice.entity.Supplier;
import com.ctut.wms.wmscoreservice.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    // 1. API THÊM nhà cung cấp (Kèm theo danh sách sản phẩm hợp đồng)
    @PostMapping
    public ResponseEntity<?> createSupplier(@RequestBody SupplierRequest request) {
        try {
            Supplier response = supplierService.createSupplier(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 2. API LẤY DANH SÁCH toàn bộ nhà cung cấp
    @GetMapping
    public ResponseEntity<List<Supplier>> getAllSuppliers() {
        return ResponseEntity.ok(supplierService.getAllSuppliers());
    }

    // 3. API LẤY CHI TIẾT một nhà cung cấp theo ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getSupplierById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(supplierService.getSupplierById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 4. API CẬP NHẬT nhà cung cấp (Kèm sửa/thêm sản phẩm hợp đồng)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSupplier(@PathVariable Long id, @RequestBody SupplierRequest request) {
        try {
            Supplier updatedSupplier = supplierService.updateSupplier(id, request);
            return ResponseEntity.ok(updatedSupplier);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 5. API XÓA nhà cung cấp (Xóa luôn cả sản phẩm hợp đồng liên quan)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSupplier(@PathVariable Long id) {
        try {
            supplierService.deleteSupplier(id);
            return ResponseEntity.ok("Đã xóa Nhà cung cấp và toàn bộ sản phẩm liên quan!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}