package com.ctut.wms.wmscoreservice.controller;

import com.ctut.wms.wmscoreservice.dto.importnote.ImportNoteRequest;
import com.ctut.wms.wmscoreservice.dto.importnote.ImportNoteResponse;
import com.ctut.wms.wmscoreservice.service.ImportNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/import-notes")
@RequiredArgsConstructor
public class ImportNoteController {

    private final ImportNoteService importNoteService; // Dùng Service thay vì Repository

    // API lập phiếu nhập kho mới (Từ Nhà Cung Cấp hoặc từ Kho Tổng)
    @PostMapping
    public ResponseEntity<?> createImportNote(@RequestBody ImportNoteRequest request) {
        try {
            return ResponseEntity.ok(importNoteService.createImportNote(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API lấy danh sách toàn bộ phiếu nhập kho
    @GetMapping
    public ResponseEntity<List<ImportNoteResponse>> getAllImportNotes() {
        return ResponseEntity.ok(importNoteService.getAllImportNotes());
    }

    // API lấy chi tiết một phiếu nhập kho theo ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getImportNoteById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(importNoteService.getImportNoteById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // API cập nhật trạng thái phiếu nhập kho (VD: HOAN_THANH, DANG_XU_LY)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            return ResponseEntity.ok(importNoteService.updateStatus(id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
