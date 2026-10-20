package com.ctut.wms.orderservice.controller;

import com.ctut.wms.orderservice.entity.Voucher;
import com.ctut.wms.orderservice.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherRepository voucherRepository;

    // Lấy danh sách tất cả Voucher còn hạn và còn số lượng
    @GetMapping
    public ResponseEntity<List<Voucher>> getAllVouchers() {
        return ResponseEntity.ok(voucherRepository.findAll());
    }

    // Kiểm tra nhanh mã voucher xem có hợp lệ trước khi bấm đặt hàng
    @GetMapping("/check/{maVoucher}")
    public ResponseEntity<?> checkVoucher(@PathVariable String maVoucher) {
        return voucherRepository.findByMaVoucher(maVoucher)
                .map(v -> {
                    if (v.getSoLuongConLai() <= 0) {
                        return ResponseEntity.badRequest().body("Mã giảm giá đã hết lượt sử dụng!");
                    }
                    if (v.getNgayHetHan() != null && v.getNgayHetHan().isBefore(java.time.LocalDateTime.now())) {
                        return ResponseEntity.badRequest().body("Mã giảm giá đã hết hạn!");
                    }
                    return ResponseEntity.ok(v);
                })
                .orElse(ResponseEntity.badRequest().body("Mã giảm giá không tồn tại!"));
    }

    // API hỗ trợ tạo nhanh Voucher để test
    @PostMapping
    public ResponseEntity<Voucher> createVoucher(@RequestBody Voucher voucher) {
        return ResponseEntity.ok(voucherRepository.save(voucher));
    }
}