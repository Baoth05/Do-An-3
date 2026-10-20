package com.ctut.wms.paymentservice.config;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Data
public class MomoConfig {

    @Value("${momo.partner-code:MOMOBKUN20180529}")
    private String partnerCode;

    @Value("${momo.access-key:klm05TvNBzhg7h7j}")
    private String accessKey;

    @Value("${momo.secret-key:at67qH6mk8w5Y1nAyMoYKMWACiEi2Aca}")
    private String secretKey;

    @Value("${momo.api-url:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String apiUrl;

    @Value("${momo.redirect-url:http://localhost:3000/payment-result}")
    private String redirectUrl;

    @Value("${momo.ipn-url:http://localhost:8080/payments/momo-ipn}")
    private String ipnUrl;

    // Thông tin tài khoản MoMo thực tế để nhận tiền (Số điện thoại ví MoMo)
    @Value("${momo.account-number:0901234567}")
    private String accountNumber;

    // Tên chủ tài khoản MoMo nhận tiền
    @Value("${momo.account-name:CTUT WMS STORE}")
    private String accountName;
}
