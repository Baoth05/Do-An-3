/**
 * ==============================================================================
 * Cấu Hình (Configuration): MomoSecurity
 * Phân hệ: Payment Service (Cổng thanh toán MoMo VietQR & Web3 Crypto - Port 8085)
 * Mô tả: Lớp cấu hình hệ thống, bảo mật hoặc thiết lập các Spring Bean cho Payment Service (Cổng thanh toán MoMo VietQR & Web3 Crypto - Port 8085).
 * ==============================================================================
 */
package com.ctut.wms.paymentservice.config;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

public class MomoSecurity {

    private static final String HMAC_SHA256 = "HmacSHA256";

    /**
     * Tạo chữ ký số HMAC-SHA256 theo chuẩn bảo mật của Cổng thanh toán MoMo
     */
    public static String signHmacSHA256(String data, String secretKey) {
        try {
            Mac hmacSHA256 = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            hmacSHA256.init(secretKeySpec);
            byte[] bytes = hmacSHA256.doFinal(data.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hash = new StringBuilder();
            for (byte b : bytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hash.append('0');
                }
                hash.append(hex);
            }
            return hash.toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi mã hóa chữ ký HMAC-SHA256: " + e.getMessage(), e);
        }
    }

    /**
     * Kiểm tra tính hợp lệ của chữ ký trả về từ MoMo IPN
     */
    public static boolean verifySignature(String rawData, String secretKey, String expectedSignature) {
        if (expectedSignature == null || expectedSignature.isEmpty()) {
            return false;
        }
        String calculatedSignature = signHmacSHA256(rawData, secretKey);
        return calculatedSignature.equalsIgnoreCase(expectedSignature);
    }
}
