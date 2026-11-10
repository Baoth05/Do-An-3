/**
 * ==============================================================================
 * Controller: VoucherController
 * Phân hệ: Order Service (Quản lý đơn hàng & Tách đơn đa shop - Port 8082)
 * Mô tả: Tiếp nhận, điều phối và xử lý các yêu cầu HTTP API liên quan đến VoucherController.
 * ==============================================================================
 */
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

    // Lấy danh sách tất cả Voucher
    @GetMapping
    public ResponseEntity<List<Voucher>> getAllVouchers() {
        return ResponseEntity.ok(voucherRepository.findAll());
    }

    // Lấy danh sách Voucher toàn sàn (do Admin tạo)
    @GetMapping("/global")
    public ResponseEntity<List<Voucher>> getGlobalVouchers() {
        return ResponseEntity.ok(voucherRepository.findByCuaHangIdIsNull());
    }

    // Lấy danh sách Voucher riêng của từng Cửa hàng (Shop tạo)
    @GetMapping("/store/{cuaHangId}")
    public ResponseEntity<List<Voucher>> getStoreVouchers(@PathVariable Long cuaHangId) {
        return ResponseEntity.ok(voucherRepository.findByCuaHangId(cuaHangId));
    }

    // Kiểm tra nhanh mã voucher xem có hợp lệ trước khi bấm đặt hàng
    @GetMapping("/check/{maVoucher}")
    public ResponseEntity<?> checkVoucher(@PathVariable String maVoucher) {
        String code = maVoucher != null ? maVoucher.trim().toUpperCase() : "";
        return voucherRepository.findByMaVoucher(code)
                .map(v -> {
                    if (v.getSoLuongConLai() != null && v.getSoLuongConLai() <= 0) {
                        return ResponseEntity.badRequest().body("Mã giảm giá đã hết lượt sử dụng!");
                    }
                    if (v.getNgayHetHan() != null && v.getNgayHetHan().isBefore(java.time.LocalDateTime.now())) {
                        return ResponseEntity.badRequest().body("Mã giảm giá đã hết hạn!");
                    }
                    return ResponseEntity.ok(v);
                })
                .orElseGet(() -> {
                    // Tự động khởi tạo nếu là các mã mặc định của hệ thống
                    if ("CTUT50K".equals(code) || "CTUTNEW50".equals(code) || "FREESHIP".equals(code) || "TECHPRO10".equals(code) || code.startsWith("SHOP") || code.startsWith("FREESHIP")) {
                        Voucher newVoucher = new Voucher();
                        newVoucher.setMaVoucher(code);
                        newVoucher.setCuaHangId(code.startsWith("SHOP1") || code.equals("FREESHIP1") ? 1L : (code.startsWith("SHOP2") ? 2L : (code.startsWith("SHOP3") ? 3L : null)));
                        newVoucher.setPhanTramGiam(code.contains("FREE") ? 100 : (code.contains("15") ? 15 : 10));
                        newVoucher.setGiamToiDa(code.contains("FREE") ? java.math.BigDecimal.valueOf(30000) : (code.contains("TECH") ? java.math.BigDecimal.valueOf(200000) : java.math.BigDecimal.valueOf(50000)));
                        newVoucher.setDonHangToiThieu(java.math.BigDecimal.valueOf(150000));
                        newVoucher.setSoLuongConLai(500);
                        newVoucher.setNgayBatDau(java.time.LocalDateTime.now().minusDays(1));
                        newVoucher.setNgayHetHan(java.time.LocalDateTime.now().plusMonths(12));
                        return ResponseEntity.ok(voucherRepository.save(newVoucher));
                    }
                    return ResponseEntity.badRequest().body("Mã giảm giá [" + code + "] không tồn tại!");
                });
    }

    // API hỗ trợ tạo nhanh Voucher (dùng cho Admin hoặc Shop Owner)
    @PostMapping
    public ResponseEntity<Voucher> createVoucher(@RequestBody Voucher voucher) {
        return ResponseEntity.ok(voucherRepository.save(voucher));
    }
}
