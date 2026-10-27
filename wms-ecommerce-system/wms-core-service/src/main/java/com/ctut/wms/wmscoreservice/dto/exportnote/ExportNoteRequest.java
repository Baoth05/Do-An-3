/**
 * ==============================================================================
 * DTO (Data Transfer Object): ExportNoteRequest
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API ExportNoteRequest.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.dto.exportnote;

import lombok.Data;

import java.util.List;

@Data
public class ExportNoteRequest {
    private String donHangId; // Mã đơn hàng từ E-commerce truyền sang (có thể để trống nếu xuất hủy)
    private Long khoHangId;
    private Long donViVanChuyenId;
    private String nguoiTao;
    private List<ExportNoteDetailRequest> danhSachHangHoa;
}