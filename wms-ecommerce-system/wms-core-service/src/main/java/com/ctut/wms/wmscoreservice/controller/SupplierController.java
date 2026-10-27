
package com.ctut.wms.wmscoreservice.controller;


import com.ctut.wms.wmscoreservice.dto.SupplierRequest;
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

    private final SupplierService supplierService; // Dùng Service thay vì Repository

    // API thêm nhà cung cấp (Kèm theo danh sách sản phẩm)
    @PostMapping
    public ResponseEntity<?> createSupplier(@RequestBody SupplierRequest request) {
        try {
            Supplier response = supplierService.createSupplier(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API lấy danh sách nhà cung cấp
    @GetMapping
    public ResponseEntity<List<Supplier>> getAllSuppliers() {
        return ResponseEntity.ok(supplierService.getAllSuppliers());
    }

    // API xóa nhà cung cấp (Xóa luôn cả sản phẩm hợp đồng)
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