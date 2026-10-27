package com.ctut.wms.interactionservice.dto;

import lombok.Data;

@Data
public class BinhLuanRequest {
    private Long nguoiDungId;
    private Long cuaHangId; // Gian hàng nơi sản phẩm được hỏi/đáp
    private String maHangHoa;
    private String noiDung;
    private Long parentId;
}
