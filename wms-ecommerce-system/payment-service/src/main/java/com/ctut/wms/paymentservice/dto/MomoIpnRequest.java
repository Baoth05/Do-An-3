package com.ctut.wms.paymentservice.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class MomoIpnRequest {
    private String orderId;
    private Long transId;
    private Integer resultCode;  // 0 là thành công
    private BigDecimal amount;   // Số tiền MoMo báo về để đối soát
    private String message;
}