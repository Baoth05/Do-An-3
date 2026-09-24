package com.ctut.wms.wmscoreservice.dto.importnote;

import lombok.Data;
import java.util.List;

@Data
public class ImportNoteRequest {
    private Long nhaCungCapId;
    private Long khoHangId;
    private String nguoiTao; // Tên tài khoản thủ kho
    private List<ImportNoteDetailRequest> danhSachHangHoa; // Danh sách các món hàng cần nhập
}