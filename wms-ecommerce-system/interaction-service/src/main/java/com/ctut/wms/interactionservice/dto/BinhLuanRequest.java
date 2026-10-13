package com.ctut.wms.interactionservice.dto;

import lombok.Data;

@Data
public class BinhLuanRequest {
    private Long nguoiDungId;
    private String maHangHoa;
    private String noiDung;

    // Nếu đây là câu trả lời, FE sẽ gửi ID của bình luận bị trả lời vào đây.
    // Nếu là bình luận mới tinh, tham số này sẽ để trống (null).
    private Long parentId;
}