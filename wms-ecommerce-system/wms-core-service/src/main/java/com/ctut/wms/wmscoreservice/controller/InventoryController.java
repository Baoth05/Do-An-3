package com.ctut.wms.wmscoreservice.controller;

import com.ctut.wms.wmscoreservice.dto.InventoryRequest;
import com.ctut.wms.wmscoreservice.dto.InventoryResponse;
import com.ctut.wms.wmscoreservice.service.InventoryService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping({"/inventory", "/wms/inventory"})
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService; // Dùng Service thay vì Repository

    // API thêm/nhập số lượng tồn kho vào vị trí kệ
    @PostMapping("/add")
    public ResponseEntity<?> addStock(@RequestBody InventoryRequest request) {
        try {
            return ResponseEntity.ok(inventoryService.addStock(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API lấy toàn bộ danh sách tồn kho hệ thống
    @GetMapping
    public ResponseEntity<List<InventoryResponse>> getAllInventory() {
        return ResponseEntity.ok(inventoryService.getAllInventory());
    }

    // API lấy các sản phẩm đang được mở bán trên sàn TMĐT tập trung
    @GetMapping("/marketplace")
    public ResponseEntity<List<InventoryResponse>> getMarketplaceProducts() {
        return ResponseEntity.ok(inventoryService.getMarketplaceProducts());
    }

    // API lấy tồn kho của một Cửa Hàng / Gian Hàng cụ thể
    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<InventoryResponse>> getInventoryByStore(@PathVariable Long storeId) {
        return ResponseEntity.ok(inventoryService.getInventoryByWarehouse(storeId));
    }

    // API lấy tồn kho của một Kho Bãi vật lý
    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<InventoryResponse>> getInventoryByWarehouse(@PathVariable Long warehouseId) {
        return ResponseEntity.ok(inventoryService.getInventoryByWarehouse(warehouseId));
    }

    // API cập nhật ngưỡng an toàn tối thiểu và tối đa của sản phẩm trên kệ
    @PutMapping("/{id}/thresholds")
    public ResponseEntity<?> updateThresholds(
            @PathVariable Long id,
            @RequestParam(required = false) Integer min,
            @RequestParam(required = false) Integer max
    ) {
        try {
            return ResponseEntity.ok(inventoryService.updateThresholds(id, min, max));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Data
    public static class PublishRequest {
        private Boolean dangBan;
        private BigDecimal giaBanHienTai;
        private Integer soLuongCanhBao;
    }

    // API đăng bán sản phẩm lên sàn TMĐT và thiết lập giá bán lẻ
    @PutMapping("/{id}/publish")
    public ResponseEntity<?> publishToMarketplace(
            @PathVariable Long id,
            @RequestBody PublishRequest request
    ) {
        try {
            return ResponseEntity.ok(inventoryService.publishToMarketplace(
                    id,
                    request.getDangBan(),
                    request.getGiaBanHienTai(),
                    request.getSoLuongCanhBao()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

