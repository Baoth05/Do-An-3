/**
 * ==============================================================================
 * DTO (Data Transfer Object): ExportNoteResponse
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API ExportNoteResponse.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.dto.exportnote;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportNoteResponse {
    private Long id;
    private String maPhieuXuat;
    private String donHangId;
    private Long khoHangId;
    private String tenKhoHang;
    private Long donViVanChuyenId;
    private String tenDonViVanChuyen;
    private String nguoiTao;
    private LocalDateTime ngayXuat;
    private String trangThai;
    private Double tongGiaTri;
    private List<ExportNoteDetailResponse> danhSachHangHoa;
}

