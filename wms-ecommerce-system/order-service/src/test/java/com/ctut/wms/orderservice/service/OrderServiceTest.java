package com.ctut.wms.orderservice.service;

import com.ctut.wms.orderservice.TestUsers;
import com.ctut.wms.orderservice.client.WmsClient;
import com.ctut.wms.orderservice.client.WmsInventoryItem;
import com.ctut.wms.orderservice.dto.MultiShopCheckoutRequest;
import com.ctut.wms.orderservice.dto.MultiShopCheckoutResponse;
import com.ctut.wms.orderservice.dto.OrderDetailRequest;
import com.ctut.wms.orderservice.entity.Order;
import com.ctut.wms.orderservice.entity.Voucher;
import com.ctut.wms.orderservice.repository.OrderDetailRepository;
import com.ctut.wms.orderservice.repository.OrderRepository;
import com.ctut.wms.orderservice.repository.VoucherRepository;
import com.ctut.wms.orderservice.security.ForbiddenException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử nghiệp vụ cốt lõi của order-service:
 * định giá theo WMS, voucher 2 tầng, phân bổ giảm giá, hủy đơn, máy trạng thái, rollback thanh toán.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock OrderDetailRepository orderDetailRepository;
    @Mock VoucherRepository voucherRepository;
    @Mock WmsClient wmsClient;
    @InjectMocks OrderService orderService;

    static final long BUYER = 5L;
    static final long SHOP_A = 1L;
    static final long SHOP_B = 2L;

    @BeforeEach
    void setUp() {
        TestUsers.as("CUSTOMER", BUYER);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(inv -> inv.getArgument(0));
        when(voucherRepository.findByMaVoucher(anyString())).thenReturn(Optional.empty());
    }

    @AfterEach
    void tearDown() {
        TestUsers.clear();
    }

    // ===================== HÀM DỰNG DỮ LIỆU =====================

    private void stockAt(long shop, long productId, long price, int available, boolean onSale) {
        WmsInventoryItem item = new WmsInventoryItem();
        item.setSanPhamId(productId);
        item.setKhoHangId(shop);
        item.setSku("SKU-" + productId);
        item.setTenSanPham("Sản phẩm " + productId);
        item.setGiaBanHienTai(BigDecimal.valueOf(price));
        item.setSoLuongKhaDung(available);
        item.setDangBan(onSale);
        when(wmsClient.getInventoryItem(productId, shop)).thenReturn(item);
    }

    private OrderDetailRequest line(long productId, int qty, long clientPrice) {
        OrderDetailRequest d = new OrderDetailRequest();
        d.setSanPhamId(productId);
        d.setSoLuong(qty);
        d.setGiaMuaSnapshot(BigDecimal.valueOf(clientPrice));
        d.setTenHangHoaSnapshot("tên do client gửi");
        return d;
    }

    private MultiShopCheckoutRequest.ShopOrderBlock block(long shop, String shopVoucher, OrderDetailRequest... lines) {
        MultiShopCheckoutRequest.ShopOrderBlock b = new MultiShopCheckoutRequest.ShopOrderBlock();
        b.setCuaHangId(shop);
        b.setMaVoucherShop(shopVoucher);
        b.setDanhSachHang(new ArrayList<>(List.of(lines)));
        return b;
    }

    private MultiShopCheckoutRequest checkout(String globalVoucher, MultiShopCheckoutRequest.ShopOrderBlock... blocks) {
        MultiShopCheckoutRequest r = new MultiShopCheckoutRequest();
        r.setNguoiDungId(999L); // client cố tình đặt hộ người khác
        r.setPhuongThucThanhToan("COD");
        r.setMaVoucherToanSan(globalVoucher);
        r.setShopOrders(new ArrayList<>(List.of(blocks)));
        return r;
    }

    private Voucher voucher(String code, Long shop, int pct, long maxDiscount, long minOrder, int qty) {
        Voucher v = new Voucher();
        v.setMaVoucher(code);
        v.setCuaHangId(shop);
        v.setPhanTramGiam(pct);
        v.setGiamToiDa(BigDecimal.valueOf(maxDiscount));
        v.setDonHangToiThieu(BigDecimal.valueOf(minOrder));
        v.setSoLuongConLai(qty);
        v.setNgayBatDau(LocalDateTime.now().minusDays(1));
        v.setNgayHetHan(LocalDateTime.now().plusDays(30));
        when(voucherRepository.findByMaVoucher(code)).thenReturn(Optional.of(v));
        return v;
    }

    private Order existingOrder(long id, String status, String shipping, String payStatus, String method) {
        Order o = new Order();
        o.setId(id);
        o.setNguoiDungId(BUYER);
        o.setCuaHangId(SHOP_A);
        o.setTrangThaiDonHang(status);
        o.setTrangThaiGiaoHang(shipping);
        o.setTrangThaiThanhToan(payStatus);
        o.setPhuongThucThanhToan(method);
        when(orderRepository.findById(id)).thenReturn(Optional.of(o));
        return o;
    }

    private static BigDecimal vnd(long v) {
        return BigDecimal.valueOf(v);
    }

    // ===================== ĐỊNH GIÁ & KIỂM TRA ĐẦU VÀO =====================

    @Nested
    @DisplayName("Đặt hàng: không tin dữ liệu client")
    class Pricing {

        @Test
        @DisplayName("Giá lấy từ WMS, bỏ qua giá client gửi lên")
        void usesWmsPrice() {
            stockAt(SHOP_A, 10, 1_000_000, 50, true);

            MultiShopCheckoutResponse res = orderService.checkoutMultiShop(
                    checkout(null, block(SHOP_A, null, line(10, 2, 1))));

            assertThat(res.getTongTienHangGop()).isEqualByComparingTo(vnd(2_000_000));
            Order order = res.getDanhSachDonHang().get(0);
            assertThat(order.getChiTietDonHangs().get(0).getGiaMuaSnapshot()).isEqualByComparingTo(vnd(1_000_000));
            assertThat(order.getChiTietDonHangs().get(0).getTenHangHoaSnapshot()).isEqualTo("Sản phẩm 10");
            verify(wmsClient).createExportNote(any());
        }

        @Test
        @DisplayName("Người mua lấy từ token, không theo nguoiDungId client gửi")
        void buyerFromToken() {
            stockAt(SHOP_A, 10, 100_000, 50, true);
            MultiShopCheckoutResponse res = orderService.checkoutMultiShop(
                    checkout(null, block(SHOP_A, null, line(10, 1, 100_000))));
            assertThat(res.getDanhSachDonHang().get(0).getNguoiDungId()).isEqualTo(BUYER);
        }

        @Test
        @DisplayName("Từ chối số lượng <= 0")
        void rejectsNonPositiveQuantity() {
            stockAt(SHOP_A, 10, 100_000, 50, true);
            assertThatThrownBy(() -> orderService.checkoutMultiShop(
                    checkout(null, block(SHOP_A, null, line(10, -3, 100_000)))))
                    .hasMessageContaining("Số lượng");
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("Từ chối sản phẩm chưa mở bán")
        void rejectsNotOnSale() {
            stockAt(SHOP_A, 10, 100_000, 50, false);
            assertThatThrownBy(() -> orderService.checkoutMultiShop(
                    checkout(null, block(SHOP_A, null, line(10, 1, 100_000)))))
                    .hasMessageContaining("không mở bán");
        }

        @Test
        @DisplayName("Từ chối mua vượt tồn khả dụng")
        void rejectsOverAvailable() {
            stockAt(SHOP_A, 10, 100_000, 2, true);
            assertThatThrownBy(() -> orderService.checkoutMultiShop(
                    checkout(null, block(SHOP_A, null, line(10, 3, 100_000)))))
                    .hasMessageContaining("chỉ còn 2");
        }
    }

    // ===================== VOUCHER 2 TẦNG =====================

    @Nested
    @DisplayName("Voucher 2 tầng & phân bổ giảm giá")
    class Vouchers {

        @Test
        @DisplayName("Voucher sàn phân bổ theo tỷ trọng, tổng khớp tuyệt đối, chỉ trừ 1 lượt")
        void globalVoucherAllocation() {
            stockAt(SHOP_A, 10, 333_333, 10, true);
            stockAt(SHOP_B, 20, 666_667, 10, true);
            Voucher v = voucher("SAN10", null, 10, 1_000_000, 0, 5);

            MultiShopCheckoutResponse res = orderService.checkoutMultiShop(checkout("SAN10",
                    block(SHOP_A, null, line(10, 1, 1)),
                    block(SHOP_B, null, line(20, 1, 1))));

            List<Order> orders = res.getDanhSachDonHang();
            assertThat(orders).hasSize(2);
            assertThat(orders.get(0).getTienGiamGia()).isEqualByComparingTo(vnd(33_333));
            assertThat(orders.get(1).getTienGiamGia()).isEqualByComparingTo(vnd(66_667));
            assertThat(res.getTongGiamGiaGop()).isEqualByComparingTo(vnd(100_000));
            assertThat(res.getTongThanhToanGop()).isEqualByComparingTo(vnd(900_000));
            assertThat(orders).allMatch(o -> "SAN10".equals(o.getMaVoucherToanSan()));
            assertThat(v.getSoLuongConLai()).isEqualTo(4);
        }

        @Test
        @DisplayName("Mã voucher không tồn tại bị từ chối (không tự sinh voucher)")
        void unknownVoucherRejected() {
            stockAt(SHOP_A, 10, 500_000, 10, true);
            assertThatThrownBy(() -> orderService.checkoutMultiShop(
                    checkout("BIACHUYEN", block(SHOP_A, null, line(10, 1, 1)))))
                    .hasMessageContaining("không tồn tại");
            verify(voucherRepository, never()).save(any());
        }

        @Test
        @DisplayName("Voucher của shop khác không áp dụng được")
        void otherShopVoucherRejected() {
            stockAt(SHOP_A, 10, 500_000, 10, true);
            voucher("SHOPB", SHOP_B, 10, 50_000, 0, 5);
            assertThatThrownBy(() -> orderService.checkoutMultiShop(
                    checkout(null, block(SHOP_A, "SHOPB", line(10, 1, 1)))))
                    .hasMessageContaining("không áp dụng");
        }

        @Test
        @DisplayName("Voucher shop dùng ở ô voucher sàn bị từ chối")
        void shopVoucherAsGlobalRejected() {
            stockAt(SHOP_A, 10, 500_000, 10, true);
            voucher("SHOPA", SHOP_A, 10, 50_000, 0, 5);
            assertThatThrownBy(() -> orderService.checkoutMultiShop(
                    checkout("SHOPA", block(SHOP_A, null, line(10, 1, 1)))))
                    .hasMessageContaining("không áp dụng");
        }

        @Test
        @DisplayName("Chưa đạt giá trị đơn tối thiểu bị từ chối")
        void belowMinimumRejected() {
            stockAt(SHOP_A, 10, 100_000, 10, true);
            voucher("MIN1TR", null, 10, 50_000, 1_000_000, 5);
            assertThatThrownBy(() -> orderService.checkoutMultiShop(
                    checkout("MIN1TR", block(SHOP_A, null, line(10, 1, 1)))))
                    .hasMessageContaining("tối thiểu");
        }

        @Test
        @DisplayName("Voucher hết lượt bị từ chối")
        void exhaustedVoucherRejected() {
            stockAt(SHOP_A, 10, 500_000, 10, true);
            voucher("HETLUOT", null, 10, 50_000, 0, 0);
            assertThatThrownBy(() -> orderService.checkoutMultiShop(
                    checkout("HETLUOT", block(SHOP_A, null, line(10, 1, 1)))))
                    .hasMessageContaining("hết lượt");
        }

        @Test
        @DisplayName("Mức giảm không vượt giảm tối đa")
        void respectsMaxDiscount() {
            stockAt(SHOP_A, 10, 10_000_000, 10, true);
            voucher("SHOPA50", SHOP_A, 50, 200_000, 0, 5);
            MultiShopCheckoutResponse res = orderService.checkoutMultiShop(
                    checkout(null, block(SHOP_A, "SHOPA50", line(10, 1, 1))));
            assertThat(res.getTongGiamGiaGop()).isEqualByComparingTo(vnd(200_000));
        }
    }

    // ===================== HỦY ĐƠN =====================

    @Nested
    @DisplayName("Hủy đơn")
    class Cancel {

        @Test
        @DisplayName("Hủy đơn chưa giao: nhả tồn kho bên WMS và hoàn lượt voucher shop")
        void cancelReleasesStockAndVoucher() {
            Order o = existingOrder(1L, "PENDING", "WAITING", "UNPAID", "COD");
            Voucher shopV = voucher("SHOPA", SHOP_A, 10, 50_000, 0, 3);
            o.setVoucher(shopV);

            Order saved = orderService.cancelOrder(1L);

            assertThat(saved.getTrangThaiDonHang()).isEqualTo("CANCELLED");
            verify(wmsClient).cancelExportNotes(o.getMaDonHang());
            assertThat(shopV.getSoLuongConLai()).isEqualTo(4);
        }

        @Test
        @DisplayName("Không hủy được đơn đã bàn giao vận chuyển")
        void cannotCancelWhenDelivering() {
            existingOrder(1L, "CONFIRMED", "DELIVERING", "UNPAID", "COD");
            assertThatThrownBy(() -> orderService.cancelOrder(1L)).hasMessageContaining("bàn giao");
            verify(wmsClient, never()).cancelExportNotes(any());
        }

        @Test
        @DisplayName("Khách không tự hủy được đơn đã thanh toán")
        void buyerCannotCancelPaidOrder() {
            existingOrder(1L, "CONFIRMED", "WAITING", "PAID", "MOMO");
            assertThatThrownBy(() -> orderService.cancelOrder(1L)).hasMessageContaining("đã thanh toán");
        }

        @Test
        @DisplayName("Người khác không hủy được đơn")
        void strangerCannotCancel() {
            existingOrder(1L, "PENDING", "WAITING", "UNPAID", "COD");
            TestUsers.as("CUSTOMER", 777L);
            assertThatThrownBy(() -> orderService.cancelOrder(1L)).isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("WMS từ chối (hàng đã rời kho) thì đơn KHÔNG bị hủy")
        void wmsFailureKeepsOrder() {
            Order o = existingOrder(1L, "PENDING", "WAITING", "UNPAID", "COD");
            doThrow(new RuntimeException("đã xuất kho")).when(wmsClient).cancelExportNotes(any());
            assertThatThrownBy(() -> orderService.cancelOrder(1L)).hasMessageContaining("đã xuất kho");
            assertThat(o.getTrangThaiDonHang()).isEqualTo("PENDING");
        }
    }

    // ===================== MÁY TRẠNG THÁI =====================

    @Nested
    @DisplayName("Máy trạng thái đơn hàng & giao vận")
    class StateMachine {

        @BeforeEach
        void asSeller() {
            TestUsers.as("STORE_OWNER", 50L); // wmsClient.requireStoreOwner là mock => coi như đúng chủ shop
        }

        @Test
        @DisplayName("Không xác nhận đơn thanh toán online khi chưa trả tiền")
        void cannotConfirmUnpaidOnlineOrder() {
            existingOrder(1L, "PENDING", "WAITING", "UNPAID", "MOMO");
            assertThatThrownBy(() -> orderService.updateOrderStatus(1L, "CONFIRMED"))
                    .hasMessageContaining("chưa được thanh toán");
        }

        @Test
        @DisplayName("Trạng thái lạ bị từ chối")
        void unknownStatusRejected() {
            existingOrder(1L, "PENDING", "WAITING", "UNPAID", "COD");
            assertThatThrownBy(() -> orderService.updateOrderStatus(1L, "HACKED"))
                    .hasMessageContaining("không hợp lệ");
        }

        @Test
        @DisplayName("Bàn giao vận chuyển sinh mã vận đơn theo hãng")
        void deliveringGeneratesTrackingCode() {
            existingOrder(1L, "CONFIRMED", "WAITING", "UNPAID", "COD");
            Order o = orderService.updateShippingStatus(1L, "DELIVERING", "GHN Express");
            assertThat(o.getTrangThaiGiaoHang()).isEqualTo("DELIVERING");
            assertThat(o.getMaVanDon()).startsWith("GHN").hasSize(13);
        }

        @Test
        @DisplayName("Không nhảy cóc WAITING -> DELIVERED")
        void cannotSkipShippingSteps() {
            existingOrder(1L, "CONFIRMED", "WAITING", "UNPAID", "COD");
            assertThatThrownBy(() -> orderService.updateShippingStatus(1L, "DELIVERED", null))
                    .hasMessageContaining("Không thể chuyển");
        }

        @Test
        @DisplayName("Không điều phối giao hàng cho đơn chưa xác nhận")
        void cannotShipUnconfirmedOrder() {
            existingOrder(1L, "PENDING", "WAITING", "UNPAID", "COD");
            assertThatThrownBy(() -> orderService.updateShippingStatus(1L, "DELIVERING", "GHTK"))
                    .hasMessageContaining("CONFIRMED");
        }

        @Test
        @DisplayName("Hoàn thành đơn COD: giao hàng DELIVERED và thanh toán PAID")
        void completeCodOrder() {
            existingOrder(1L, "CONFIRMED", "DELIVERING", "UNPAID", "COD");
            Order o = orderService.updateOrderStatus(1L, "COMPLETED");
            assertThat(o.getTrangThaiDonHang()).isEqualTo("COMPLETED");
            assertThat(o.getTrangThaiGiaoHang()).isEqualTo("DELIVERED");
            assertThat(o.getTrangThaiThanhToan()).isEqualTo("PAID");
        }

        @Test
        @DisplayName("Không hoàn thành đơn chưa bàn giao vận chuyển")
        void cannotCompleteBeforeShipping() {
            existingOrder(1L, "CONFIRMED", "WAITING", "UNPAID", "COD");
            assertThatThrownBy(() -> orderService.updateOrderStatus(1L, "COMPLETED"))
                    .hasMessageContaining("bàn giao");
        }
    }

    // ===================== THANH TOÁN & ROLLBACK =====================

    @Nested
    @DisplayName("Thanh toán & rollback tự động")
    class Payment {

        @Test
        @DisplayName("Khách hàng không tự đổi trạng thái thanh toán được")
        void customerCannotMarkPaid() {
            assertThatThrownBy(() -> orderService.updatePaymentStatusForCheckoutSession("CHECKOUT-1", "PAID"))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("Thanh toán thành công: đơn PENDING chuyển CONFIRMED")
        void paidConfirmsOrder() {
            TestUsers.as("SYSTEM", null);
            Order o = existingOrder(1L, "PENDING", "WAITING", "UNPAID", "MOMO");
            when(orderRepository.findByMaGiaoDichGoc("CHECKOUT-1")).thenReturn(List.of(o));

            orderService.updatePaymentStatusForCheckoutSession("CHECKOUT-1", "PAID");

            assertThat(o.getTrangThaiDonHang()).isEqualTo("CONFIRMED");
            assertThat(o.getTrangThaiThanhToan()).isEqualTo("PAID");
        }

        @Test
        @DisplayName("Thanh toán thất bại: đơn bị hủy CANCELLED_PAYMENT_FAILED và nhả tồn kho")
        void failedPaymentRollsBack() {
            TestUsers.as("SYSTEM", null);
            Order o = existingOrder(1L, "PENDING", "WAITING", "UNPAID", "MOMO");
            when(orderRepository.findByMaGiaoDichGoc("CHECKOUT-1")).thenReturn(List.of(o));

            orderService.updatePaymentStatusForCheckoutSession("CHECKOUT-1", "THANH TOÁN THẤT BẠI");

            assertThat(o.getTrangThaiDonHang()).isEqualTo("CANCELLED_PAYMENT_FAILED");
            verify(wmsClient).cancelExportNotes(o.getMaDonHang());
        }

        @Test
        @DisplayName("Tiền về sau khi đơn đã hủy: chuyển CHỜ HOÀN TIỀN")
        void latePaymentMarkedForRefund() {
            TestUsers.as("SYSTEM", null);
            Order o = existingOrder(1L, "CANCELLED_PAYMENT_FAILED", "WAITING", "UNPAID", "MOMO");
            when(orderRepository.findByMaGiaoDichGoc("CHECKOUT-1")).thenReturn(List.of(o));

            orderService.updatePaymentStatusForCheckoutSession("CHECKOUT-1", "PAID");

            assertThat(o.getTrangThaiDonHang()).isEqualTo("CANCELLED_PAYMENT_FAILED");
            assertThat(o.getTrangThaiThanhToan()).isEqualTo("CHỜ HOÀN TIỀN");
        }

        @Test
        @DisplayName("Job quá hạn chỉ chọn đơn online chưa thanh toán (bỏ COD & đơn chờ xác minh crypto)")
        void expiredOrdersSelection() {
            Order momoUnpaid = existingOrder(1L, "PENDING", "WAITING", "UNPAID", "MOMO");
            Order cod = existingOrder(2L, "PENDING", "WAITING", "UNPAID", "COD");
            Order cryptoVerifying = existingOrder(3L, "PENDING", "WAITING", "CHỜ XÁC MINH", "CRYPTO");
            Order momoFailed = existingOrder(4L, "PENDING", "WAITING", "THANH TOÁN THẤT BẠI", "MOMO");
            when(orderRepository.findByTrangThaiDonHangAndCreatedAtBefore(eq("PENDING"), any()))
                    .thenReturn(List.of(momoUnpaid, cod, cryptoVerifying, momoFailed));

            assertThat(orderService.findExpiredUnpaidOnlineOrders(LocalDateTime.now())).containsExactly(1L, 4L);
        }

        @Test
        @DisplayName("Rollback không đụng tới đơn đã thanh toán")
        void rollbackSkipsPaidOrder() {
            existingOrder(1L, "PENDING", "WAITING", "PAID", "MOMO");
            assertThat(orderService.rollbackUnpaidOrder(1L, "test")).isFalse();
            verify(wmsClient, never()).cancelExportNotes(any());
        }
    }
}
