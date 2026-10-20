package com.ctut.wms.wmscoreservice.controller.shipping;

import com.ctut.wms.wmscoreservice.entity.shipping.ShippingProvider;
import com.ctut.wms.wmscoreservice.repository.shipping.ShippingProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/shippers", "/shipping-providers"})
@RequiredArgsConstructor
public class ShippingProviderController {

    private final ShippingProviderRepository shippingProviderRepository;

    @GetMapping
    public ResponseEntity<List<ShippingProvider>> getAllShippers() {
        return ResponseEntity.ok(shippingProviderRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getShipperById(@PathVariable Long id) {
        return shippingProviderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ShippingProvider> createShipper(@RequestBody ShippingProvider shipper) {
        return ResponseEntity.ok(shippingProviderRepository.save(shipper));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateShipper(@PathVariable Long id, @RequestBody ShippingProvider shipper) {
        if (!shippingProviderRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        shipper.setId(id);
        return ResponseEntity.ok(shippingProviderRepository.save(shipper));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteShipper(@PathVariable Long id) {
        if (!shippingProviderRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        shippingProviderRepository.deleteById(id);
        return ResponseEntity.ok("Đã xóa đơn vị vận chuyển!");
    }
}

