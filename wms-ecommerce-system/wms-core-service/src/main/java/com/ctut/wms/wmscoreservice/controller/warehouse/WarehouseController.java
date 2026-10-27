package com.ctut.wms.wmscoreservice.controller.warehouse;

import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import com.ctut.wms.wmscoreservice.service.warehouse.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/warehouses")
@RequiredArgsConstructor
public class WarehouseController {
    private final WarehouseService warehouseService;

    @PostMapping
    public ResponseEntity<?> createWarehouse(@RequestBody Warehouse warehouse) {
        try {
            return ResponseEntity.ok(warehouseService.createWarehouse(warehouse));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Warehouse>> getAllWarehouses() {
        return ResponseEntity.ok(warehouseService.getAllWarehouses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getWarehouseById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(warehouseService.getWarehouseById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateWarehouse(@PathVariable Long id, @RequestBody Warehouse warehouse) {
        try {
            return ResponseEntity.ok(warehouseService.updateWarehouse(id, warehouse));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWarehouse(@PathVariable Long id) {
        try {
            warehouseService.deleteWarehouse(id);
            return ResponseEntity.ok("Đã xóa kho hàng thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
