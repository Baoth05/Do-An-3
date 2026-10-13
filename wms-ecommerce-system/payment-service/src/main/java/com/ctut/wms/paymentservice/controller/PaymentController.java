package com.ctut.wms.paymentservice.controller;

import com.ctut.wms.paymentservice.dto.MomoIpnRequest;
import com.ctut.wms.paymentservice.dto.PaymentRequest;
import com.ctut.wms.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create")
    public ResponseEntity<String> createPayment(@RequestBody PaymentRequest request) {
        return ResponseEntity.ok(paymentService.createPayment(request));
    }

    @PostMapping("/momo-ipn")
    public ResponseEntity<String> handleMomoIpn(@RequestBody MomoIpnRequest ipnRequest) {
        return ResponseEntity.ok(paymentService.processIpn(ipnRequest));
    }
}