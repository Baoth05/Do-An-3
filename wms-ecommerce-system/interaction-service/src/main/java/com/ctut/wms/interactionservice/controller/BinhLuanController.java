/**
 * ==============================================================================
 * Controller: BinhLuanController
 * Phân hệ: Interaction Service (Đánh giá, nhận xét & hỏi đáp - Port 8083)
 * Mô tả: Tiếp nhận, điều phối và xử lý các yêu cầu HTTP API liên quan đến BinhLuanController.
 * ==============================================================================
 */
package com.ctut.wms.interactionservice.controller;

import com.ctut.wms.interactionservice.dto.BinhLuanRequest;
import com.ctut.wms.interactionservice.service.BinhLuanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/interactions/binh-luan", "/binh-luan"})
@RequiredArgsConstructor
public class BinhLuanController {

    private final BinhLuanService binhLuanService;

    // API gửi bình luận mới (bao gồm cả Reply nếu có parentId)
    @PostMapping
    public ResponseEntity<?> themBinhLuan(@RequestBody BinhLuanRequest request) {
        try {
            return ResponseEntity.ok(binhLuanService.themBinhLuan(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API lấy bình luận gốc kèm các phản hồi theo mã hàng hóa
    @GetMapping("/{maHangHoa}")
    public ResponseEntity<?> layBinhLuan(@PathVariable String maHangHoa) {
        return ResponseEntity.ok(binhLuanService.layBinhLuanGoc(maHangHoa));
    }

    // API lấy bình luận theo Gian hàng trên Sàn
    @GetMapping("/shop/{cuaHangId}")
    public ResponseEntity<?> layBinhLuanTheoShop(@PathVariable Long cuaHangId) {
        return ResponseEntity.ok(binhLuanService.layBinhLuanTheoShop(cuaHangId));
    }
}
