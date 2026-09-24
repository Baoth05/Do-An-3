package com.ctut.wms.wmscoreservice.dto.importnote;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ImportNoteDetailRequest {
    private Long sanPhamId;
    private Integer soLuong;
    private BigDecimal giaNhap; // Giá mua vào từ nhà cung cấp
}