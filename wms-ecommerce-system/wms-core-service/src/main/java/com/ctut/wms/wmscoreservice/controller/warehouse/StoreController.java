package com.ctut.wms.wmscoreservice.controller.warehouse;

import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
import com.ctut.wms.wmscoreservice.service.warehouse.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stores")
@RequiredArgsConstructor
public class StoreController {
    private final WarehouseService warehouseService;

    @GetMapping
    public ResponseEntity<List<Warehouse>> getAllStores() {
        return ResponseEntity.ok(warehouseService.getStores());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getStoreById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(warehouseService.getWarehouseById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/manager/{userId}")
    public ResponseEntity<?> getStoreByManager(@PathVariable Long userId) {
        return warehouseService.getStoreByManager(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createStore(@RequestBody Warehouse store) {
        try {
            store.setLoaiHinh("KHO_CUA_HANG");
            return ResponseEntity.ok(warehouseService.createWarehouse(store));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStore(@PathVariable Long id, @RequestBody Warehouse store) {
        try {
            return ResponseEntity.ok(warehouseService.updateWarehouse(id, store));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

