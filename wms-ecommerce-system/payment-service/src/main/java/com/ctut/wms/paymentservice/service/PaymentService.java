/**
 * ==============================================================================
 * Service: PaymentService
 * Phân hệ: Payment Service (Cổng thanh toán MoMo VietQR & Web3 Crypto - Port 8085)
 * Mô tả: Cung cấp logic nghiệp vụ, giao dịch cơ sở dữ liệu và xử lý dữ liệu cho PaymentService.
 * ==============================================================================
 */
package com.ctut.wms.paymentservice.service;

import com.ctut.wms.paymentservice.client.OrderClient;
import com.ctut.wms.paymentservice.config.MomoConfig;
import com.ctut.wms.paymentservice.config.MomoSecurity;
import com.ctut.wms.paymentservice.dto.MomoIpnRequest;
import com.ctut.wms.paymentservice.dto.PaymentRequest;
import com.ctut.wms.paymentservice.dto.PaymentResponse;
import com.ctut.wms.paymentservice.entity.GiaoDichMoMo;
import com.ctut.wms.paymentservice.repository.GiaoDichMoMoRepository;
import com.ctut.wms.paymentservice.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final GiaoDichMoMoRepository repository;
    private final RestTemplate restTemplate;
    private final MomoConfig momoConfig;
    private final OrderClient orderClient;

    private static final Set<String> PAID_STATUSES = Set.of("ĐÃ THANH TOÁN", "PAID", "SUCCESS");

    /**
     * Khởi tạo giao dịch thanh toán MoMo (Tự động kết nối Cổng MoMo V2 và tạo mã QR nhận tiền)
     */
    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        String targetIdentifier = (request.getMaGiaoDichGoc() != null && !request.getMaGiaoDichGoc().isBlank())
                ? request.getMaGiaoDichGoc()
                : request.getDonHangId();
        if (targetIdentifier == null || targetIdentifier.isBlank()) {
            throw new IllegalArgumentException("Thiếu mã đơn hàng hoặc mã phiên thanh toán!");
        }

        // Số tiền LUÔN lấy từ order-service (không tin số tiền client gửi lên)
        BigDecimal soTien = calculateAmountDue(request.getDonHangId(), request.getMaGiaoDichGoc());
        long amount = soTien.longValue();

        String momoOrderId = "MOMO" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String requestId = String.valueOf(System.currentTimeMillis());
        String orderInfo = "Thanh toan don hang " + targetIdentifier;
        // Không nhận redirectUrl từ client (chống chuyển hướng tới trang lừa đảo)
        String redirectUrl = momoConfig.getRedirectUrl();
        String extraData = "";

        // 1. Tạo chữ ký số HMAC-SHA256 chuẩn MoMo V2 API
        String rawSignature = "accessKey=" + momoConfig.getAccessKey()
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + momoConfig.getIpnUrl()
                + "&orderId=" + momoOrderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + momoConfig.getPartnerCode()
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=captureWallet";

        String signature = MomoSecurity.signHmacSHA256(rawSignature, momoConfig.getSecretKey());

        // 2. Chuẩn bị Request Body gửi lên MoMo Gateway
        Map<String, Object> momoRequestBody = new LinkedHashMap<>();
        momoRequestBody.put("partnerCode", momoConfig.getPartnerCode());
        momoRequestBody.put("partnerName", momoConfig.getAccountName());
        momoRequestBody.put("storeId", momoConfig.getPartnerCode());
        momoRequestBody.put("requestId", requestId);
        momoRequestBody.put("amount", amount);
        momoRequestBody.put("orderId", momoOrderId);
        momoRequestBody.put("orderInfo", orderInfo);
        momoRequestBody.put("redirectUrl", redirectUrl);
        momoRequestBody.put("ipnUrl", momoConfig.getIpnUrl());
        momoRequestBody.put("lang", "vi");
        momoRequestBody.put("extraData", extraData);
        momoRequestBody.put("requestType", "captureWallet");
        momoRequestBody.put("signature", signature);

        // 3. Gọi trực tiếp API MoMo Gateway
        String payUrl = null;
        String qrCodeUrl = null;
        String deeplink = null;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(momoRequestBody, headers);

            log.info("Đang kết nối tới MoMo API Gateway: {}", momoConfig.getApiUrl());
            ResponseEntity<Map> response = restTemplate.postForEntity(momoConfig.getApiUrl(), entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                Object resultCode = body.get("resultCode");
                if (resultCode != null && (resultCode.toString().equals("0") || resultCode.toString().equals("9000"))) {
                    payUrl = (String) body.get("payUrl");
                    qrCodeUrl = (String) body.get("qrCodeUrl");
                    deeplink = (String) body.get("deeplink");
                    log.info("Kết nối MoMo API Gateway thành công! PayUrl: {}", payUrl);
                } else {
                    log.warn("MoMo Gateway phản hồi mã: {} - {}", resultCode, body.get("message"));
                }
            }
        } catch (Exception e) {
            log.warn("Cảnh báo: Không thể gọi trực tiếp MoMo Gateway: {}. Hệ thống tự động chuyển sang chế độ quét QR MoMo trực tiếp (VietQR).", e.getMessage());
        }

        // 4. Fallback: Sinh link chuyển tiền và QR Code trực tiếp vào Số Điện Thoại MoMo
        if (payUrl == null || payUrl.isEmpty()) {
            payUrl = "https://me.momo.vn/" + momoConfig.getAccountNumber();
        }
        if (qrCodeUrl == null || qrCodeUrl.isEmpty()) {
            try {
                String encodedInfo = URLEncoder.encode(orderInfo, StandardCharsets.UTF_8);
                String encodedName = URLEncoder.encode(momoConfig.getAccountName(), StandardCharsets.UTF_8);
                qrCodeUrl = "https://api.vietqr.io/image/970422-" + momoConfig.getAccountNumber() + "-compact2.jpg?amount=" + amount + "&addInfo=" + encodedInfo + "&accountName=" + encodedName;
            } catch (Exception e) {
                qrCodeUrl = "https://api.vietqr.io/image/970422-" + momoConfig.getAccountNumber() + "-compact2.jpg?amount=" + amount;
            }
        }
        if (deeplink == null || deeplink.isEmpty()) {
            deeplink = "momo://?action=payWithApp&isScanQR=true";
        }

        // 5. Lưu thông tin giao dịch vào Cơ Sở Dữ Liệu
        GiaoDichMoMo giaoDich = new GiaoDichMoMo();
        giaoDich.setDonHangId(targetIdentifier);
        giaoDich.setMaGiaoDichGoc(request.getMaGiaoDichGoc());
        giaoDich.setMomoOrderId(momoOrderId);
        giaoDich.setMomoRequestId(requestId);
        giaoDich.setSoTien(soTien);
        giaoDich.setThongTinDonHang(orderInfo);
        giaoDich.setPayUrl(payUrl);
        giaoDich.setQrCodeUrl(qrCodeUrl);
        giaoDich.setDeeplink(deeplink);
        giaoDich.setSoDienThoaiNhanTien(momoConfig.getAccountNumber());
        giaoDich.setTenNguoiNhan(momoConfig.getAccountName());
        giaoDich.setTrangThai("PENDING");

        repository.save(giaoDich);

        return PaymentResponse.builder()
                .paymentUrl(payUrl)
                .qrCodeUrl(qrCodeUrl)
                .deeplink(deeplink)
                .momoOrderId(momoOrderId)
                .donHangId(giaoDich.getDonHangId())
                .maGiaoDichGoc(giaoDich.getMaGiaoDichGoc())
                .soTien(soTien)
                .trangThai("PENDING")
                .message("Khởi tạo liên kết và mã QR thanh toán MoMo thành công!")
                .accountNumber(momoConfig.getAccountNumber())
                .accountName(momoConfig.getAccountName())
                .transferContent(orderInfo)
                .build();
    }

    /**
     * Xử lý IPN từ MoMo Webhook (với kiểm tra chữ ký số HMAC, chống gian lận & Idempotency)
     */
    @Transactional
    public String processIpn(MomoIpnRequest ipnRequest) {
        log.info("Nhận IPN từ MoMo Webhook cho đơn hàng MoMo: {}", ipnRequest.getOrderId());

        GiaoDichMoMo giaoDich = repository.findByMomoOrderId(ipnRequest.getOrderId())
                .orElseThrow(() -> new RuntimeException("Lỗ hổng: Không tìm thấy giao dịch tương ứng với orderId: " + ipnRequest.getOrderId()));

        if ("SUCCESS".equalsIgnoreCase(giaoDich.getTrangThai())) {
            log.info("Giao dịch {} đã được ghi nhận thành công trước đó, bỏ qua lặp lại.", ipnRequest.getOrderId());
            return "SUCCESS_ALREADY_PROCESSED";
        }

        // Bắt buộc có chữ ký hợp lệ: IPN không có chữ ký bị coi là giả mạo
        if (ipnRequest.getSignature() == null || ipnRequest.getSignature().isBlank()
                || ipnRequest.getAmount() == null
                || !momoConfig.getPartnerCode().equals(ipnRequest.getPartnerCode())) {
            log.error("CẢNH BÁO BẢO MẬT: IPN thiếu chữ ký / sai partnerCode! OrderId: {}", ipnRequest.getOrderId());
            throw new RuntimeException("IPN không hợp lệ!");
        }
        {
            String rawSignature = "accessKey=" + momoConfig.getAccessKey()
                    + "&amount=" + ipnRequest.getAmount().longValue()
                    + "&extraData=" + (ipnRequest.getExtraData() != null ? ipnRequest.getExtraData() : "")
                    + "&message=" + ipnRequest.getMessage()
                    + "&orderId=" + ipnRequest.getOrderId()
                    + "&orderInfo=" + ipnRequest.getOrderInfo()
                    + "&orderType=" + ipnRequest.getOrderType()
                    + "&partnerCode=" + ipnRequest.getPartnerCode()
                    + "&payType=" + ipnRequest.getPayType()
                    + "&requestId=" + ipnRequest.getRequestId()
                    + "&responseTime=" + ipnRequest.getResponseTime()
                    + "&resultCode=" + ipnRequest.getResultCode()
                    + "&transId=" + ipnRequest.getTransId();

            boolean isValidSignature = MomoSecurity.verifySignature(rawSignature, momoConfig.getSecretKey(), ipnRequest.getSignature());
            if (!isValidSignature) {
                log.error("CẢNH BÁO BẢO MẬT: Chữ ký IPN không hợp lệ từ MoMo! OrderId: {}", ipnRequest.getOrderId());
                giaoDich.setTrangThai("INVALID_SIGNATURE");
                repository.save(giaoDich);
                throw new RuntimeException("Chữ ký IPN bảo mật không khớp!");
            }
        }

        if (ipnRequest.getAmount().compareTo(giaoDich.getSoTien()) != 0) {
            log.error("CẢNH BÁO BẢO MẬT: Gian lận số tiền! DB yêu cầu: {}, MoMo báo về: {}", giaoDich.getSoTien(), ipnRequest.getAmount());
            giaoDich.setTrangThai("AMOUNT_MISMATCH");
            repository.save(giaoDich);
            throw new RuntimeException("Lỗi bảo mật: Số tiền thanh toán không khớp với hóa đơn!");
        }

        giaoDich.setMomoTransId(ipnRequest.getTransId());

        if (ipnRequest.getResultCode() != null && ipnRequest.getResultCode() == 0) {
            giaoDich.setTrangThai("SUCCESS");
            repository.save(giaoDich);
            syncOrderStatus(giaoDich.getDonHangId(), "ĐÃ THANH TOÁN");
            log.info("Tiền đã vào tài khoản MoMo! Đã đồng bộ đơn hàng {} sang trạng thái ĐÃ THANH TOÁN", giaoDich.getDonHangId());
        } else {
            giaoDich.setTrangThai("FAILED");
            repository.save(giaoDich);
            syncOrderStatus(giaoDich.getDonHangId(), "THANH TOÁN THẤT BẠI");
        }

        return "Processed IPN";
    }

    @Transactional
    public PaymentResponse confirmManualPayment(String donHangId, Long transId, String ghiChu) {
        CurrentUser.requireAdmin();
        GiaoDichMoMo giaoDich = repository.findFirstByDonHangIdOrderByIdDesc(donHangId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch cho mã đơn hàng: " + donHangId));

        giaoDich.setMomoTransId(transId != null ? transId : System.currentTimeMillis());
        giaoDich.setTrangThai("SUCCESS");
        if (ghiChu != null && !ghiChu.isBlank()) {
            giaoDich.setThongTinDonHang(giaoDich.getThongTinDonHang() + " [Ghi chú: " + ghiChu + "]");
        }
        repository.save(giaoDich);

        syncOrderStatus(giaoDich.getDonHangId(), "ĐÃ THANH TOÁN");
        log.info("Xác nhận đã nhận tiền MoMo cho đơn hàng {}. Đã chuyển đơn sang ĐÃ THANH TOÁN.", donHangId);

        return PaymentResponse.builder()
                .paymentUrl(giaoDich.getPayUrl())
                .qrCodeUrl(giaoDich.getQrCodeUrl())
                .momoOrderId(giaoDich.getMomoOrderId())
                .donHangId(giaoDich.getDonHangId())
                .maGiaoDichGoc(giaoDich.getMaGiaoDichGoc())
                .soTien(giaoDich.getSoTien())
                .trangThai("SUCCESS")
                .message("Đã xác nhận tiền vào tài khoản MoMo và hoàn tất đơn hàng!")
                .accountNumber(giaoDich.getSoDienThoaiNhanTien())
                .accountName(giaoDich.getTenNguoiNhan())
                .build();
    }


    public GiaoDichMoMo getPaymentStatus(String donHangId) {
        // Chỉ chủ đơn hàng (hoặc Admin) được xem trạng thái thanh toán
        if (!CurrentUser.isAdmin()) {
            List<OrderClient.OrderSummary> orders = orderClient.findOrders(donHangId, null);
            if (orders.isEmpty()) {
                throw new RuntimeException("Không tìm thấy đơn hàng: " + donHangId);
            }
            orders.forEach(o -> CurrentUser.requireSelfOrAdmin(o.getNguoiDungId()));
        }
        return repository.findFirstByDonHangIdOrderByIdDesc(donHangId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch cho đơn hàng: " + donHangId));
    }

    /**
     * Tính số tiền phải trả dựa trên dữ liệu đơn hàng thật ở order-service.
     * Đồng thời kiểm tra đơn thuộc về người đang thanh toán và chưa được thanh toán / chưa bị hủy.
     */
    private BigDecimal calculateAmountDue(String donHangId, String maGiaoDichGoc) {
        List<OrderClient.OrderSummary> orders = orderClient.findOrders(donHangId, maGiaoDichGoc);
        if (orders.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy đơn hàng cần thanh toán!");
        }
        BigDecimal total = BigDecimal.ZERO;
        for (OrderClient.OrderSummary o : orders) {
            CurrentUser.requireSelfOrAdmin(o.getNguoiDungId());
            if (o.getTrangThaiThanhToan() != null && PAID_STATUSES.contains(o.getTrangThaiThanhToan().toUpperCase())) {
                throw new IllegalArgumentException("Đơn hàng " + o.getMaDonHang() + " đã được thanh toán!");
            }
            if (o.getTrangThaiDonHang() != null && o.getTrangThaiDonHang().toUpperCase().startsWith("CANCELLED")) {
                throw new IllegalArgumentException("Đơn hàng " + o.getMaDonHang() + " đã bị hủy (có thể do quá hạn thanh toán)!");
            }
            if (o.getTongThanhToan() != null) {
                total = total.add(o.getTongThanhToan());
            }
        }
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0!");
        }
        return total;
    }

    private void syncOrderStatus(String maDonHang, String paymentStatus) {
        orderClient.syncPaymentStatus(maDonHang, paymentStatus);
    }
}
