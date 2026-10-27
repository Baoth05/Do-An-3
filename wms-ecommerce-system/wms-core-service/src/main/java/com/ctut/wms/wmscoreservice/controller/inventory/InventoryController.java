package com.ctut.wms.wmscoreservice.controller.inventory;

import com.ctut.wms.wmscoreservice.dto.inventory.InventoryRequest;
import com.ctut.wms.wmscoreservice.dto.inventory.InventoryResponse;
import com.ctut.wms.wmscoreservice.service.inventory.InventoryService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    @PostMapping("/add")
    public ResponseEntity<?> addStock(@RequestBody InventoryRequest request) {
        try {
            return ResponseEntity.ok(inventoryService.addStock(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<InventoryResponse>> getAllInventory() {
        return ResponseEntity.ok(inventoryService.getAllInventory());
    }

    // Endpoint cho Sàn TMĐT tập trung - Lấy tất cả sản phẩm đang mở bán từ các gian hàng
    @GetMapping("/marketplace")
    public ResponseEntity<List<InventoryResponse>> getMarketplaceProducts() {
        return ResponseEntity.ok(inventoryService.getMarketplaceProducts());
    }

    // Endpoint cho Kho Cửa Hàng / Kênh Người Bán - Lấy tồn kho của 1 shop
    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<InventoryResponse>> getInventoryByStore(@PathVariable Long storeId) {
        return ResponseEntity.ok(inventoryService.getInventoryByWarehouse(storeId));
    }

    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<InventoryResponse>> getInventoryByWarehouse(@PathVariable Long warehouseId) {
        return ResponseEntity.ok(inventoryService.getInventoryByWarehouse(warehouseId));
    }

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

    // Endpoint cho Kênh Người Bán - Bật/tắt mở bán và định giá bán lẻ trên Sàn
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
