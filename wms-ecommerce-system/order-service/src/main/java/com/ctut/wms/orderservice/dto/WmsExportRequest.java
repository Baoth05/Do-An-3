package com.ctut.wms.orderservice.dto;

import lombok.Data;
import java.util.List;

@Data
public class WmsExportRequest {
    private String donHangId;
    private Long khoHangId;
    private Long donViVanChuyenId;
    private String nguoiTao;
    private List<WmsExportDetailRequest> danhSachHangHoa;
}