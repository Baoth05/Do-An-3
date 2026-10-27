package com.ctut.wms.wmscoreservice.controller.exportnote;

import com.ctut.wms.wmscoreservice.dto.exportnote.ExportNoteRequest;
import com.ctut.wms.wmscoreservice.dto.exportnote.ExportNoteResponse;
import com.ctut.wms.wmscoreservice.service.exportnote.ExportNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/export-notes")
@RequiredArgsConstructor
public class ExportNoteController {

    private final ExportNoteService exportNoteService;

    @PostMapping
    public ResponseEntity<?> createExportNote(@RequestBody ExportNoteRequest request) {
        try {
            return ResponseEntity.ok(exportNoteService.createExportNote(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<ExportNoteResponse>> getAllExportNotes() {
        return ResponseEntity.ok(exportNoteService.getAllExportNotes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getExportNoteById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(exportNoteService.getExportNoteById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            return ResponseEntity.ok(exportNoteService.updateStatus(id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
