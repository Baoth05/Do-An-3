/**
 * ==============================================================================
 * DTO (Data Transfer Object): ImportNoteDetailRequest
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API ImportNoteDetailRequest.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.dto.importnote;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ImportNoteDetailRequest {
    private Long sanPhamId;
    private Integer soLuong;
    private BigDecimal giaNhap; // Giá mua vào từ nhà cung cấp
}