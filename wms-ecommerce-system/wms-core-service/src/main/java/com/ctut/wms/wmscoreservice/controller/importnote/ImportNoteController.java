package com.ctut.wms.wmscoreservice.controller.importnote;

import com.ctut.wms.wmscoreservice.dto.importnote.ImportNoteRequest;
import com.ctut.wms.wmscoreservice.dto.importnote.ImportNoteResponse;
import com.ctut.wms.wmscoreservice.service.importnote.ImportNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/import-notes")
@RequiredArgsConstructor
public class ImportNoteController {

    private final ImportNoteService importNoteService;

    @PostMapping
    public ResponseEntity<?> createImportNote(@RequestBody ImportNoteRequest request) {
        try {
            return ResponseEntity.ok(importNoteService.createImportNote(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<ImportNoteResponse>> getAllImportNotes() {
        return ResponseEntity.ok(importNoteService.getAllImportNotes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getImportNoteById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(importNoteService.getImportNoteById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            return ResponseEntity.ok(importNoteService.updateStatus(id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
