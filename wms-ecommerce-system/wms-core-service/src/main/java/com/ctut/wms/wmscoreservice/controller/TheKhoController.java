package com.ctut.wms.wmscoreservice.controller;

import com.ctut.wms.wmscoreservice.entity.TheKho;
import com.ctut.wms.wmscoreservice.service.TheKhoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stock-cards")
@RequiredArgsConstructor
public class TheKhoController {

    private final TheKhoService theKhoService; // Dùng Service thay vì Repository

    // API lấy danh sách Thẻ Kho (Có thể lọc theo Kho hoặc Sản Phẩm)
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

    // API ghi nhận biến động Thẻ Kho vật lý mới
    @PostMapping
    public ResponseEntity<TheKho> createStockCard(@RequestBody TheKho theKho) {
        return ResponseEntity.ok(theKhoService.recordStockMovement(theKho));
    }
}
