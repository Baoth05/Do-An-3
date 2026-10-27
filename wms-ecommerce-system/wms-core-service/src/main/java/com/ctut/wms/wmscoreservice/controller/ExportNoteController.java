package com.ctut.wms.wmscoreservice.controller;

import com.ctut.wms.wmscoreservice.dto.exportnote.ExportNoteRequest;
import com.ctut.wms.wmscoreservice.dto.exportnote.ExportNoteResponse;
import com.ctut.wms.wmscoreservice.service.ExportNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/export-notes")
@RequiredArgsConstructor
public class ExportNoteController {

    private final ExportNoteService exportNoteService; // Dùng Service thay vì Repository

    // API lập phiếu xuất kho mới (Bàn giao bưu cục hoặc điều chuyển kho)
    @PostMapping
    public ResponseEntity<?> createExportNote(@RequestBody ExportNoteRequest request) {
        try {
            return ResponseEntity.ok(exportNoteService.createExportNote(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API lấy danh sách toàn bộ phiếu xuất kho
    @GetMapping
    public ResponseEntity<List<ExportNoteResponse>> getAllExportNotes() {
        return ResponseEntity.ok(exportNoteService.getAllExportNotes());
    }

    // API lấy chi tiết một phiếu xuất kho theo ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getExportNoteById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(exportNoteService.getExportNoteById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // API cập nhật trạng thái phiếu xuất kho (VD: DANG_GIAO, HOAN_THANH)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            return ResponseEntity.ok(exportNoteService.updateStatus(id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
