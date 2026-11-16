/**
 * ==============================================================================
 * Controller: VoucherController
 * Phân hệ: Order Service (Quản lý đơn hàng & Tách đơn đa shop - Port 8082)
 * Mô tả: Tra cứu, kiểm tra và tạo Voucher (toàn sàn do Admin tạo, voucher riêng do Chủ shop tạo).
 * ==============================================================================
 */
package com.ctut.wms.orderservice.controller;

import com.ctut.wms.orderservice.client.WmsClient;
import com.ctut.wms.orderservice.entity.Voucher;
import com.ctut.wms.orderservice.repository.VoucherRepository;
import com.ctut.wms.orderservice.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherRepository voucherRepository;
    private final WmsClient wmsClient;

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

    // Kiểm tra nhanh mã voucher xem có hợp lệ trước khi bấm đặt hàng (chỉ đọc, không ghi CSDL)
    @GetMapping("/check/{maVoucher}")
    public ResponseEntity<?> checkVoucher(@PathVariable String maVoucher) {
        String code = maVoucher != null ? maVoucher.trim().toUpperCase() : "";
        LocalDateTime now = LocalDateTime.now();
        return voucherRepository.findByMaVoucher(code)
                .<ResponseEntity<?>>map(v -> {
                    if (v.getSoLuongConLai() == null || v.getSoLuongConLai() <= 0) {
                        return ResponseEntity.badRequest().body("Mã giảm giá đã hết lượt sử dụng!");
                    }
                    if (v.getNgayBatDau() != null && v.getNgayBatDau().isAfter(now)) {
                        return ResponseEntity.badRequest().body("Mã giảm giá chưa đến thời gian sử dụng!");
                    }
                    if (v.getNgayHetHan() != null && v.getNgayHetHan().isBefore(now)) {
                        return ResponseEntity.badRequest().body("Mã giảm giá đã hết hạn!");
                    }
                    return ResponseEntity.ok(v);
                })
                .orElseGet(() -> ResponseEntity.badRequest().body("Mã giảm giá [" + code + "] không tồn tại!"));
    }

    // Tạo Voucher: Admin tạo được mọi loại; Chủ shop chỉ tạo voucher cho gian hàng của mình
    @PostMapping
    public ResponseEntity<?> createVoucher(@RequestBody Voucher voucher) {
        try {
            // Không cho phép ghi đè voucher có sẵn thông qua id/version gửi kèm
            voucher.setId(null);
            voucher.setVersion(null);

            if (voucher.getMaVoucher() == null || voucher.getMaVoucher().isBlank()) {
                return ResponseEntity.badRequest().body("Lỗi: Mã voucher không được để trống!");
            }
            voucher.setMaVoucher(voucher.getMaVoucher().trim().toUpperCase());
            if (voucherRepository.findByMaVoucher(voucher.getMaVoucher()).isPresent()) {
                return ResponseEntity.badRequest().body("Lỗi: Mã voucher [" + voucher.getMaVoucher() + "] đã tồn tại!");
            }
            if (voucher.getPhanTramGiam() == null || voucher.getPhanTramGiam() < 1 || voucher.getPhanTramGiam() > 100) {
                return ResponseEntity.badRequest().body("Lỗi: Phần trăm giảm phải nằm trong khoảng 1 - 100!");
            }
            if (voucher.getSoLuongConLai() == null || voucher.getSoLuongConLai() < 0) {
                return ResponseEntity.badRequest().body("Lỗi: Số lượng voucher không hợp lệ!");
            }
            if (voucher.getGiamToiDa() != null && voucher.getGiamToiDa().compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest().body("Lỗi: Mức giảm tối đa không hợp lệ!");
            }

            if (!CurrentUser.isAdmin()) {
                if (voucher.getCuaHangId() == null) {
                    return ResponseEntity.status(403).body("Từ chối truy cập: Chỉ Quản trị viên được tạo voucher toàn sàn!");
                }
                wmsClient.requireStoreOwner(voucher.getCuaHangId());
            }
            return ResponseEntity.ok(voucherRepository.save(voucher));
        } catch (com.ctut.wms.orderservice.security.ForbiddenException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // Hủy phát hành voucher: kết thúc hiệu lực ngay (giữ bản ghi vì các đơn cũ vẫn tham chiếu tới voucher)
    // Chủ shop chỉ hủy được voucher của gian hàng mình; voucher toàn sàn chỉ Admin hủy được.
    @PutMapping("/{maVoucher}/deactivate")
    public ResponseEntity<?> deactivateVoucher(@PathVariable String maVoucher) {
        String code = maVoucher.trim().toUpperCase();
        Voucher v = voucherRepository.findByMaVoucher(code).orElse(null);
        if (v == null) {
            return ResponseEntity.badRequest().body("Lỗi: Mã voucher [" + code + "] không tồn tại!");
        }
        try {
            if (!CurrentUser.isAdmin()) {
                if (v.getCuaHangId() == null) {
                    return ResponseEntity.status(403).body("Từ chối truy cập: Chỉ Quản trị viên được hủy voucher toàn sàn!");
                }
                wmsClient.requireStoreOwner(v.getCuaHangId());
            }
        } catch (com.ctut.wms.orderservice.security.ForbiddenException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
        v.setNgayHetHan(LocalDateTime.now().minusSeconds(1));
        return ResponseEntity.ok(voucherRepository.save(v));
    }

    // Lấy danh sách toàn bộ Voucher của TẤT CẢ các Cửa hàng (Shop)
    @GetMapping("/stores")
    public ResponseEntity<List<Voucher>> getAllStoreVouchers() {
        return ResponseEntity.ok(voucherRepository.findByCuaHangIdIsNotNull());
    }
}
