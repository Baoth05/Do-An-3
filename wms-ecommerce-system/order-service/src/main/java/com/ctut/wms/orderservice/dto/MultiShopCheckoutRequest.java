package com.ctut.wms.orderservice.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class MultiShopCheckoutRequest {
    private Long nguoiDungId;
    private String diaChiGiaoHang;
    private String soDienThoai;
    private String phuongThucThanhToan; // MOMO, CRYPTO, COD
    private String maVoucherToanSan; // Voucher toàn sàn do Admin tạo (nếu có)
    private List<ShopOrderBlock> shopOrders; // Gom theo từng shop

    @Data
    public static class ShopOrderBlock {
        private Long cuaHangId;
        private String tenShop;
        private String maVoucherShop; // Voucher riêng của shop (nếu có)
        private String donViVanChuyen;
        private List<OrderDetailRequest> danhSachHang;
    }
}

