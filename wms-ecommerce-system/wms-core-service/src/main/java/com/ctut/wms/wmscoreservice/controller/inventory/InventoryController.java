package com.ctut.wms.wmscoreservice.controller.inventory;
import com.ctut.wms.wmscoreservice.dto.inventory.InventoryRequest;
import com.ctut.wms.wmscoreservice.service.inventory.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
