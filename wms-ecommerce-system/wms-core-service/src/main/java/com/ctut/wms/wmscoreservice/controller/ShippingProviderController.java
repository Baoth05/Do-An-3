package com.ctut.wms.wmscoreservice.controller;

import com.ctut.wms.wmscoreservice.entity.ShippingProvider;
import com.ctut.wms.wmscoreservice.repository.ShippingProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/shippers", "/shipping-providers"})
@RequiredArgsConstructor
public class ShippingProviderController {

    private final ShippingProviderRepository shippingProviderRepository; // Tương tác dữ liệu đơn vị vận chuyển

    // API lấy danh sách các đơn vị vận chuyển liên kết (GHN, GHTK, ViettelPost)
    @GetMapping
    public ResponseEntity<List<ShippingProvider>> getAllShippers() {
        return ResponseEntity.ok(shippingProviderRepository.findAll());
    }

    // API lấy chi tiết một đơn vị vận chuyển theo ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getShipperById(@PathVariable Long id) {
        return shippingProviderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // API đăng ký thêm đơn vị vận chuyển mới
    @PostMapping
    public ResponseEntity<ShippingProvider> createShipper(@RequestBody ShippingProvider shipper) {
        return ResponseEntity.ok(shippingProviderRepository.save(shipper));
    }

    // API cập nhật thông tin đơn vị vận chuyển
    @PutMapping("/{id}")
    public ResponseEntity<?> updateShipper(@PathVariable Long id, @RequestBody ShippingProvider shipper) {
        if (!shippingProviderRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        shipper.setId(id);
        return ResponseEntity.ok(shippingProviderRepository.save(shipper));
    }

    // API xóa đơn vị vận chuyển
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteShipper(@PathVariable Long id) {
        if (!shippingProviderRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        shippingProviderRepository.deleteById(id);
        return ResponseEntity.ok("Đã xóa đơn vị vận chuyển!");
    }
}
