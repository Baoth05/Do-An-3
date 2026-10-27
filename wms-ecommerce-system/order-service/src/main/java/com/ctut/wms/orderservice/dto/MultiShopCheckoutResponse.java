package com.ctut.wms.orderservice.dto;

import com.ctut.wms.orderservice.entity.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MultiShopCheckoutResponse {
    private String maGiaoDichGoc; // Mã phiên Checkout chung
    private BigDecimal tongTienHangGop;
    private BigDecimal tongGiamGiaGop;
    private BigDecimal tongThanhToanGop; // Tổng số tiền khách cần thanh toán 1 lần
    private Integer soLuongDonHang; // Số lượng đơn hàng được tách
    private List<Order> danhSachDonHang; // Chi tiết từng đơn hàng thuộc từng Shop
}

