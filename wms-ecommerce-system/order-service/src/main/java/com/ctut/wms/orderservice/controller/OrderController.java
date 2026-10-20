package com.ctut.wms.orderservice.controller;

import com.ctut.wms.orderservice.dto.OrderRequest;
import com.ctut.wms.orderservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequest request) {
        try {
            // Gọi hàm xử lý logic đặt hàng từ Service
            return ResponseEntity.ok(orderService.placeOrder(request));
        } catch (RuntimeException e) {
            // Nếu có lỗi (ví dụ: Hết lượt Voucher, Đơn chưa đủ tiền...), trả về mã 400 và lời báo lỗi
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user/{nguoiDungId}")
    public ResponseEntity<?> getOrdersByUser(@PathVariable Long nguoiDungId) {
        return ResponseEntity.ok(orderService.getOrdersByUser(nguoiDungId));
    }

    @GetMapping("/{maDonHang}")
    public ResponseEntity<?> getOrderByMaDonHang(@PathVariable String maDonHang) {
        try {
            return ResponseEntity.ok(orderService.getOrderByMaDonHang(maDonHang));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{maDonHang}/payment-status")
    public ResponseEntity<?> updatePaymentStatus(@PathVariable String maDonHang, @RequestParam String paymentStatus) {
        try {
            return ResponseEntity.ok(orderService.updatePaymentStatus(maDonHang, paymentStatus));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(orderService.cancelOrder(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}