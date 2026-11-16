package com.ctut.wms.wmscoreservice.controller;

import com.ctut.wms.wmscoreservice.dto.contract.SupplyContractDtos.*;
import com.ctut.wms.wmscoreservice.security.ForbiddenException;
import com.ctut.wms.wmscoreservice.service.SupplyContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.function.Supplier;

/**
 * API Hợp đồng cung ứng nội bộ Kho Tổng -> Kho Cửa Hàng.
 */
@RestController
@RequestMapping({"/supply-contracts", "/wms/supply-contracts"})
@RequiredArgsConstructor
public class SupplyContractController {

    private final SupplyContractService service;

    private ResponseEntity<?> handle(Supplier<Object> action) {
        try {
            return ResponseEntity.ok(action.get());
        } catch (ForbiddenException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Danh sách hợp đồng (storeId: lọc theo gian hàng; bỏ trống: toàn hệ thống - Admin/Kho)
    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) Long storeId) {
        return handle(() -> service.list(storeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return handle(() -> service.get(id));
    }

    // Bước 1: Shop gửi yêu cầu
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateRequest request) {
        return handle(() -> service.create(request));
    }

    // Bước 2: Admin duyệt vòng 1
    @PutMapping("/{id}/approve-request")
    public ResponseEntity<?> approveRequest(@PathVariable Long id, @RequestBody(required = false) NoteRequest body) {
        return handle(() -> service.approveRequest(id, body != null ? body.getNote() : null));
    }

    // Bước 3: Shop ký số
    @PutMapping("/{id}/sign")
    public ResponseEntity<?> sign(@PathVariable Long id, @RequestBody SignRequest body) {
        return handle(() -> service.sign(id, body));
    }

    // Bước 4: Admin duyệt vòng 2
    @PutMapping("/{id}/approve-transfer")
    public ResponseEntity<?> approveTransfer(@PathVariable Long id, @RequestBody(required = false) NoteRequest body) {
        return handle(() -> service.approveTransfer(id, body != null ? body.getNote() : null));
    }

    // Bước 5: Kho Tổng xuất hàng (trừ tồn kho tổng)
    @PutMapping("/{id}/dispatch")
    public ResponseEntity<?> dispatch(@PathVariable Long id, @RequestBody(required = false) DispatchRequest body) {
        return handle(() -> service.dispatch(id, body != null ? body.getShippingProvider() : null));
    }

    // Bước 6: Shop xác nhận nhận hàng (cộng tồn kho shop)
    @PutMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable Long id) {
        return handle(() -> service.complete(id));
    }

    // Từ chối hợp đồng
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody(required = false) RejectRequest body) {
        return handle(() -> service.reject(id, body != null ? body.getReason() : null));
    }
}
