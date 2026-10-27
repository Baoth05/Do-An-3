package com.ctut.wms.orderservice.service;

import com.ctut.wms.orderservice.dto.*;
import com.ctut.wms.orderservice.entity.Order;
import com.ctut.wms.orderservice.entity.OrderDetail;
import com.ctut.wms.orderservice.entity.Voucher;
import com.ctut.wms.orderservice.repository.OrderDetailRepository;
import com.ctut.wms.orderservice.repository.OrderRepository;
import com.ctut.wms.orderservice.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final RestTemplate restTemplate;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final VoucherRepository voucherRepository;

    @Transactional
    public Order placeOrder(OrderRequest request) {
        BigDecimal tongTienHang = BigDecimal.ZERO;
        for (OrderDetailRequest item : request.getDanhSachHang()) {
            BigDecimal thanhTien = item.getGiaMuaSnapshot().multiply(BigDecimal.valueOf(item.getSoLuong()));
            tongTienHang = tongTienHang.add(thanhTien);
        }

        BigDecimal tienGiamGia = BigDecimal.ZERO;
        Voucher appliedVoucher = null;

        if (request.getMaVoucher() != null && !request.getMaVoucher().isEmpty()) {
            appliedVoucher = voucherRepository.findByMaVoucher(request.getMaVoucher())
                    .orElseThrow(() -> new RuntimeException("Lỗi: Mã giảm giá không tồn tại!"));

            if (appliedVoucher.getSoLuongConLai() <= 0) {
                throw new RuntimeException("Lỗi: Mã giảm giá đã hết lượt sử dụng!");
            }
            if (appliedVoucher.getNgayHetHan() != null && appliedVoucher.getNgayHetHan().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Lỗi: Mã giảm giá đã hết hạn!");
            }
            if (appliedVoucher.getDonHangToiThieu() != null && tongTienHang.compareTo(appliedVoucher.getDonHangToiThieu()) < 0) {
                throw new RuntimeException("Lỗi: Đơn hàng chưa đạt giá trị tối thiểu để dùng mã này!");
            }

            BigDecimal mucGiamTheoPhanTram = tongTienHang.multiply(BigDecimal.valueOf(appliedVoucher.getPhanTramGiam())).divide(BigDecimal.valueOf(100));
            if (appliedVoucher.getGiamToiDa() != null && mucGiamTheoPhanTram.compareTo(appliedVoucher.getGiamToiDa()) > 0) {
                tienGiamGia = appliedVoucher.getGiamToiDa();
            } else {
                tienGiamGia = mucGiamTheoPhanTram;
            }

            appliedVoucher.setSoLuongConLai(appliedVoucher.getSoLuongConLai() - 1);
            voucherRepository.save(appliedVoucher);
        }

        BigDecimal tongThanhToan = tongTienHang.subtract(tienGiamGia);
        if (tongThanhToan.compareTo(BigDecimal.ZERO) < 0) {
            tongThanhToan = BigDecimal.ZERO;
        }

        Order order = new Order();
        order.setMaGiaoDichGoc(request.getMaGiaoDichGoc());
        order.setCuaHangId(request.getCuaHangId());
        order.setDonViVanChuyen(request.getDonViVanChuyen() != null ? request.getDonViVanChuyen() : "GHTK");
        order.setNguoiDungId(request.getNguoiDungId());
        order.setVoucher(appliedVoucher);
        order.setTongTienHang(tongTienHang);
        order.setTienGiamGia(tienGiamGia);
        order.setTongThanhToan(tongThanhToan);
        order.setPhuongThucThanhToan(request.getPhuongThucThanhToan());
        order.setDiaChiGiaoHang(request.getDiaChiGiaoHang());
        order.setSoDienThoai(request.getSoDienThoai());

        Order savedOrder = orderRepository.save(order);

        List<OrderDetail> orderDetails = new ArrayList<>();
        List<WmsExportDetailRequest> danhSachTruKho = new ArrayList<>();
        for (OrderDetailRequest item : request.getDanhSachHang()) {
            OrderDetail detail = new OrderDetail();
            detail.setDonHang(savedOrder);
            detail.setMaHangHoa(item.getMaHangHoa());
            detail.setTenHangHoaSnapshot(item.getTenHangHoaSnapshot());
            detail.setGiaMuaSnapshot(item.getGiaMuaSnapshot());
            detail.setSoLuong(item.getSoLuong());

            orderDetails.add(detail);
            if (item.getSanPhamId() != null) {
                WmsExportDetailRequest exportDetail = new WmsExportDetailRequest();
                exportDetail.setSanPhamId(item.getSanPhamId());
                exportDetail.setSoLuong(item.getSoLuong());
                danhSachTruKho.add(exportDetail);
            }
        }
        orderDetailRepository.saveAll(orderDetails);

        try {
            if (!danhSachTruKho.isEmpty()) {
                WmsExportRequest wmsRequest = new WmsExportRequest();
                wmsRequest.setDonHangId(savedOrder.getMaDonHang());
                wmsRequest.setKhoHangId(request.getCuaHangId() != null ? request.getCuaHangId() : 1L);
                wmsRequest.setDonViVanChuyenId(1L);
                wmsRequest.setNguoiTao("Hệ thống Đơn hàng (Order Service)");
                wmsRequest.setDanhSachHangHoa(danhSachTruKho);

                String wmsUrl = "http://localhost:8081/export-notes";
                restTemplate.postForEntity(wmsUrl, wmsRequest, String.class);
            }
        } catch (Exception e) {
            log.warn("Cảnh báo gửi yêu cầu xuất kho WMS: {}", e.getMessage());
        }

        savedOrder.setChiTietDonHangs(orderDetails);
        return savedOrder;
    }

    /**
     * Thuật toán Tách Đơn Tự Động (Order Splitting chuẩn Shopee Mall - B2B2C):
     * Gom nhóm giỏ hàng theo cua_hang_id, khởi tạo các bản ghi DON_HANG độc lập gắn kết qua ma_giao_dich_goc.
     */
    @Transactional
    public MultiShopCheckoutResponse checkoutMultiShop(MultiShopCheckoutRequest request) {
        String maGiaoDichGoc = "CHECKOUT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        List<Order> createdOrders = new ArrayList<>();
        BigDecimal tongTienHangGop = BigDecimal.ZERO;
        BigDecimal tongGiamGiaGop = BigDecimal.ZERO;
        BigDecimal tongThanhToanGop = BigDecimal.ZERO;

        for (MultiShopCheckoutRequest.ShopOrderBlock shopBlock : request.getShopOrders()) {
            OrderRequest singleOrderReq = new OrderRequest();
            singleOrderReq.setNguoiDungId(request.getNguoiDungId());
            singleOrderReq.setCuaHangId(shopBlock.getCuaHangId());
            singleOrderReq.setMaGiaoDichGoc(maGiaoDichGoc);
            singleOrderReq.setMaVoucher(shopBlock.getMaVoucherShop() != null ? shopBlock.getMaVoucherShop() : request.getMaVoucherToanSan());
            singleOrderReq.setPhuongThucThanhToan(request.getPhuongThucThanhToan());
            singleOrderReq.setDiaChiGiaoHang(request.getDiaChiGiaoHang());
            singleOrderReq.setSoDienThoai(request.getSoDienThoai());
            singleOrderReq.setDonViVanChuyen(shopBlock.getDonViVanChuyen() != null ? shopBlock.getDonViVanChuyen() : "GHTK");
            singleOrderReq.setDanhSachHang(shopBlock.getDanhSachHang());

            Order shopOrder = placeOrder(singleOrderReq);
            createdOrders.add(shopOrder);

            tongTienHangGop = tongTienHangGop.add(shopOrder.getTongTienHang());
            tongGiamGiaGop = tongGiamGiaGop.add(shopOrder.getTienGiamGia());
            tongThanhToanGop = tongThanhToanGop.add(shopOrder.getTongThanhToan());
        }

        return MultiShopCheckoutResponse.builder()
                .maGiaoDichGoc(maGiaoDichGoc)
                .soLuongDonHang(createdOrders.size())
                .danhSachDonHang(createdOrders)
                .tongTienHangGop(tongTienHangGop)
                .tongGiamGiaGop(tongGiamGiaGop)
                .tongThanhToanGop(tongThanhToanGop)
                .build();
    }

    public List<Order> getOrdersByUser(Long nguoiDungId) {
        return orderRepository.findByNguoiDungIdOrderByCreatedAtDesc(nguoiDungId);
    }

    public List<Order> getOrdersByStore(Long cuaHangId) {
        return orderRepository.findByCuaHangIdOrderByCreatedAtDesc(cuaHangId);
    }

    public List<Order> getOrdersByCheckoutSession(String maGiaoDichGoc) {
        return orderRepository.findByMaGiaoDichGoc(maGiaoDichGoc);
    }

    public Order getOrderByMaDonHang(String maDonHang) {
        return orderRepository.findByMaDonHang(maDonHang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + maDonHang));
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + orderId));
        order.setTrangThaiDonHang(status);
        return orderRepository.save(order);
    }

    @Transactional
    public Order updateShippingStatus(Long orderId, String shippingStatus, String donViVanChuyen) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + orderId));
        order.setTrangThaiGiaoHang(shippingStatus);
        if (donViVanChuyen != null) {
            order.setDonViVanChuyen(donViVanChuyen);
        }
        return orderRepository.save(order);
    }

    @Transactional
    public Order updatePaymentStatus(String maDonHang, String paymentStatus) {
        Order order = orderRepository.findByMaDonHang(maDonHang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + maDonHang));
        order.setTrangThaiThanhToan(paymentStatus);
        if ("ĐÃ THANH TOÁN".equalsIgnoreCase(paymentStatus) || "PAID".equalsIgnoreCase(paymentStatus) || "SUCCESS".equalsIgnoreCase(paymentStatus)) {
            order.setTrangThaiDonHang("CONFIRMED");
        }
        return orderRepository.save(order);
    }

    @Transactional
    public void updatePaymentStatusForCheckoutSession(String maGiaoDichGoc, String paymentStatus) {
        List<Order> orders = orderRepository.findByMaGiaoDichGoc(maGiaoDichGoc);
        for (Order o : orders) {
            o.setTrangThaiThanhToan(paymentStatus);
            if ("ĐÃ THANH TOÁN".equalsIgnoreCase(paymentStatus) || "PAID".equalsIgnoreCase(paymentStatus) || "SUCCESS".equalsIgnoreCase(paymentStatus)) {
                o.setTrangThaiDonHang("CONFIRMED");
            }
            orderRepository.save(o);
        }
    }

    @Transactional
    public Order cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + orderId));
        order.setTrangThaiDonHang("CANCELLED");
        return orderRepository.save(order);
    }
}
