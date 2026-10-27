/**
 * ==============================================================================
 * DTO (Data Transfer Object): ImportNoteRequest
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API ImportNoteRequest.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.dto.importnote;

import lombok.Data;
import java.util.List;

@Data
public class ImportNoteRequest {
    private Long nhaCungCapId;
    private Long khoHangId;
    private Long donViVanChuyenId;
    private String nguoiTao;
    private List<ImportNoteDetailRequest> danhSachHangHoa;
}
