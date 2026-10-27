package com.ctut.wms.orderservice.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    private Long nguoiDungId; // Ai đang mua hàng?
    private Long cuaHangId; // ID Shop (nếu mua từ 1 shop cụ thể)
    private String maGiaoDichGoc; // Mã phiên gom đa shop
    private String maVoucher; // Mã giảm giá (có thể để trống)
    private String phuongThucThanhToan; // VD: COD, MOMO, CRYPTO
    private String diaChiGiaoHang;
    private String soDienThoai;
    private String donViVanChuyen;
    private List<OrderDetailRequest> danhSachHang; // Danh sách các món trong giỏ
}
