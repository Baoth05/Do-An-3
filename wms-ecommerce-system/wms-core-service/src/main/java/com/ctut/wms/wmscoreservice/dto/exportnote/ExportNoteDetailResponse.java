/**
 * ==============================================================================
 * DTO (Data Transfer Object): ExportNoteDetailResponse
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API ExportNoteDetailResponse.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.dto.exportnote;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportNoteDetailResponse {
    private Long id;
    private Long sanPhamId;
    private String sku;
    private String tenSanPham;
    private String donViTinh;
    private Integer soLuong;
    private Double donGia;
    private Double thanhTien;
}

