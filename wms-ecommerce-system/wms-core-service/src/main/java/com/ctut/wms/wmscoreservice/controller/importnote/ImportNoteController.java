package com.ctut.wms.wmscoreservice.controller.importnote;

import com.ctut.wms.wmscoreservice.dto.importnote.ImportNoteRequest;
import com.ctut.wms.wmscoreservice.service.importnote.ImportNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/import-notes")
@RequiredArgsConstructor
public class ImportNoteController {

    private final ImportNoteService importNoteService;

    // API tạo Phiếu nhập kho (và tự động cộng dồn tồn kho)
    @PostMapping
    public ResponseEntity<?> createImportNote(@RequestBody ImportNoteRequest request) {
        try {
            return ResponseEntity.ok(importNoteService.createImportNote(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


}