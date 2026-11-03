package com.ctut.wms.wmscoreservice.controller;

import com.ctut.wms.wmscoreservice.entity.TheKho;
import com.ctut.wms.wmscoreservice.service.TheKhoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/stock-cards", "/wms/stock-cards"})
@CrossOrigin("*")
@RequiredArgsConstructor
public class TheKhoController {

    private final TheKhoService theKhoService; // Dùng Service thay vì Repository

    // API lấy danh sách Thẻ Kho (Có thể lọc theo Kho hoặc Sản Phẩm, hỗ trợ linh hoạt tên tham số)
    @GetMapping
    public ResponseEntity<List<TheKho>> getStockCards(
            @RequestParam(required = false) Long khoId,
            @RequestParam(required = false) Long khoHangId,
            @RequestParam(required = false) Long hangHoaId,
            @RequestParam(required = false) Long sanPhamId
    ) {
        Long targetKho = khoId != null ? khoId : khoHangId;
        Long targetHangHoa = hangHoaId != null ? hangHoaId : sanPhamId;

        if (targetKho != null && targetHangHoa != null) {
            return ResponseEntity.ok(theKhoService.getTheKhoByKhoAndHangHoa(targetKho, targetHangHoa));
        } else if (targetKho != null) {
            return ResponseEntity.ok(theKhoService.getTheKhoByKho(targetKho));
        } else if (targetHangHoa != null) {
            return ResponseEntity.ok(theKhoService.getTheKhoByHangHoa(targetHangHoa));
        }
        return ResponseEntity.ok(theKhoService.getAllTheKho());
    }

    // API ghi nhận biến động Thẻ Kho vật lý mới
    @PostMapping
    public ResponseEntity<TheKho> createStockCard(@RequestBody TheKho theKho) {
        return ResponseEntity.ok(theKhoService.recordStockMovement(theKho));
    }
}
