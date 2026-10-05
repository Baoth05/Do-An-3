package com.ctut.wms.orderservice.service;

import com.ctut.wms.orderservice.dto.OrderDetailRequest;
import com.ctut.wms.orderservice.dto.OrderRequest;
import com.ctut.wms.orderservice.dto.WmsExportDetailRequest;
import com.ctut.wms.orderservice.dto.WmsExportRequest;
import com.ctut.wms.orderservice.entity.Order;
import com.ctut.wms.orderservice.entity.OrderDetail;
import com.ctut.wms.orderservice.entity.Voucher;
import com.ctut.wms.orderservice.repository.OrderDetailRepository;
import com.ctut.wms.orderservice.repository.OrderRepository;
import com.ctut.wms.orderservice.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final RestTemplate restTemplate;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final VoucherRepository voucherRepository;

    @Transactional // Đảm bảo an toàn dữ liệu, nếu lỗi thì hoàn tác toàn bộ
    public Order placeOrder(OrderRequest request) {

        // 1. Tính tổng tiền hàng (Chưa tính giảm giá)
        BigDecimal tongTienHang = BigDecimal.ZERO;
        for (OrderDetailRequest item : request.getDanhSachHang()) {
            BigDecimal thanhTien = item.getGiaMuaSnapshot().multiply(BigDecimal.valueOf(item.getSoLuong()));
            tongTienHang = tongTienHang.add(thanhTien);
        }

        // 2. Xử lý Voucher (Nếu người dùng có nhập mã)
        BigDecimal tienGiamGia = BigDecimal.ZERO;
        Voucher appliedVoucher = null;

        if (request.getMaVoucher() != null && !request.getMaVoucher().isEmpty()) {
            appliedVoucher = voucherRepository.findByMaVoucher(request.getMaVoucher())
                    .orElseThrow(() -> new RuntimeException("Lỗi: Mã giảm giá không tồn tại!"));

            // Kiểm tra tính hợp lệ của Voucher
            if (appliedVoucher.getSoLuongConLai() <= 0) {
                throw new RuntimeException("Lỗi: Mã giảm giá đã hết lượt sử dụng!");
            }
            if (appliedVoucher.getNgayHetHan().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Lỗi: Mã giảm giá đã hết hạn!");
            }
            if (tongTienHang.compareTo(appliedVoucher.getDonHangToiThieu()) < 0) {
                throw new RuntimeException("Lỗi: Đơn hàng chưa đạt giá trị tối thiểu để dùng mã này!");
            }

            // Tính tiền được giảm
            BigDecimal mucGiamTheoPhanTram = tongTienHang.multiply(BigDecimal.valueOf(appliedVoucher.getPhanTramGiam())).divide(BigDecimal.valueOf(100));

            // So sánh với mức giảm tối đa cho phép
            if (mucGiamTheoPhanTram.compareTo(appliedVoucher.getGiamToiDa()) > 0) {
                tienGiamGia = appliedVoucher.getGiamToiDa();
            } else {
                tienGiamGia = mucGiamTheoPhanTram;
            }

            // Trừ đi 1 lượt sử dụng của Voucher
            appliedVoucher.setSoLuongConLai(appliedVoucher.getSoLuongConLai() - 1);
            voucherRepository.save(appliedVoucher);
        }

        // 3. Tính toán tổng thanh toán cuối cùng
        BigDecimal tongThanhToan = tongTienHang.subtract(tienGiamGia);
        if (tongThanhToan.compareTo(BigDecimal.ZERO) < 0) {
            tongThanhToan = BigDecimal.ZERO;
        }

        // 4. Khởi tạo đối tượng Đơn Hàng (Order)
        Order order = new Order();
        order.setNguoiDungId(request.getNguoiDungId());
        order.setVoucher(appliedVoucher);
        order.setTongTienHang(tongTienHang);
        order.setTienGiamGia(tienGiamGia);
        order.setTongThanhToan(tongThanhToan);
        order.setPhuongThucThanhToan(request.getPhuongThucThanhToan());
        order.setDiaChiGiaoHang(request.getDiaChiGiaoHang());
        order.setSoDienThoai(request.getSoDienThoai());

        // Lưu khung đơn hàng trước để lấy ID
        Order savedOrder = orderRepository.save(order);

        // 5. Lưu các Chi tiết Đơn hàng
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
            WmsExportDetailRequest exportDetail = new WmsExportDetailRequest();
            exportDetail.setSanPhamId(item.getSanPhamId()); // Yêu cầu Frontend gửi thêm sanPhamId
            exportDetail.setSoLuong(item.getSoLuong());
            danhSachTruKho.add(exportDetail);
        }
        orderDetailRepository.saveAll(orderDetails);
        try {
            WmsExportRequest wmsRequest = new WmsExportRequest();
            wmsRequest.setDonHangId(savedOrder.getMaDonHang());
            wmsRequest.setKhoHangId(1L); // Tạm fix cứng ID kho hàng xuất đi là 1
            wmsRequest.setDonViVanChuyenId(1L); // Tạm fix cứng ID đơn vị giao hàng là 1
            wmsRequest.setNguoiTao("Hệ thống Đơn hàng (Order Service)");
            wmsRequest.setDanhSachHangHoa(danhSachTruKho);

            // Gửi lệnh POST sang module wms-core-service chạy ở cổng 8081
            String wmsUrl = "http://localhost:8081/export-notes";
            ResponseEntity<String> response = restTemplate.postForEntity(wmsUrl, wmsRequest, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Lỗi từ kho hàng: " + response.getBody());
            }
        } catch (Exception e) {
            // Nếu gọi WMS lỗi (như hết hàng, sai ID), báo lỗi ngay để hủy (Rollback) toàn bộ quá trình đặt hàng
            throw new RuntimeException("Quá trình trừ kho thất bại! Đơn hàng đã bị hủy. Chi tiết: " + e.getMessage());
        }

        savedOrder.setChiTietDonHangs(orderDetails);
        return savedOrder;
    }

}