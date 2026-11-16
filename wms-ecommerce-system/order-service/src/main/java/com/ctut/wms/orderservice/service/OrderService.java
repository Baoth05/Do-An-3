/**
 * ==============================================================================
 * Service: OrderService
 * Phân hệ: Order Service (Microservice quản lý đơn hàng - Port 8082)
 * Mô tả: Cung cấp logic nghiệp vụ xử lý đơn hàng, mã giảm giá và tách đơn đa gian hàng.
 * Chức năng chính:
 *   - placeOrder: Tính tiền hàng (giá lấy từ WMS), áp Voucher, lưu đơn hàng và tạo yêu cầu xuất kho sang WMS Core.
 *   - checkoutMultiShop: Thuật toán tách đơn hàng đa shop, gom đơn theo từng cua_hang_id.
 *   - updatePaymentStatus & updatePaymentStatusForCheckoutSession: Đồng bộ thanh toán từ payment-service.
 * Nguyên tắc bảo mật:
 *   - Giá bán, tên & SKU luôn lấy từ WMS Core, KHÔNG tin giá do client gửi lên.
 *   - Người mua (nguoiDungId) lấy từ token đã xác thực tại Gateway.
 *   - Voucher phải tồn tại sẵn trong CSDL, còn hạn, đúng gian hàng.
 * ==============================================================================
 */
package com.ctut.wms.orderservice.service;

import com.ctut.wms.orderservice.client.WmsClient;
import com.ctut.wms.orderservice.client.WmsInventoryItem;
import com.ctut.wms.orderservice.dto.*;
import com.ctut.wms.orderservice.entity.Order;
import com.ctut.wms.orderservice.entity.OrderDetail;
import com.ctut.wms.orderservice.entity.Voucher;
import com.ctut.wms.orderservice.repository.OrderDetailRepository;
import com.ctut.wms.orderservice.repository.OrderRepository;
import com.ctut.wms.orderservice.repository.VoucherRepository;
import com.ctut.wms.orderservice.security.CurrentUser;
import com.ctut.wms.orderservice.security.ForbiddenException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final VoucherRepository voucherRepository;
    private final WmsClient wmsClient;

    private static final Set<String> PAID_STATUSES = Set.of("ĐÃ THANH TOÁN", "PAID", "SUCCESS");

    /** Kết quả áp dụng voucher. */
    private record VoucherResult(Voucher voucher, BigDecimal discount) {
        static final VoucherResult NONE = new VoucherResult(null, BigDecimal.ZERO);
    }

    // =====================================================================
    // ĐẶT HÀNG
    // =====================================================================

    @Transactional
    public Order placeOrder(OrderRequest request) {
        Long buyerId = resolveBuyerId(request.getNguoiDungId());
        List<OrderDetailRequest> items = priceItems(request.getDanhSachHang(), request.getCuaHangId());
        BigDecimal tongTienHang = subtotal(items);

        // Đơn lẻ: chấp nhận voucher toàn sàn hoặc voucher của chính gian hàng này
        VoucherResult vr = applyVoucher(request.getMaVoucher(), tongTienHang, request.getCuaHangId(), true);
        BigDecimal tongThanhToan = tongTienHang.subtract(vr.discount()).max(BigDecimal.ZERO);

        Order order = new Order();
        order.setMaGiaoDichGoc(request.getMaGiaoDichGoc());
        order.setCuaHangId(request.getCuaHangId());
        order.setDonViVanChuyen(request.getDonViVanChuyen() != null ? request.getDonViVanChuyen() : "GHTK");
        order.setNguoiDungId(buyerId);
        order.setVoucher(vr.voucher());
        if (vr.voucher() != null && vr.voucher().getCuaHangId() == null) {
            order.setMaVoucherToanSan(vr.voucher().getMaVoucher());
        }
        order.setTongTienHang(tongTienHang);
        order.setTienGiamGia(vr.discount());
        order.setTongThanhToan(tongThanhToan);
        order.setPhuongThucThanhToan(request.getPhuongThucThanhToan());
        order.setDiaChiGiaoHang(request.getDiaChiGiaoHang());
        order.setSoDienThoai(request.getSoDienThoai());

        Order savedOrder = orderRepository.save(order);
        List<WmsExportRequest> exports = new ArrayList<>();
        saveDetailsAndCollectExport(savedOrder, items, request.getCuaHangId(), exports);
        sendExportNotesAfterCommit(exports);
        return savedOrder;
    }

    /**
     * Thuật toán Tách Đơn Tự Động (Order Splitting - B2B2C):
     * - Xét điều kiện Voucher Toàn Sàn trên TỔNG GIÁ TRỊ GIỎ HÀNG GỘP, trừ lượt dùng đúng 1 lần.
     * - Phân bổ tiền giảm Voucher toàn sàn theo tỷ trọng và kết hợp Voucher riêng của từng Shop.
     */
    @Transactional
    public MultiShopCheckoutResponse checkoutMultiShop(MultiShopCheckoutRequest request) {
        if (request.getShopOrders() == null || request.getShopOrders().isEmpty()) {
            throw new RuntimeException("Lỗi: Giỏ hàng trống!");
        }
        Long buyerId = resolveBuyerId(request.getNguoiDungId());
        String maGiaoDichGoc = "CHECKOUT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 1. Định giá lại toàn bộ giỏ hàng theo giá thật trên WMS & tính tổng gộp
        List<List<OrderDetailRequest>> pricedBlocks = new ArrayList<>();
        BigDecimal tongTienHangGop = BigDecimal.ZERO;
        for (MultiShopCheckoutRequest.ShopOrderBlock shopBlock : request.getShopOrders()) {
            List<OrderDetailRequest> priced = priceItems(shopBlock.getDanhSachHang(), shopBlock.getCuaHangId());
            pricedBlocks.add(priced);
            tongTienHangGop = tongTienHangGop.add(subtotal(priced));
        }

        // 2. Voucher Toàn Sàn (bắt buộc là voucher không thuộc gian hàng nào)
        VoucherResult global = applyVoucher(request.getMaVoucherToanSan(), tongTienHangGop, null, false);
        BigDecimal tongGiamGiaToanSan = global.discount();

        // 3. Tạo từng đơn hàng con cho từng shop và phân bổ tiền giảm giá
        List<Order> createdOrders = new ArrayList<>();
        List<WmsExportRequest> exports = new ArrayList<>();
        BigDecimal tongGiamGiaGop = BigDecimal.ZERO;
        BigDecimal tongThanhToanGop = BigDecimal.ZERO;
        BigDecimal daPhanBoToanSan = BigDecimal.ZERO;
        int totalShops = request.getShopOrders().size();

        for (int idx = 0; idx < totalShops; idx++) {
            MultiShopCheckoutRequest.ShopOrderBlock shopBlock = request.getShopOrders().get(idx);
            List<OrderDetailRequest> items = pricedBlocks.get(idx);
            BigDecimal shopTienHang = subtotal(items);

            // 3.1. Voucher riêng của Shop (phải thuộc đúng gian hàng này)
            VoucherResult shopVr = applyVoucher(shopBlock.getMaVoucherShop(), shopTienHang, shopBlock.getCuaHangId(), false);

            // 3.2. Phân bổ Voucher Toàn Sàn theo tỷ trọng tiền hàng
            BigDecimal tienGiamToanSanPhanBo = BigDecimal.ZERO;
            if (tongGiamGiaToanSan.signum() > 0 && tongTienHangGop.signum() > 0) {
                if (idx == totalShops - 1) {
                    // Shop cuối cùng nhận phần còn lại để tránh lệch số do làm tròn
                    tienGiamToanSanPhanBo = tongGiamGiaToanSan.subtract(daPhanBoToanSan);
                } else {
                    tienGiamToanSanPhanBo = tongGiamGiaToanSan.multiply(shopTienHang)
                            .divide(tongTienHangGop, 0, RoundingMode.HALF_UP);
                    daPhanBoToanSan = daPhanBoToanSan.add(tienGiamToanSanPhanBo);
                }
            }

            BigDecimal tongGiamGiaDonCon = shopVr.discount().add(tienGiamToanSanPhanBo).min(shopTienHang);
            BigDecimal tongThanhToanDonCon = shopTienHang.subtract(tongGiamGiaDonCon).max(BigDecimal.ZERO);

            Order order = new Order();
            order.setMaGiaoDichGoc(maGiaoDichGoc);
            order.setCuaHangId(shopBlock.getCuaHangId());
            order.setDonViVanChuyen(shopBlock.getDonViVanChuyen() != null ? shopBlock.getDonViVanChuyen() : "GHTK");
            order.setNguoiDungId(buyerId);
            order.setVoucher(shopVr.voucher() != null ? shopVr.voucher() : global.voucher());
            order.setMaVoucherToanSan(global.voucher() != null ? global.voucher().getMaVoucher() : null);
            order.setTongTienHang(shopTienHang);
            order.setTienGiamGia(tongGiamGiaDonCon);
            order.setTongThanhToan(tongThanhToanDonCon);
            order.setPhuongThucThanhToan(request.getPhuongThucThanhToan());
            order.setDiaChiGiaoHang(request.getDiaChiGiaoHang());
            order.setSoDienThoai(request.getSoDienThoai());

            Order savedOrder = orderRepository.save(order);
            saveDetailsAndCollectExport(savedOrder, items, shopBlock.getCuaHangId(), exports);
            createdOrders.add(savedOrder);

            tongGiamGiaGop = tongGiamGiaGop.add(tongGiamGiaDonCon);
            tongThanhToanGop = tongThanhToanGop.add(tongThanhToanDonCon);
        }

        sendExportNotesAfterCommit(exports);

        return MultiShopCheckoutResponse.builder()
                .maGiaoDichGoc(maGiaoDichGoc)
                .soLuongDonHang(createdOrders.size())
                .danhSachDonHang(createdOrders)
                .tongTienHangGop(tongTienHangGop)
                .tongGiamGiaGop(tongGiamGiaGop)
                .tongThanhToanGop(tongThanhToanGop)
                .build();
    }

    // =====================================================================
    // TRA CỨU (có kiểm tra quyền sở hữu)
    // =====================================================================

    public List<Order> getOrdersByUser(Long nguoiDungId) {
        CurrentUser.requireSelfOrAdmin(nguoiDungId);
        return orderRepository.findByNguoiDungIdOrderByCreatedAtDesc(nguoiDungId);
    }

    public List<Order> getOrdersByStore(Long cuaHangId) {
        wmsClient.requireStoreOwner(cuaHangId);
        return orderRepository.findByCuaHangIdOrderByCreatedAtDesc(cuaHangId);
    }

    public List<Order> getOrdersByCheckoutSession(String maGiaoDichGoc) {
        List<Order> orders = orderRepository.findByMaGiaoDichGoc(maGiaoDichGoc);
        for (Order o : orders) {
            CurrentUser.requireSelfOrAdmin(o.getNguoiDungId());
        }
        return orders;
    }

    public Order getOrderByMaDonHang(String maDonHang) {
        Order order = orderRepository.findByMaDonHang(maDonHang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + maDonHang));
        requireBuyerOrStoreOwner(order);
        return order;
    }

    public List<Order> getAllOrders() {
        CurrentUser.requireAdmin();
        return orderRepository.findAll();
    }

    // =====================================================================
    // CẬP NHẬT TRẠNG THÁI (MÁY TRẠNG THÁI)
    //
    //  Trạng thái đơn:      PENDING --> CONFIRMED --> COMPLETED
    //                       PENDING / CONFIRMED (chưa giao) --> CANCELLED
    //                       PENDING (thanh toán online lỗi/quá hạn) --> CANCELLED_PAYMENT_FAILED
    //  Trạng thái giao hàng: WAITING --> PACKING --> DELIVERING --> DELIVERED
    //                                               DELIVERING --> RETURNED
    // =====================================================================

    public static final String ST_PENDING = "PENDING";
    public static final String ST_CONFIRMED = "CONFIRMED";
    public static final String ST_COMPLETED = "COMPLETED";
    public static final String ST_CANCELLED = "CANCELLED";
    public static final String ST_CANCELLED_PAYMENT_FAILED = "CANCELLED_PAYMENT_FAILED";

    public static final String SHIP_WAITING = "WAITING";
    public static final String SHIP_PACKING = "PACKING";
    public static final String SHIP_DELIVERING = "DELIVERING";
    public static final String SHIP_DELIVERED = "DELIVERED";
    public static final String SHIP_RETURNED = "RETURNED";

    private static final Set<String> FAILED_PAYMENT_STATUSES = Set.of("THANH TOÁN THẤT BẠI", "FAILED", "PAYMENT_FAILED");
    private static final Set<String> ONLINE_METHODS = Set.of("MOMO", "CRYPTO");

    /** Chủ shop cập nhật trạng thái đơn: chỉ cho phép các bước chuyển hợp lệ. */
    @Transactional
    public Order updateOrderStatus(Long orderId, String status) {
        Order order = findOrder(orderId);
        wmsClient.requireStoreOwner(order.getCuaHangId());
        String target = normalize(status);
        String current = normalize(order.getTrangThaiDonHang());
        if (current.isEmpty()) current = ST_PENDING;

        switch (target) {
            case ST_CONFIRMED -> {
                if (!ST_PENDING.equals(current)) {
                    throw new RuntimeException("Lỗi: Chỉ xác nhận được đơn đang ở trạng thái PENDING!");
                }
                if (isOnlinePayment(order) && !isPaid(order.getTrangThaiThanhToan())) {
                    throw new RuntimeException("Lỗi: Đơn thanh toán online chưa được thanh toán, chưa thể xác nhận!");
                }
                order.setTrangThaiDonHang(ST_CONFIRMED);
            }
            case ST_COMPLETED -> {
                String ship = normalize(order.getTrangThaiGiaoHang());
                if (!ST_CONFIRMED.equals(current) || !(isInTransit(ship) || SHIP_DELIVERED.equals(ship))) {
                    throw new RuntimeException("Lỗi: Đơn phải được xác nhận và đã bàn giao vận chuyển mới có thể hoàn thành!");
                }
                order.setTrangThaiDonHang(ST_COMPLETED);
                order.setTrangThaiGiaoHang(SHIP_DELIVERED);
                // COD: khách trả tiền khi nhận hàng
                if ("COD".equalsIgnoreCase(order.getPhuongThucThanhToan()) && !isPaid(order.getTrangThaiThanhToan())) {
                    order.setTrangThaiThanhToan("PAID");
                }
            }
            case ST_CANCELLED -> {
                return cancelOrder(orderId);
            }
            default -> throw new RuntimeException("Lỗi: Trạng thái [" + status + "] không hợp lệ! (CONFIRMED / COMPLETED / CANCELLED)");
        }
        return orderRepository.save(order);
    }

    /** Chủ shop cập nhật tiến độ giao hàng: WAITING -> PACKING -> DELIVERING -> DELIVERED / RETURNED. */
    @Transactional
    public Order updateShippingStatus(Long orderId, String shippingStatus, String donViVanChuyen) {
        Order order = findOrder(orderId);
        wmsClient.requireStoreOwner(order.getCuaHangId());
        if (!ST_CONFIRMED.equals(normalize(order.getTrangThaiDonHang()))) {
            throw new RuntimeException("Lỗi: Chỉ điều phối giao hàng cho đơn đã được xác nhận (CONFIRMED)!");
        }
        String target = normalize(shippingStatus);
        if ("SHIPPING".equals(target)) target = SHIP_DELIVERING; // Chấp nhận cách viết cũ
        String current = normalize(order.getTrangThaiGiaoHang());
        if (current.isEmpty()) current = SHIP_WAITING;
        if ("SHIPPING".equals(current)) current = SHIP_DELIVERING;

        boolean valid = switch (target) {
            case SHIP_PACKING -> SHIP_WAITING.equals(current);
            case SHIP_DELIVERING -> SHIP_WAITING.equals(current) || SHIP_PACKING.equals(current);
            case SHIP_DELIVERED, SHIP_RETURNED -> SHIP_DELIVERING.equals(current);
            default -> false;
        };
        if (!valid) {
            throw new RuntimeException("Lỗi: Không thể chuyển trạng thái giao hàng từ [" + current + "] sang [" + shippingStatus + "]!");
        }

        if (donViVanChuyen != null && !donViVanChuyen.isBlank()) {
            order.setDonViVanChuyen(donViVanChuyen.trim());
        }
        // Sinh mã vận đơn khi bàn giao cho đơn vị vận chuyển
        if (SHIP_DELIVERING.equals(target) && order.getMaVanDon() == null) {
            order.setMaVanDon(generateTrackingCode(order.getDonViVanChuyen()));
        }
        order.setTrangThaiGiaoHang(target);
        return orderRepository.save(order);
    }

    /** Chỉ payment-service (SYSTEM) hoặc Admin được đổi trạng thái thanh toán. */
    @Transactional
    public Order updatePaymentStatus(String maDonHang, String paymentStatus) {
        CurrentUser.requireAdmin();
        Order order = orderRepository.findByMaDonHang(maDonHang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + maDonHang));
        applyPaymentStatus(order, paymentStatus);
        return orderRepository.save(order);
    }

    @Transactional
    public void updatePaymentStatusForCheckoutSession(String maGiaoDichGoc, String paymentStatus) {
        CurrentUser.requireAdmin();
        List<Order> orders = orderRepository.findByMaGiaoDichGoc(maGiaoDichGoc);
        for (Order o : orders) {
            applyPaymentStatus(o, paymentStatus);
            orderRepository.save(o);
        }
    }

    /** Khách / chủ shop / Admin hủy đơn chưa giao. */
    @Transactional
    public Order cancelOrder(Long orderId) {
        Order order = findOrder(orderId);
        requireBuyerOrStoreOwner(order);

        String current = normalize(order.getTrangThaiDonHang());
        if (isCancelled(current) || ST_COMPLETED.equals(current)) {
            throw new RuntimeException("Lỗi: Đơn hàng đã " + order.getTrangThaiDonHang() + ", không thể hủy!");
        }
        String ship = normalize(order.getTrangThaiGiaoHang());
        if (!ship.isEmpty() && !SHIP_WAITING.equals(ship) && !SHIP_PACKING.equals(ship)) {
            throw new RuntimeException("Lỗi: Đơn hàng đã bàn giao vận chuyển, không thể hủy!");
        }
        // Khách đã thanh toán muốn hủy: phải qua gian hàng/Admin để xử lý hoàn tiền
        boolean isBuyerOnly = !CurrentUser.isAdmin() && !wmsClient.isStoreOwner(order.getCuaHangId());
        if (isBuyerOnly && isPaid(order.getTrangThaiThanhToan())) {
            throw new RuntimeException("Lỗi: Đơn hàng đã thanh toán, vui lòng liên hệ gian hàng để được hoàn tiền!");
        }
        return cancelAndRelease(order, ST_CANCELLED);
    }

    /**
     * Hủy đơn & hoàn tác: hủy phiếu xuất bên WMS (trả tồn khả dụng), hoàn lượt voucher,
     * đánh dấu chờ hoàn tiền nếu đã thanh toán. Ném lỗi (không hủy) nếu WMS từ chối / không liên lạc được.
     */
    private Order cancelAndRelease(Order order, String cancelStatus) {
        wmsClient.cancelExportNotes(order.getMaDonHang());
        order.setTrangThaiDonHang(cancelStatus);
        if (isPaid(order.getTrangThaiThanhToan())) {
            order.setTrangThaiThanhToan("CHỜ HOÀN TIỀN");
        }
        Order saved = orderRepository.save(order);
        restoreVouchers(saved);
        return saved;
    }

    /**
     * Rollback tự động khi thanh toán online thất bại hoặc quá hạn (được gọi bởi IPN thất bại & job định kỳ).
     * Chỉ áp dụng cho đơn còn PENDING và chưa thanh toán.
     * @return true nếu đã hủy đơn
     */
    @Transactional
    public boolean rollbackUnpaidOrder(Long orderId, String reason) {
        Order order = findOrder(orderId);
        if (!ST_PENDING.equals(normalize(order.getTrangThaiDonHang())) || isPaid(order.getTrangThaiThanhToan())) {
            return false;
        }
        cancelAndRelease(order, ST_CANCELLED_PAYMENT_FAILED);
        log.info("Đã hủy đơn {} ({}) và nhả tồn kho, hoàn voucher.", order.getMaDonHang(), reason);
        return true;
    }

    /** Danh sách ID đơn thanh toán online còn chờ thanh toán quá thời hạn (job định kỳ dùng). */
    @Transactional(readOnly = true)
    public List<Long> findExpiredUnpaidOnlineOrders(LocalDateTime createdBefore) {
        return orderRepository.findByTrangThaiDonHangAndCreatedAtBefore(ST_PENDING, createdBefore).stream()
                .filter(this::isOnlinePayment)
                .filter(o -> {
                    String pay = normalize(o.getTrangThaiThanhToan());
                    return pay.isEmpty() || "UNPAID".equals(pay) || FAILED_PAYMENT_STATUSES.contains(pay);
                })
                .map(Order::getId)
                .toList();
    }

    /** Người dùng đã mua và nhận sản phẩm hay chưa (interaction-service gọi nội bộ khi ghi nhận đánh giá). */
    public boolean hasPurchased(Long nguoiDungId, String maHangHoa) {
        CurrentUser.requireAdmin();
        if (nguoiDungId == null || maHangHoa == null) return false;
        return orderDetailRepository.hasPurchased(nguoiDungId, maHangHoa);
    }

    /**
     * Hoàn lượt voucher khi hủy đơn:
     *  - Voucher riêng của shop: hoàn ngay (chỉ đơn này dùng).
     *  - Voucher toàn sàn: chỉ hoàn khi TẤT CẢ đơn trong cùng phiên checkout đã bị hủy (vì chỉ trừ 1 lượt/phiên).
     */
    private void restoreVouchers(Order order) {
        Voucher v = order.getVoucher();
        if (v != null && v.getCuaHangId() != null) {
            v.setSoLuongConLai((v.getSoLuongConLai() != null ? v.getSoLuongConLai() : 0) + 1);
            voucherRepository.save(v);
        }
        String globalCode = order.getMaVoucherToanSan();
        if (globalCode == null) return;
        List<Order> siblings = order.getMaGiaoDichGoc() != null
                ? orderRepository.findByMaGiaoDichGoc(order.getMaGiaoDichGoc())
                : List.of(order);
        boolean allCancelled = siblings.stream().allMatch(o -> isCancelled(normalize(o.getTrangThaiDonHang())));
        if (allCancelled) {
            voucherRepository.findByMaVoucher(globalCode).ifPresent(gv -> {
                gv.setSoLuongConLai((gv.getSoLuongConLai() != null ? gv.getSoLuongConLai() : 0) + 1);
                voucherRepository.save(gv);
            });
        }
    }

    private static String normalize(String s) {
        return s == null ? "" : s.trim().toUpperCase(java.util.Locale.ROOT);
    }

    private static boolean isCancelled(String normalizedStatus) {
        return normalizedStatus.startsWith(ST_CANCELLED);
    }

    private static boolean isInTransit(String normalizedShip) {
        return SHIP_DELIVERING.equals(normalizedShip) || "SHIPPING".equals(normalizedShip);
    }

    private boolean isOnlinePayment(Order order) {
        return ONLINE_METHODS.contains(normalize(order.getPhuongThucThanhToan()));
    }

    /** Mã vận đơn: tiền tố theo đơn vị vận chuyển + 10 chữ số ngẫu nhiên. */
    private static String generateTrackingCode(String carrier) {
        String c = normalize(carrier);
        String prefix = c.contains("GHN") ? "GHN" : c.contains("VIETTEL") || c.contains("VTP") ? "VTP"
                : c.contains("GHTK") ? "GHTK" : "CTUT";
        long n = java.util.concurrent.ThreadLocalRandom.current().nextLong(1_000_000_000L, 10_000_000_000L);
        return prefix + n;
    }

    // =====================================================================
    // HÀM HỖ TRỢ
    // =====================================================================

    /** Người mua luôn là người đăng nhập (Admin được phép đặt hộ theo ID truyền vào). */
    private Long resolveBuyerId(Long requested) {
        if (CurrentUser.isAdmin() && requested != null) {
            return requested;
        }
        Long me = CurrentUser.id();
        if (me == null) {
            throw new ForbiddenException("Vui lòng đăng nhập lại để đặt hàng!");
        }
        return me;
    }

    /**
     * Định giá lại các mặt hàng theo dữ liệu thật trên WMS (giá bán, tên, SKU, tồn khả dụng).
     * Trả về danh sách mới, không dùng giá/tên client gửi lên.
     */
    private List<OrderDetailRequest> priceItems(List<OrderDetailRequest> items, Long cuaHangId) {
        if (items == null || items.isEmpty()) {
            throw new RuntimeException("Lỗi: Đơn hàng không có sản phẩm nào!");
        }
        if (cuaHangId == null) {
            throw new RuntimeException("Lỗi: Thiếu thông tin gian hàng!");
        }
        List<OrderDetailRequest> priced = new ArrayList<>();
        for (OrderDetailRequest item : items) {
            if (item.getSanPhamId() == null) {
                throw new RuntimeException("Lỗi: Sản phẩm [" + item.getTenHangHoaSnapshot() + "] thiếu mã sản phẩm!");
            }
            if (item.getSoLuong() == null || item.getSoLuong() <= 0) {
                throw new RuntimeException("Lỗi: Số lượng mua phải lớn hơn 0!");
            }
            WmsInventoryItem inv = wmsClient.getInventoryItem(item.getSanPhamId(), cuaHangId);
            String ten = inv.getTenSanPham() != null ? inv.getTenSanPham() : "Sản phẩm #" + item.getSanPhamId();
            if (!Boolean.TRUE.equals(inv.getDangBan())) {
                throw new RuntimeException("Lỗi: Sản phẩm [" + ten + "] hiện không mở bán!");
            }
            if (inv.getGiaBanHienTai() == null || inv.getGiaBanHienTai().signum() <= 0) {
                throw new RuntimeException("Lỗi: Sản phẩm [" + ten + "] chưa có giá bán!");
            }
            int khaDung = inv.getSoLuongKhaDung() != null ? inv.getSoLuongKhaDung() : 0;
            if (khaDung < item.getSoLuong()) {
                throw new RuntimeException("Lỗi: Sản phẩm [" + ten + "] chỉ còn " + khaDung + " sản phẩm!");
            }

            OrderDetailRequest p = new OrderDetailRequest();
            p.setSanPhamId(item.getSanPhamId());
            p.setCuaHangId(cuaHangId);
            p.setMaHangHoa(inv.getSku() != null && !inv.getSku().isBlank() ? inv.getSku() : String.valueOf(item.getSanPhamId()));
            p.setTenHangHoaSnapshot(ten);
            p.setGiaMuaSnapshot(inv.getGiaBanHienTai());
            p.setSoLuong(item.getSoLuong());
            priced.add(p);
        }
        return priced;
    }

    private BigDecimal subtotal(List<OrderDetailRequest> items) {
        BigDecimal total = BigDecimal.ZERO;
        for (OrderDetailRequest item : items) {
            total = total.add(item.getGiaMuaSnapshot().multiply(BigDecimal.valueOf(item.getSoLuong())));
        }
        return total;
    }

    /**
     * Kiểm tra & áp dụng voucher, trừ 1 lượt sử dụng.
     * @param storeId      gian hàng của đơn (null = voucher toàn sàn)
     * @param allowGlobal  true: chấp nhận cả voucher toàn sàn lẫn voucher của storeId
     */
    private VoucherResult applyVoucher(String rawCode, BigDecimal tienHang, Long storeId, boolean allowGlobal) {
        if (rawCode == null || rawCode.isBlank()) {
            return VoucherResult.NONE;
        }
        String code = rawCode.trim().toUpperCase();
        Voucher v = voucherRepository.findByMaVoucher(code)
                .orElseThrow(() -> new RuntimeException("Lỗi: Mã giảm giá [" + code + "] không tồn tại!"));

        boolean isGlobal = v.getCuaHangId() == null;
        boolean scopeOk = (storeId == null) ? isGlobal
                : (storeId.equals(v.getCuaHangId()) || (allowGlobal && isGlobal));
        if (!scopeOk) {
            throw new RuntimeException("Lỗi: Mã giảm giá [" + code + "] không áp dụng cho đơn hàng này!");
        }
        LocalDateTime now = LocalDateTime.now();
        if (v.getNgayBatDau() != null && v.getNgayBatDau().isAfter(now)) {
            throw new RuntimeException("Lỗi: Mã giảm giá [" + code + "] chưa đến thời gian sử dụng!");
        }
        if (v.getNgayHetHan() != null && v.getNgayHetHan().isBefore(now)) {
            throw new RuntimeException("Lỗi: Mã giảm giá [" + code + "] đã hết hạn!");
        }
        if (v.getSoLuongConLai() == null || v.getSoLuongConLai() <= 0) {
            throw new RuntimeException("Lỗi: Mã giảm giá [" + code + "] đã hết lượt sử dụng!");
        }
        if (v.getDonHangToiThieu() != null && tienHang.compareTo(v.getDonHangToiThieu()) < 0) {
            throw new RuntimeException("Lỗi: Đơn hàng cần đạt tối thiểu " + v.getDonHangToiThieu().longValue()
                    + "đ để dùng mã [" + code + "]!");
        }

        int pct = v.getPhanTramGiam() != null ? Math.max(0, Math.min(100, v.getPhanTramGiam())) : 0;
        BigDecimal discount = tienHang.multiply(BigDecimal.valueOf(pct)).divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN);
        if (v.getGiamToiDa() != null) {
            discount = discount.min(v.getGiamToiDa());
        }
        discount = discount.min(tienHang);

        v.setSoLuongConLai(v.getSoLuongConLai() - 1);
        voucherRepository.save(v); // @Version chống 2 người dùng cùng lúc lượt cuối
        return new VoucherResult(v, discount);
    }

    private void saveDetailsAndCollectExport(Order savedOrder, List<OrderDetailRequest> items, Long cuaHangId,
                                             List<WmsExportRequest> exports) {
        List<OrderDetail> orderDetails = new ArrayList<>();
        List<WmsExportDetailRequest> danhSachTruKho = new ArrayList<>();
        for (OrderDetailRequest item : items) {
            OrderDetail detail = new OrderDetail();
            detail.setDonHang(savedOrder);
            detail.setMaHangHoa(item.getMaHangHoa());
            detail.setTenHangHoaSnapshot(item.getTenHangHoaSnapshot());
            detail.setGiaMuaSnapshot(item.getGiaMuaSnapshot());
            detail.setSoLuong(item.getSoLuong());
            orderDetails.add(detail);

            WmsExportDetailRequest exportDetail = new WmsExportDetailRequest();
            exportDetail.setSanPhamId(item.getSanPhamId());
            exportDetail.setSoLuong(item.getSoLuong());
            exportDetail.setDonGia(item.getGiaMuaSnapshot().doubleValue());
            danhSachTruKho.add(exportDetail);
        }
        orderDetailRepository.saveAll(orderDetails);
        savedOrder.setChiTietDonHangs(orderDetails);

        WmsExportRequest wmsRequest = new WmsExportRequest();
        wmsRequest.setDonHangId(savedOrder.getMaDonHang());
        wmsRequest.setKhoHangId(cuaHangId);
        wmsRequest.setDonViVanChuyenId(1L);
        wmsRequest.setNguoiTao("Hệ thống Đơn hàng (Order Service)");
        wmsRequest.setDanhSachHangHoa(danhSachTruKho);
        exports.add(wmsRequest);
    }

    /** Chỉ gửi phiếu xuất kho sang WMS sau khi đơn hàng đã được lưu thành công (tránh phiếu xuất "mồ côi"). */
    private void sendExportNotesAfterCommit(List<WmsExportRequest> exports) {
        if (exports.isEmpty()) return;
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            exports.forEach(wmsClient::createExportNote);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                exports.forEach(wmsClient::createExportNote);
            }
        });
    }

    private Order findOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + orderId));
    }

    private void requireBuyerOrStoreOwner(Order order) {
        if (CurrentUser.isAdmin()) return;
        Long me = CurrentUser.id();
        if (me != null && me.equals(order.getNguoiDungId())) return;
        if (wmsClient.isStoreOwner(order.getCuaHangId())) return;
        throw new ForbiddenException("Từ chối truy cập: Bạn không có quyền với đơn hàng này!");
    }

    /**
     * Ghi nhận trạng thái thanh toán từ payment-service.
     * - Thành công: đơn được xác nhận.
     * - Thất bại: tự động rollback (hủy đơn CANCELLED_PAYMENT_FAILED, nhả tồn kho, hoàn voucher).
     *   Nếu tạm thời không liên lạc được kho, job định kỳ sẽ thử lại.
     */
    private void applyPaymentStatus(Order order, String paymentStatus) {
        if (isCancelled(normalize(order.getTrangThaiDonHang()))) {
            // Đơn đã hủy (VD: quá hạn) nhưng tiền lại về muộn => ghi nhận để Admin hoàn tiền cho khách
            if (isPaid(paymentStatus)) {
                order.setTrangThaiThanhToan("CHỜ HOÀN TIỀN");
                log.warn("Đơn {} đã hủy nhưng nhận được thanh toán muộn => chuyển CHỜ HOÀN TIỀN", order.getMaDonHang());
            }
            return;
        }
        order.setTrangThaiThanhToan(paymentStatus);
        if (isPaid(paymentStatus) && ST_PENDING.equals(normalize(order.getTrangThaiDonHang()))) {
            order.setTrangThaiDonHang(ST_CONFIRMED);
        } else if (FAILED_PAYMENT_STATUSES.contains(normalize(paymentStatus))
                && ST_PENDING.equals(normalize(order.getTrangThaiDonHang()))) {
            try {
                cancelAndRelease(order, ST_CANCELLED_PAYMENT_FAILED);
            } catch (RuntimeException e) {
                log.warn("Chưa rollback được đơn {} sau khi thanh toán thất bại, job định kỳ sẽ thử lại: {}",
                        order.getMaDonHang(), e.getMessage());
            }
        }
    }

    private boolean isPaid(String status) {
        return status != null && PAID_STATUSES.contains(status.toUpperCase());
    }
}
