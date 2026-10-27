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
