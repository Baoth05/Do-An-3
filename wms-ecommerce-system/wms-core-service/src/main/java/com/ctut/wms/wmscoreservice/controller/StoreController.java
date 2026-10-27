package com.ctut.wms.wmscoreservice.controller;

import com.ctut.wms.wmscoreservice.entity.Warehouse;
import com.ctut.wms.wmscoreservice.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stores")
@RequiredArgsConstructor
public class StoreController {

    private final WarehouseService warehouseService; // Dùng Service thay vì Repository

    // API lấy danh sách tất cả các Gian hàng / Kho Cửa Hàng trên sàn TMĐT
    @GetMapping
    public ResponseEntity<List<Warehouse>> getAllStores() {
        return ResponseEntity.ok(warehouseService.getStores());
    }

    // API lấy thông tin chi tiết một gian hàng theo ID (Profile shop, Banner, Địa chỉ)
    @GetMapping("/{id}")
    public ResponseEntity<?> getStoreById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(warehouseService.getWarehouseById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // API lấy gian hàng thuộc quyền quản lý của một User (Chủ cửa hàng)
    @GetMapping("/manager/{userId}")
    public ResponseEntity<?> getStoreByManager(@PathVariable Long userId) {
        return warehouseService.getStoreByManager(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // API đăng ký tạo gian hàng mới trên sàn
    @PostMapping
    public ResponseEntity<?> createStore(@RequestBody Warehouse store) {
        try {
            store.setLoaiHinh("KHO_CUA_HANG");
            return ResponseEntity.ok(warehouseService.createWarehouse(store));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API cập nhật thông tin gian hàng (Mô tả, Ảnh đại diện, Tên shop)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateStore(@PathVariable Long id, @RequestBody Warehouse store) {
        try {
            return ResponseEntity.ok(warehouseService.updateWarehouse(id, store));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
