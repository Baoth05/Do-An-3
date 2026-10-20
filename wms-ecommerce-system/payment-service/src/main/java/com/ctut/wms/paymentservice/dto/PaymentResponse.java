package com.ctut.wms.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private String paymentUrl;
    private String momoOrderId;
    private String donHangId;
    private BigDecimal soTien;
    private String trangThai;
    private String message;
}

