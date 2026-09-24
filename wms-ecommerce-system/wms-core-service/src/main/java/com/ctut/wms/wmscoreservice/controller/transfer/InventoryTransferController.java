package com.ctut.wms.wmscoreservice.controller.transfer;

import com.ctut.wms.wmscoreservice.dto.transfer.InventoryTransferRequest;
import com.ctut.wms.wmscoreservice.service.transfer.InventoryTransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}