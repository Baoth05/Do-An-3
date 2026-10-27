package com.ctut.wms.interactionservice.dto;

import lombok.Data;

@Data
public class DanhGiaRequest {
    private Long nguoiDungId;
    private Long cuaHangId; // Gian hàng nơi mua sản phẩm
    private String maHangHoa;
    private String donHangId; // ID đơn hàng người dùng đã mua
    private Integer soSao;
    private String noiDung;
}
