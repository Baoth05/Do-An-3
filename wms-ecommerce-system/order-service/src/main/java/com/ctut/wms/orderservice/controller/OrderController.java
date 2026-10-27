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

    private final OrderService orderService; // Dùng Service thay vì Repository

    // API đặt đơn hàng đơn lẻ (Dành cho mua trực tiếp 1 shop)
    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequest request) {
        try {
            return ResponseEntity.ok(orderService.placeOrder(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API thanh toán giỏ hàng đa shop (Tự động tách đơn hàng Order Splitting theo từng Cửa Hàng)
    @PostMapping("/checkout-multishop")
    public ResponseEntity<?> checkoutMultiShop(@RequestBody MultiShopCheckoutRequest request) {
        try {
            return ResponseEntity.ok(orderService.checkoutMultiShop(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API lấy lịch sử đơn hàng của một người dùng / khách hàng
    @GetMapping("/user/{nguoiDungId}")
    public ResponseEntity<?> getOrdersByUser(@PathVariable Long nguoiDungId) {
        return ResponseEntity.ok(orderService.getOrdersByUser(nguoiDungId));
    }

    // API lấy danh sách đơn hàng thuộc quyền quản lý của một Gian hàng (Kênh Người Bán)
    @GetMapping("/store/{cuaHangId}")
    public ResponseEntity<?> getOrdersByStore(@PathVariable Long cuaHangId) {
        return ResponseEntity.ok(orderService.getOrdersByStore(cuaHangId));
    }

    // API tra cứu toàn bộ đơn hàng con thuộc một phiên checkout gộp (Theo maGiaoDichGoc)
    @GetMapping("/checkout-session/{maGiaoDichGoc}")
    public ResponseEntity<?> getOrdersByCheckoutSession(@PathVariable String maGiaoDichGoc) {
        return ResponseEntity.ok(orderService.getOrdersByCheckoutSession(maGiaoDichGoc));
    }

    // API tra cứu thông tin chi tiết một đơn hàng theo Mã Đơn Hàng (DH-XXXX)
    @GetMapping("/{maDonHang}")
    public ResponseEntity<?> getOrderByMaDonHang(@PathVariable String maDonHang) {
        try {
            return ResponseEntity.ok(orderService.getOrderByMaDonHang(maDonHang));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // API lấy danh sách toàn bộ đơn hàng trong hệ thống (Dành cho Quản trị viên)
    @GetMapping
    public ResponseEntity<?> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    // API cập nhật trạng thái đơn hàng (CONFIRMED, CANCELLED, COMPLETED)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API cập nhật trạng thái giao hàng và đơn vị vận chuyển (GHTK, GHN, ViettelPost)
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

    // API cập nhật trạng thái thanh toán đơn lẻ (PAID, UNPAID, REFUNDED)
    @PutMapping("/{maDonHang}/payment-status")
    public ResponseEntity<?> updatePaymentStatus(@PathVariable String maDonHang, @RequestParam String paymentStatus) {
        try {
            return ResponseEntity.ok(orderService.updatePaymentStatus(maDonHang, paymentStatus));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API cập nhật trạng thái thanh toán đồng loạt cho cả phiên gộp đa shop khi MoMo/Crypto báo thành công
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

    // API hủy đơn hàng theo ID
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(orderService.cancelOrder(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
