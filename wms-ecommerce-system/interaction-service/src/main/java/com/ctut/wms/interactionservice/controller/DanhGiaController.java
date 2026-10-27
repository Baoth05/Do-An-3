package com.ctut.wms.interactionservice.controller;

import com.ctut.wms.interactionservice.dto.DanhGiaRequest;
import com.ctut.wms.interactionservice.service.DanhGiaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/interactions/danh-gia", "/danh-gia"})
@RequiredArgsConstructor
public class DanhGiaController {

    private final DanhGiaService danhGiaService;

    // API gửi đánh giá mới
    @PostMapping
    public ResponseEntity<?> themDanhGia(@RequestBody DanhGiaRequest request) {
        try {
            return ResponseEntity.ok(danhGiaService.themDanhGia(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API lấy toàn bộ đánh giá của 1 sản phẩm cụ thể
    @GetMapping("/{maHangHoa}")
    public ResponseEntity<?> layDanhGia(@PathVariable String maHangHoa) {
        return ResponseEntity.ok(danhGiaService.layDanhGiaTheoSanPham(maHangHoa));
    }

    // API lấy đánh giá của 1 Gian hàng cụ thể (tính uy tín shop)
    @GetMapping("/shop/{cuaHangId}")
    public ResponseEntity<?> layDanhGiaTheoShop(@PathVariable Long cuaHangId) {
        return ResponseEntity.ok(danhGiaService.layDanhGiaTheoShop(cuaHangId));
    }
}
