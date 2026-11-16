package com.ctut.wms.paymentservice.service;

import com.ctut.wms.paymentservice.client.OrderClient;
import com.ctut.wms.paymentservice.client.OrderClient.OrderSummary;
import com.ctut.wms.paymentservice.config.MomoConfig;
import com.ctut.wms.paymentservice.config.MomoSecurity;
import com.ctut.wms.paymentservice.dto.CryptoPaymentRequest;
import com.ctut.wms.paymentservice.dto.MomoIpnRequest;
import com.ctut.wms.paymentservice.dto.PaymentRequest;
import com.ctut.wms.paymentservice.dto.PaymentResponse;
import com.ctut.wms.paymentservice.entity.GiaoDichCrypto;
import com.ctut.wms.paymentservice.entity.GiaoDichMoMo;
import com.ctut.wms.paymentservice.repository.GiaoDichCryptoRepository;
import com.ctut.wms.paymentservice.repository.GiaoDichMoMoRepository;
import com.ctut.wms.paymentservice.security.ForbiddenException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Thanh toán: số tiền do server tính, IPN bắt buộc chữ ký hợp lệ, Crypto chờ Admin xác minh. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PaymentServiceTest {

    @Mock GiaoDichMoMoRepository momoRepository;
    @Mock GiaoDichCryptoRepository cryptoRepository;
    @Mock RestTemplate restTemplate;
    @Mock OrderClient orderClient;
    MomoConfig momoConfig;
    PaymentService paymentService;
    CryptoPaymentService cryptoService;

    static final String SESSION = "CHECKOUT-AB12CD34";
    static final String TX = "0x" + "a".repeat(64);

    @BeforeEach
    void setUp() {
        momoConfig = new MomoConfig();
        momoConfig.setPartnerCode("MOMOTEST");
        momoConfig.setAccessKey("access");
        momoConfig.setSecretKey("secret-key");
        momoConfig.setApiUrl("https://momo.invalid/create");
        momoConfig.setRedirectUrl("http://localhost:5173/payment-result");
        momoConfig.setIpnUrl("http://localhost:8080/payments/momo-ipn");
        momoConfig.setAccountNumber("0900000000");
        momoConfig.setAccountName("CTUT");
        paymentService = new PaymentService(momoRepository, restTemplate, momoConfig, orderClient);
        cryptoService = new CryptoPaymentService(cryptoRepository, orderClient);

        // Cổng MoMo không truy cập được trong test => dùng QR dự phòng
        when(restTemplate.postForEntity(anyString(), any(), eq(java.util.Map.class)))
                .thenThrow(new RestClientException("offline"));
        when(momoRepository.save(any(GiaoDichMoMo.class))).thenAnswer(i -> i.getArgument(0));
        when(cryptoRepository.save(any(GiaoDichCrypto.class))).thenAnswer(i -> i.getArgument(0));
        when(cryptoRepository.findByTxHash(anyString())).thenReturn(Optional.empty());
        as("CUSTOMER", 5L);
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    private static void as(String role, Long id) {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("X-User-Role", role);
        if (id != null) req.addHeader("X-User-Id", String.valueOf(id));
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req));
    }

    private static OrderSummary order(String code, long buyer, long amount, String orderStatus, String payStatus) {
        OrderSummary o = new OrderSummary();
        o.setMaDonHang(code);
        o.setNguoiDungId(buyer);
        o.setTongThanhToan(BigDecimal.valueOf(amount));
        o.setTrangThaiDonHang(orderStatus);
        o.setTrangThaiThanhToan(payStatus);
        return o;
    }

    private PaymentRequest payFor(String session, long clientAmount) {
        PaymentRequest r = new PaymentRequest();
        r.setMaGiaoDichGoc(session);
        r.setSoTien(BigDecimal.valueOf(clientAmount));
        r.setRedirectUrl("https://trang-lua-dao.example");
        return r;
    }

    private MomoIpnRequest ipn(String momoOrderId, long amount, int resultCode, boolean sign) {
        MomoIpnRequest r = MomoIpnRequest.builder()
                .partnerCode("MOMOTEST").orderId(momoOrderId).requestId("1").amount(BigDecimal.valueOf(amount))
                .orderInfo("info").orderType("momo_wallet").transId(123L).resultCode(resultCode)
                .message("ok").payType("qr").responseTime(1L).extraData("").build();
        if (sign) {
            String raw = "accessKey=access&amount=" + amount + "&extraData=&message=ok&orderId=" + momoOrderId
                    + "&orderInfo=info&orderType=momo_wallet&partnerCode=MOMOTEST&payType=qr&requestId=1"
                    + "&responseTime=1&resultCode=" + resultCode + "&transId=123";
            r.setSignature(MomoSecurity.signHmacSHA256(raw, "secret-key"));
        }
        return r;
    }

    private GiaoDichMoMo pendingTx(String momoOrderId, long amount) {
        GiaoDichMoMo tx = new GiaoDichMoMo();
        tx.setMomoOrderId(momoOrderId);
        tx.setDonHangId(SESSION);
        tx.setSoTien(BigDecimal.valueOf(amount));
        tx.setTrangThai("PENDING");
        when(momoRepository.findByMomoOrderId(momoOrderId)).thenReturn(Optional.of(tx));
        return tx;
    }

    // ===================== TẠO THANH TOÁN =====================

    @Test
    @DisplayName("Số tiền MoMo = tổng tiền các đơn thật, bỏ qua số tiền & redirectUrl client gửi")
    void amountComesFromOrders() {
        when(orderClient.findOrders(null, SESSION)).thenReturn(List.of(
                order("DH-1", 5, 1_000_000, "PENDING", "UNPAID"),
                order("DH-2", 5, 500_000, "PENDING", "UNPAID")));

        PaymentResponse res = paymentService.createPayment(payFor(SESSION, 1_000));

        assertThat(res.getSoTien()).isEqualByComparingTo(BigDecimal.valueOf(1_500_000));
        verify(momoRepository).save(argThat(tx -> tx.getSoTien().compareTo(BigDecimal.valueOf(1_500_000)) == 0));
        assertThat(res.getQrCodeUrl()).contains("amount=1500000");
    }

    @Test
    @DisplayName("Không tạo thanh toán cho đơn của người khác")
    void cannotPayForOthers() {
        when(orderClient.findOrders(null, SESSION)).thenReturn(List.of(order("DH-1", 99, 1_000_000, "PENDING", "UNPAID")));
        assertThatThrownBy(() -> paymentService.createPayment(payFor(SESSION, 1))).isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("Không thanh toán lại đơn đã thanh toán / đã bị hủy")
    void cannotPayPaidOrCancelled() {
        when(orderClient.findOrders(null, SESSION)).thenReturn(List.of(order("DH-1", 5, 1_000_000, "CONFIRMED", "PAID")));
        assertThatThrownBy(() -> paymentService.createPayment(payFor(SESSION, 1))).hasMessageContaining("đã được thanh toán");

        when(orderClient.findOrders(null, SESSION)).thenReturn(List.of(order("DH-1", 5, 1_000_000, "CANCELLED_PAYMENT_FAILED", "UNPAID")));
        assertThatThrownBy(() -> paymentService.createPayment(payFor(SESSION, 1))).hasMessageContaining("bị hủy");
    }

    // ===================== IPN MOMO =====================

    @Test
    @DisplayName("IPN không có chữ ký bị từ chối, đơn KHÔNG được đánh dấu đã thanh toán")
    void ipnWithoutSignatureRejected() {
        pendingTx("MOMO1", 1_500_000);
        assertThatThrownBy(() -> paymentService.processIpn(ipn("MOMO1", 1_500_000, 0, false)))
                .hasMessageContaining("không hợp lệ");
        verify(orderClient, never()).syncPaymentStatus(any(), any());
    }

    @Test
    @DisplayName("IPN chữ ký sai bị từ chối")
    void ipnWithBadSignatureRejected() {
        pendingTx("MOMO1", 1_500_000);
        MomoIpnRequest forged = ipn("MOMO1", 1_500_000, 0, false);
        forged.setSignature("deadbeef");
        assertThatThrownBy(() -> paymentService.processIpn(forged)).hasMessageContaining("Chữ ký");
        verify(orderClient, never()).syncPaymentStatus(any(), any());
    }

    @Test
    @DisplayName("IPN hợp lệ: giao dịch SUCCESS và đồng bộ đơn sang ĐÃ THANH TOÁN; gửi lặp không xử lý 2 lần")
    void validIpnMarksPaidOnce() {
        GiaoDichMoMo tx = pendingTx("MOMO1", 1_500_000);
        paymentService.processIpn(ipn("MOMO1", 1_500_000, 0, true));
        assertThat(tx.getTrangThai()).isEqualTo("SUCCESS");
        verify(orderClient).syncPaymentStatus(SESSION, "ĐÃ THANH TOÁN");

        assertThat(paymentService.processIpn(ipn("MOMO1", 1_500_000, 0, true))).isEqualTo("SUCCESS_ALREADY_PROCESSED");
        verify(orderClient, times(1)).syncPaymentStatus(any(), any());
    }

    @Test
    @DisplayName("IPN báo số tiền khác hóa đơn bị từ chối")
    void ipnAmountMismatchRejected() {
        pendingTx("MOMO1", 1_500_000);
        assertThatThrownBy(() -> paymentService.processIpn(ipn("MOMO1", 1_000, 0, true)))
                .hasMessageContaining("không khớp");
        verify(orderClient, never()).syncPaymentStatus(any(), any());
    }

    @Test
    @DisplayName("IPN thất bại: đồng bộ THANH TOÁN THẤT BẠI để order-service rollback đơn")
    void failedIpnTriggersRollback() {
        GiaoDichMoMo tx = pendingTx("MOMO1", 1_500_000);
        paymentService.processIpn(ipn("MOMO1", 1_500_000, 1006, true));
        assertThat(tx.getTrangThai()).isEqualTo("FAILED");
        verify(orderClient).syncPaymentStatus(SESSION, "THANH TOÁN THẤT BẠI");
    }

    // ===================== CRYPTO =====================

    private CryptoPaymentRequest crypto(String txHash) {
        CryptoPaymentRequest r = new CryptoPaymentRequest();
        r.setMaGiaoDichGoc(SESSION);
        r.setTxHash(txHash);
        r.setWalletAddress("0xabc");
        r.setSoTien(BigDecimal.TEN);
        return r;
    }

    @Test
    @DisplayName("Crypto: TxHash hợp lệ được ghi PENDING_VERIFICATION, đơn CHỜ XÁC MINH (chưa PAID)")
    void cryptoAwaitsAdminVerification() {
        when(orderClient.findOrders(null, SESSION)).thenReturn(List.of(order("DH-1", 5, 1_000_000, "PENDING", "UNPAID")));
        GiaoDichCrypto tx = cryptoService.submitCryptoPayment(crypto(TX));
        assertThat(tx.getTrangThaiGiaoDich()).isEqualTo("PENDING_VERIFICATION");
        verify(orderClient).syncPaymentStatus(SESSION, "CHỜ XÁC MINH");
        verify(orderClient, never()).syncPaymentStatus(SESSION, "PAID");
    }

    @Test
    @DisplayName("Crypto: TxHash sai định dạng, dùng lại, hoặc đơn đã hủy đều bị từ chối")
    void cryptoRejections() {
        when(orderClient.findOrders(null, SESSION)).thenReturn(List.of(order("DH-1", 5, 1_000_000, "PENDING", "UNPAID")));
        assertThatThrownBy(() -> cryptoService.submitCryptoPayment(crypto("0x123"))).hasMessageContaining("định dạng");

        when(cryptoRepository.findByTxHash(TX)).thenReturn(Optional.of(new GiaoDichCrypto()));
        assertThatThrownBy(() -> cryptoService.submitCryptoPayment(crypto(TX))).hasMessageContaining("đã tồn tại");

        String tx2 = "0x" + "b".repeat(64);
        when(orderClient.findOrders(null, SESSION)).thenReturn(List.of(order("DH-1", 5, 1_000_000, "CANCELLED_PAYMENT_FAILED", "UNPAID")));
        assertThatThrownBy(() -> cryptoService.submitCryptoPayment(crypto(tx2))).hasMessageContaining("đã bị hủy");
    }

    @Test
    @DisplayName("Crypto: chỉ Admin xác nhận / từ chối; từ chối kích hoạt rollback đơn")
    void cryptoAdminDecision() {
        GiaoDichCrypto pending = GiaoDichCrypto.builder().id(7L).maGiaoDichGoc(SESSION).txHash(TX)
                .trangThaiGiaoDich("PENDING_VERIFICATION").build();
        when(cryptoRepository.findById(7L)).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> cryptoService.confirmTransaction(7L)).isInstanceOf(ForbiddenException.class);

        as("ADMIN", 1L);
        cryptoService.rejectTransaction(7L);
        assertThat(pending.getTrangThaiGiaoDich()).isEqualTo("INVALID");
        verify(orderClient).syncPaymentStatus(SESSION, "THANH TOÁN THẤT BẠI");
    }
}
