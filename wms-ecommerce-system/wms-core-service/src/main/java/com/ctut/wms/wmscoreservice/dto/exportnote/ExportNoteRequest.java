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