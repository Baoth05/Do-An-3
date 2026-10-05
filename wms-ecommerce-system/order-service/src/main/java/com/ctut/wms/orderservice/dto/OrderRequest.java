package com.ctut.wms.orderservice.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    private Long nguoiDungId; // Ai đang mua hàng?
    private String maVoucher; // Mã giảm giá (có thể để trống)
    private String phuongThucThanhToan; // VD: COD, MOMO
    private String diaChiGiaoHang;
    private String soDienThoai;
    private List<OrderDetailRequest> danhSachHang; // Danh sách các món trong giỏ
}