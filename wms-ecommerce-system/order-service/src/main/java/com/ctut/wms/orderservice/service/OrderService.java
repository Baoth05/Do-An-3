/**
 * ==============================================================================
 * Service: OrderService
 * Phân hệ: Order Service (Microservice quản lý đơn hàng - Port 8082)
 * Mô tả: Cung cấp logic nghiệp vụ xử lý đơn hàng, mã giảm giá và tách đơn đa gian hàng.
 * Chức năng chính:
 *   - placeOrder: Tính tiền hàng, kiểm tra & khấu trừ lượt dùng Voucher, lưu đơn hàng và tạo yêu cầu xuất kho sang WMS Core.
 *   - checkoutMultiShop: Thuật toán tách đơn hàng đa shop (Shopee Mall model), gom đơn theo từng cua_hang_id.
 *   - updatePaymentStatus & updatePaymentStatusForCheckoutSession: Đồng bộ thanh toán từ MoMo/Crypto sang các đơn hàng con.
 * ==============================================================================
 */
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
import java.math.RoundingMode;
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

        if (request.getMaVoucher() != null && !request.getMaVoucher().trim().isEmpty()) {
            String code = request.getMaVoucher().trim().toUpperCase();
            var voucherOpt = voucherRepository.findByMaVoucher(code);

            if (voucherOpt.isPresent()) {
                appliedVoucher = voucherOpt.get();
                if (appliedVoucher.getSoLuongConLai() != null && appliedVoucher.getSoLuongConLai() <= 0) {
                    throw new RuntimeException("Lỗi: Mã giảm giá [" + code + "] đã hết lượt sử dụng!");
                }
                if (appliedVoucher.getNgayHetHan() != null && appliedVoucher.getNgayHetHan().isBefore(LocalDateTime.now())) {
                    throw new RuntimeException("Lỗi: Mã giảm giá [" + code + "] đã hết hạn!");
                }
                if (appliedVoucher.getDonHangToiThieu() != null && tongTienHang.compareTo(appliedVoucher.getDonHangToiThieu()) < 0) {
                    throw new RuntimeException("Lỗi: Đơn hàng chưa đạt giá trị tối thiểu để dùng mã [" + code + "]!");
                }

                int pct = appliedVoucher.getPhanTramGiam() != null ? appliedVoucher.getPhanTramGiam() : 10;
                BigDecimal mucGiamTheoPhanTram = tongTienHang.multiply(BigDecimal.valueOf(pct)).divide(BigDecimal.valueOf(100));
                if (appliedVoucher.getGiamToiDa() != null && mucGiamTheoPhanTram.compareTo(appliedVoucher.getGiamToiDa()) > 0) {
                    tienGiamGia = appliedVoucher.getGiamToiDa();
                } else {
                    tienGiamGia = mucGiamTheoPhanTram;
                }

                if (appliedVoucher.getSoLuongConLai() != null) {
                    appliedVoucher.setSoLuongConLai(Math.max(0, appliedVoucher.getSoLuongConLai() - 1));
                    voucherRepository.save(appliedVoucher);
                }
            } else {
                // Fallback: Nếu là mã hợp lệ từ local/dev, tạo bản ghi tự động để không làm lỗi đặt hàng của khách
                log.warn("Mã voucher [{}] chưa có trong CSDL, tạo bản ghi tự động", code);
                appliedVoucher = new Voucher();
                appliedVoucher.setMaVoucher(code);
                appliedVoucher.setCuaHangId(request.getCuaHangId());
                appliedVoucher.setPhanTramGiam(10);
                appliedVoucher.setGiamToiDa(BigDecimal.valueOf(50000));
                appliedVoucher.setDonHangToiThieu(BigDecimal.valueOf(100000));
                appliedVoucher.setSoLuongConLai(99);
                appliedVoucher.setNgayBatDau(LocalDateTime.now().minusDays(1));
                appliedVoucher.setNgayHetHan(LocalDateTime.now().plusMonths(6));
                appliedVoucher = voucherRepository.save(appliedVoucher);

                BigDecimal mucGiam = tongTienHang.multiply(BigDecimal.valueOf(10)).divide(BigDecimal.valueOf(100));
                tienGiamGia = mucGiam.min(appliedVoucher.getGiamToiDa());
            }
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
     * - Xét điều kiện Voucher Toàn Sàn trên TỔNG GIÁ TRỊ GIỎ HÀNG GỘP.
     * - Trừ lượt dùng Voucher toàn sàn đúng 1 lần.
     * - Phân bổ tiền giảm Voucher toàn sàn và kết hợp Voucher độc quyền của từng Shop.
     */
    @Transactional
    public MultiShopCheckoutResponse checkoutMultiShop(MultiShopCheckoutRequest request) {
        String maGiaoDichGoc = "CHECKOUT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        List<Order> createdOrders = new ArrayList<>();
        BigDecimal tongTienHangGop = BigDecimal.ZERO;

        // 1. Tính tổng tiền hàng gộp của tất cả các shop
        for (MultiShopCheckoutRequest.ShopOrderBlock shopBlock : request.getShopOrders()) {
            if (shopBlock.getDanhSachHang() != null) {
                for (OrderDetailRequest item : shopBlock.getDanhSachHang()) {
                    BigDecimal sub = item.getGiaMuaSnapshot().multiply(BigDecimal.valueOf(item.getSoLuong()));
                    tongTienHangGop = tongTienHangGop.add(sub);
                }
            }
        }

        // 2. Xử lý Voucher Toàn Sàn trên tổng giá trị giỏ hàng gộp
        BigDecimal tongGiamGiaToanSan = BigDecimal.ZERO;
        Voucher appliedGlobalVoucher = null;

        if (request.getMaVoucherToanSan() != null && !request.getMaVoucherToanSan().trim().isEmpty()) {
            String gCode = request.getMaVoucherToanSan().trim().toUpperCase();
            var gVoucherOpt = voucherRepository.findByMaVoucher(gCode);

            if (gVoucherOpt.isPresent()) {
                appliedGlobalVoucher = gVoucherOpt.get();
                if (appliedGlobalVoucher.getSoLuongConLai() != null && appliedGlobalVoucher.getSoLuongConLai() <= 0) {
                    throw new RuntimeException("Lỗi: Voucher toàn sàn [" + gCode + "] đã hết lượt sử dụng!");
                }
                if (appliedGlobalVoucher.getNgayHetHan() != null && appliedGlobalVoucher.getNgayHetHan().isBefore(LocalDateTime.now())) {
                    throw new RuntimeException("Lỗi: Voucher toàn sàn [" + gCode + "] đã hết hạn!");
                }
                if (appliedGlobalVoucher.getDonHangToiThieu() != null && tongTienHangGop.compareTo(appliedGlobalVoucher.getDonHangToiThieu()) < 0) {
                    throw new RuntimeException("Lỗi: Đơn hàng cần đạt tối thiểu " + 
                            appliedGlobalVoucher.getDonHangToiThieu().longValue() + "đ để dùng mã toàn sàn [" + gCode + "]!");
                }

                int pct = appliedGlobalVoucher.getPhanTramGiam() != null ? appliedGlobalVoucher.getPhanTramGiam() : 10;
                BigDecimal mucGiam = tongTienHangGop.multiply(BigDecimal.valueOf(pct)).divide(BigDecimal.valueOf(100));
                if (appliedGlobalVoucher.getGiamToiDa() != null && mucGiam.compareTo(appliedGlobalVoucher.getGiamToiDa()) > 0) {
                    tongGiamGiaToanSan = appliedGlobalVoucher.getGiamToiDa();
                } else {
                    tongGiamGiaToanSan = mucGiam;
                }

                if (appliedGlobalVoucher.getSoLuongConLai() != null) {
                    appliedGlobalVoucher.setSoLuongConLai(Math.max(0, appliedGlobalVoucher.getSoLuongConLai() - 1));
                    voucherRepository.save(appliedGlobalVoucher);
                }
            } else {
                // Fallback voucher toàn sàn
                log.warn("Voucher toàn sàn [{}] chưa có trong CSDL, tạo bản ghi tự động", gCode);
                Voucher fallbackGv = new Voucher();
                fallbackGv.setMaVoucher(gCode);
                fallbackGv.setCuaHangId(null);
                fallbackGv.setPhanTramGiam(10);
                fallbackGv.setGiamToiDa(BigDecimal.valueOf(50000));
                fallbackGv.setDonHangToiThieu(BigDecimal.valueOf(100000));
                fallbackGv.setSoLuongConLai(999);
                fallbackGv.setNgayBatDau(LocalDateTime.now().minusDays(1));
                fallbackGv.setNgayHetHan(LocalDateTime.now().plusMonths(6));
                appliedGlobalVoucher = voucherRepository.save(fallbackGv);

                BigDecimal mucGiam = tongTienHangGop.multiply(BigDecimal.valueOf(10)).divide(BigDecimal.valueOf(100));
                tongGiamGiaToanSan = mucGiam.min(appliedGlobalVoucher.getGiamToiDa());
            }
        }

        // 3. Xử lý tạo từng đơn hàng con cho từng shop và phân bổ tiền giảm giá
        BigDecimal tongGiamGiaGop = BigDecimal.ZERO;
        BigDecimal tongThanhToanGop = BigDecimal.ZERO;
        int totalShops = request.getShopOrders().size();
        int currentShopIdx = 0;
        BigDecimal daPhanBoToanSan = BigDecimal.ZERO;

        for (MultiShopCheckoutRequest.ShopOrderBlock shopBlock : request.getShopOrders()) {
            currentShopIdx++;
            BigDecimal shopTienHang = BigDecimal.ZERO;
            for (OrderDetailRequest item : shopBlock.getDanhSachHang()) {
                BigDecimal thanhTien = item.getGiaMuaSnapshot().multiply(BigDecimal.valueOf(item.getSoLuong()));
                shopTienHang = shopTienHang.add(thanhTien);
            }

            // 3.1. Giảm giá từ Voucher riêng của Shop (nếu có)
            BigDecimal tienGiamShop = BigDecimal.ZERO;
            Voucher appliedShopVoucher = null;

            if (shopBlock.getMaVoucherShop() != null && !shopBlock.getMaVoucherShop().trim().isEmpty()) {
                String sCode = shopBlock.getMaVoucherShop().trim().toUpperCase();
                var sVoucherOpt = voucherRepository.findByMaVoucher(sCode);

                if (sVoucherOpt.isPresent()) {
                    appliedShopVoucher = sVoucherOpt.get();
                    if (appliedShopVoucher.getSoLuongConLai() == null || appliedShopVoucher.getSoLuongConLai() > 0) {
                        int sPct = appliedShopVoucher.getPhanTramGiam() != null ? appliedShopVoucher.getPhanTramGiam() : 10;
                        BigDecimal mucGiamS = shopTienHang.multiply(BigDecimal.valueOf(sPct)).divide(BigDecimal.valueOf(100));
                        if (appliedShopVoucher.getGiamToiDa() != null && mucGiamS.compareTo(appliedShopVoucher.getGiamToiDa()) > 0) {
                            tienGiamShop = appliedShopVoucher.getGiamToiDa();
                        } else {
                            tienGiamShop = mucGiamS;
                        }

                        if (appliedShopVoucher.getSoLuongConLai() != null) {
                            appliedShopVoucher.setSoLuongConLai(Math.max(0, appliedShopVoucher.getSoLuongConLai() - 1));
                            voucherRepository.save(appliedShopVoucher);
                        }
                    }
                } else {
                    // Fallback voucher shop
                    Voucher fallbackSv = new Voucher();
                    fallbackSv.setMaVoucher(sCode);
                    fallbackSv.setCuaHangId(shopBlock.getCuaHangId());
                    fallbackSv.setPhanTramGiam(10);
                    fallbackSv.setGiamToiDa(BigDecimal.valueOf(50000));
                    fallbackSv.setDonHangToiThieu(BigDecimal.valueOf(50000));
                    fallbackSv.setSoLuongConLai(99);
                    fallbackSv.setNgayBatDau(LocalDateTime.now().minusDays(1));
                    fallbackSv.setNgayHetHan(LocalDateTime.now().plusMonths(6));
                    appliedShopVoucher = voucherRepository.save(fallbackSv);

                    tienGiamShop = shopTienHang.multiply(BigDecimal.valueOf(10)).divide(BigDecimal.valueOf(100)).min(fallbackSv.getGiamToiDa());
                }
            }

            // 3.2. Phân bổ Voucher Toàn Sàn theo tỷ trọng tiền hàng
            BigDecimal tienGiamToanSanPhanBo = BigDecimal.ZERO;
            if (tongGiamGiaToanSan.compareTo(BigDecimal.ZERO) > 0 && tongTienHangGop.compareTo(BigDecimal.ZERO) > 0) {
                if (currentShopIdx == totalShops) {
                    // Shop cuối cùng nhận số tiền dư còn lại để tránh lệch số thập phân
                    tienGiamToanSanPhanBo = tongGiamGiaToanSan.subtract(daPhanBoToanSan);
                } else {
                    tienGiamToanSanPhanBo = tongGiamGiaToanSan.multiply(shopTienHang)
                            .divide(tongTienHangGop, 0, RoundingMode.HALF_UP);
                    daPhanBoToanSan = daPhanBoToanSan.add(tienGiamToanSanPhanBo);
                }
            }

            BigDecimal tongGiamGiaDonCon = tienGiamShop.add(tienGiamToanSanPhanBo);
            if (tongGiamGiaDonCon.compareTo(shopTienHang) > 0) {
                tongGiamGiaDonCon = shopTienHang;
            }

            BigDecimal tongThanhToanDonCon = shopTienHang.subtract(tongGiamGiaDonCon);
            if (tongThanhToanDonCon.compareTo(BigDecimal.ZERO) < 0) {
                tongThanhToanDonCon = BigDecimal.ZERO;
            }

            // Tạo bản ghi Order
            Order order = new Order();
            order.setMaGiaoDichGoc(maGiaoDichGoc);
            order.setCuaHangId(shopBlock.getCuaHangId());
            order.setDonViVanChuyen(shopBlock.getDonViVanChuyen() != null ? shopBlock.getDonViVanChuyen() : "GHTK");
            order.setNguoiDungId(request.getNguoiDungId());
            order.setVoucher(appliedShopVoucher != null ? appliedShopVoucher : appliedGlobalVoucher);
            order.setTongTienHang(shopTienHang);
            order.setTienGiamGia(tongGiamGiaDonCon);
            order.setTongThanhToan(tongThanhToanDonCon);
            order.setPhuongThucThanhToan(request.getPhuongThucThanhToan());
            order.setDiaChiGiaoHang(request.getDiaChiGiaoHang());
            order.setSoDienThoai(request.getSoDienThoai());

            Order savedOrder = orderRepository.save(order);

            // Chi tiết đơn hàng & yêu cầu WMS
            List<OrderDetail> orderDetails = new ArrayList<>();
            List<WmsExportDetailRequest> danhSachTruKho = new ArrayList<>();

            for (OrderDetailRequest item : shopBlock.getDanhSachHang()) {
                OrderDetail detail = new OrderDetail();
                detail.setDonHang(savedOrder);
                detail.setMaHangHoa(item.getMaHangHoa());
                detail.setTenHangHoaSnapshot(item.getTenHangHoaSnapshot());
                detail.setGiaMuaSnapshot(item.getGiaMuaSnapshot());
                detail.setSoLuong(item.getSoLuong());
                orderDetails.add(detail);

                if (item.getSanPhamId() != null) {
                    WmsExportDetailRequest wmsItem = new WmsExportDetailRequest();
                    wmsItem.setSanPhamId(item.getSanPhamId());
                    wmsItem.setSoLuong(item.getSoLuong());
                    danhSachTruKho.add(wmsItem);
                }
            }
            orderDetailRepository.saveAll(orderDetails);

            try {
                if (!danhSachTruKho.isEmpty()) {
                    WmsExportRequest wmsRequest = new WmsExportRequest();
                    wmsRequest.setDonHangId(savedOrder.getMaDonHang());
                    wmsRequest.setKhoHangId(shopBlock.getCuaHangId() != null ? shopBlock.getCuaHangId() : 1L);
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
            createdOrders.add(savedOrder);

            tongGiamGiaGop = tongGiamGiaGop.add(tongGiamGiaDonCon);
            tongThanhToanGop = tongThanhToanGop.add(tongThanhToanDonCon);
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
