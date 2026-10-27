/**
 * ==============================================================================
 * DTO (Data Transfer Object): DanhGiaRequest
 * Phân hệ: Interaction Service (Đánh giá, nhận xét & hỏi đáp - Port 8083)
 * Mô tả: Đối tượng truyền tải dữ liệu đóng gói thông tin đầu vào/đầu ra cho API DanhGiaRequest.
 * ==============================================================================
 */
package com.ctut.wms.interactionservice.dto;

import lombok.Data;

@Data
public class DanhGiaRequest {
    private Long nguoiDungId;
    private Long cuaHangId; // Gian hàng nơi mua sản phẩm
    private String maHangHoa;
    private String donHangId; // ID đơn hàng người dùng đã mua
    private Integer soSao;
    private String noiDung;
}
