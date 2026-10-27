package com.ctut.wms.wmscoreservice.controller;

import com.ctut.wms.wmscoreservice.dto.InventoryTransferRequest;
import com.ctut.wms.wmscoreservice.entity.InventoryTransfer;
import com.ctut.wms.wmscoreservice.service.InventoryTransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/transfers", "/wms/transfers"})
@RequiredArgsConstructor
public class InventoryTransferController {

    private final InventoryTransferService transferService; // Dùng Service thay vì Repository

    // API thực hiện điều chuyển hàng hóa giữa 2 kho bãi
    @PostMapping
    public ResponseEntity<?> transferStock(@RequestBody InventoryTransferRequest request) {
        try {
            return ResponseEntity.ok(transferService.transferStock(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API lấy danh sách toàn bộ phiếu điều chuyển kho
    @GetMapping
    public ResponseEntity<List<InventoryTransfer>> getAllTransfers() {
        return ResponseEntity.ok(transferService.getAllTransfers());
    }
}

