package com.ctut.wms.orderservice.controller;

import com.ctut.wms.orderservice.dto.MultiShopCheckoutRequest;
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
            return ResponseEntity.ok(orderService.placeOrder(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Endpoint Thanh toán Giỏ hàng Đa Shop (Tự động tách đơn hàng Order Splitting)
     */
    @PostMapping("/checkout-multishop")
    public ResponseEntity<?> checkoutMultiShop(@RequestBody MultiShopCheckoutRequest request) {
        try {
            return ResponseEntity.ok(orderService.checkoutMultiShop(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user/{nguoiDungId}")
    public ResponseEntity<?> getOrdersByUser(@PathVariable Long nguoiDungId) {
        return ResponseEntity.ok(orderService.getOrdersByUser(nguoiDungId));
    }

    /**
     * Endpoint cho Kênh Người Bán / Chủ Cửa Hàng - Chỉ lấy đơn hàng thuộc Shop của mình
     */
    @GetMapping("/store/{cuaHangId}")
    public ResponseEntity<?> getOrdersByStore(@PathVariable Long cuaHangId) {
        return ResponseEntity.ok(orderService.getOrdersByStore(cuaHangId));
    }

    /**
     * Endpoint tra cứu toàn bộ đơn hàng con thuộc một phiên checkout gộp
     */
    @GetMapping("/checkout-session/{maGiaoDichGoc}")
    public ResponseEntity<?> getOrdersByCheckoutSession(@PathVariable String maGiaoDichGoc) {
        return ResponseEntity.ok(orderService.getOrdersByCheckoutSession(maGiaoDichGoc));
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

    @PutMapping("/{id}/shipping-status")
    public ResponseEntity<?> updateShippingStatus(
            @PathVariable Long id,
            @RequestParam String shippingStatus,
            @RequestParam(required = false) String donViVanChuyen
    ) {
        try {
            return ResponseEntity.ok(orderService.updateShippingStatus(id, shippingStatus, donViVanChuyen));
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

    @PutMapping("/checkout-session/{maGiaoDichGoc}/payment-status")
    public ResponseEntity<?> updatePaymentStatusForSession(
            @PathVariable String maGiaoDichGoc,
            @RequestParam String paymentStatus
    ) {
        try {
            orderService.updatePaymentStatusForCheckoutSession(maGiaoDichGoc, paymentStatus);
            return ResponseEntity.ok("Cập nhật trạng thái thanh toán thành công cho phiên " + maGiaoDichGoc);
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
