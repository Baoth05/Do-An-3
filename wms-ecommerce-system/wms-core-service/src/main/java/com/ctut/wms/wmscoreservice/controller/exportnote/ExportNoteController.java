package com.ctut.wms.wmscoreservice.controller.exportnote;


import com.ctut.wms.wmscoreservice.dto.exportnote.ExportNoteRequest;
import com.ctut.wms.wmscoreservice.service.exportnote.ExportNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}