package com.ctut.wms.paymentservice.dto;

import lombok.Data;

@Data
public class MomoIpnRequest {
    private String orderId;
    private Long transId;
    private Integer resultCode;  // 0 là thành công
}