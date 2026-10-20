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
}

