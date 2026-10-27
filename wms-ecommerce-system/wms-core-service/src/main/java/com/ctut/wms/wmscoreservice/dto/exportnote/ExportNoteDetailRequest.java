/**
 * ==============================================================================
 * DTO (Data Transfer Object): ExportNoteDetailRequest
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API ExportNoteDetailRequest.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.dto.exportnote;



import lombok.Data;

@Data
public class ExportNoteDetailRequest {
    private Long sanPhamId;
    private Integer soLuong;
}