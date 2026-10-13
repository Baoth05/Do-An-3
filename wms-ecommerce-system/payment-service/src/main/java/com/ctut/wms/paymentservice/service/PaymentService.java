package com.ctut.wms.paymentservice.service;

import com.ctut.wms.paymentservice.dto.MomoIpnRequest;
import com.ctut.wms.paymentservice.dto.PaymentRequest;
import com.ctut.wms.paymentservice.entity.GiaoDichMoMo;
import com.ctut.wms.paymentservice.repository.GiaoDichMoMoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final GiaoDichMoMoRepository repository;

    public String createPayment(PaymentRequest request) {
        String momoOrderId = "MOMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        GiaoDichMoMo giaoDich = new GiaoDichMoMo();
        giaoDich.setDonHangId(request.getDonHangId());
        giaoDich.setMomoOrderId(momoOrderId);
        giaoDich.setSoTien(request.getSoTien());

        repository.save(giaoDich);

        return "https://test-payment.momo.vn/pay?orderId=" + momoOrderId + "&amount=" + request.getSoTien();
    }

    public String processIpn(MomoIpnRequest ipnRequest) {
        GiaoDichMoMo giaoDich = repository.findByMomoOrderId(ipnRequest.getOrderId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch!"));

        giaoDich.setMomoTransId(ipnRequest.getTransId());

        if (ipnRequest.getResultCode() == 0) {
            giaoDich.setTrangThai("SUCCESS");
        } else {
            giaoDich.setTrangThai("FAILED");
        }

        repository.save(giaoDich);
        return "Processed IPN";
    }
}