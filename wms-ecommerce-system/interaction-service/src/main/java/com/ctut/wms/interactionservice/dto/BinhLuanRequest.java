/**
 * ==============================================================================
 * DTO (Data Transfer Object): BinhLuanRequest
 * Phân hệ: Interaction Service (Đánh giá, nhận xét & hỏi đáp - Port 8083)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API BinhLuanRequest.
 * ==============================================================================
 */
package com.ctut.wms.interactionservice.dto;

import lombok.Data;

@Data
public class BinhLuanRequest {
    private Long nguoiDungId;
    private Long cuaHangId; // Gian hàng nơi sản phẩm được hỏi/đáp
    private String maHangHoa;
    private String noiDung;
    private Long parentId;
}
