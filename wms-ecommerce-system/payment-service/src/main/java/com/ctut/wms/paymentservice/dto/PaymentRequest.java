package com.ctut.wms.paymentservice.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PaymentRequest {
    private String donHangId;
    private BigDecimal soTien;
}