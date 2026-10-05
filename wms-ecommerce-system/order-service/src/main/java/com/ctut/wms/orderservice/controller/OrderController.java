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
}