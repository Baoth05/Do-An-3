/**
 * ==============================================================================
 * DTO (Data Transfer Object): MomoIpnRequest
 * Phân hệ: Payment Service (Cổng thanh toán MoMo VietQR & Web3 Crypto - Port 8085)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API MomoIpnRequest.
 * ==============================================================================
 */
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
public class MomoIpnRequest {
    private String partnerCode;
    private String orderId;
    private String requestId;
    private BigDecimal amount;
    private String orderInfo;
    private String orderType;
    private Long transId;
    private Integer resultCode; // 0 là thành công
    private String message;
    private String payType;
    private Long responseTime;
    private String extraData;
    private String signature;
}
