package com.ctut.wms.wmscoreservice.controller.inventory;

import com.ctut.wms.wmscoreservice.entity.inventory.TheKho;
import com.ctut.wms.wmscoreservice.service.inventory.TheKhoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stock-cards")
@RequiredArgsConstructor
public class TheKhoController {
    private final TheKhoService theKhoService;

    @GetMapping
    public ResponseEntity<List<TheKho>> getStockCards(
            @RequestParam(required = false) Long khoId,
            @RequestParam(required = false) Long hangHoaId
    ) {
        if (khoId != null && hangHoaId != null) {
            return ResponseEntity.ok(theKhoService.getTheKhoByKhoAndHangHoa(khoId, hangHoaId));
        } else if (khoId != null) {
            return ResponseEntity.ok(theKhoService.getTheKhoByKho(khoId));
        } else if (hangHoaId != null) {
            return ResponseEntity.ok(theKhoService.getTheKhoByHangHoa(hangHoaId));
        }
        return ResponseEntity.ok(theKhoService.getAllTheKho());
    }

    @PostMapping
    public ResponseEntity<TheKho> createStockCard(@RequestBody TheKho theKho) {
        return ResponseEntity.ok(theKhoService.recordStockMovement(theKho));
    }
}

