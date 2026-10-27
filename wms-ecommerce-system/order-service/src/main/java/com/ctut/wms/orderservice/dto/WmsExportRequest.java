/**
 * ==============================================================================
 * DTO (Data Transfer Object): WmsExportRequest
 * Phân hệ: Order Service (Quản lý đơn hàng & Tách đơn đa shop - Port 8082)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API WmsExportRequest.
 * ==============================================================================
 */
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