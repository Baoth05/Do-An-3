package com.ctut.wms.wmscoreservice.controller.transfer;

import com.ctut.wms.wmscoreservice.dto.transfer.InventoryTransferRequest;
import com.ctut.wms.wmscoreservice.dto.transfer.InventoryTransferResponse;
import com.ctut.wms.wmscoreservice.service.transfer.InventoryTransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/transfers")
@RequiredArgsConstructor
public class InventoryTransferController {

    private final InventoryTransferService transferService;

    @PostMapping
    public ResponseEntity<?> transferStock(@RequestBody InventoryTransferRequest request) {
        try {
            return ResponseEntity.ok(transferService.transferStock(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<InventoryTransferResponse>> getAllTransfers() {
        return ResponseEntity.ok(transferService.getAllTransfers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTransferById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(transferService.getTransferById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
