package com.ctut.wms.interactionservice.service;

import com.ctut.wms.interactionservice.dto.BinhLuanRequest;
import com.ctut.wms.interactionservice.entity.BinhLuan;
import com.ctut.wms.interactionservice.repository.BinhLuanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BinhLuanService {

    private final BinhLuanRepository binhLuanRepository;

    public BinhLuan themBinhLuan(BinhLuanRequest request) {
        BinhLuan binhLuan = new BinhLuan();
        binhLuan.setNguoiDungId(request.getNguoiDungId());
        binhLuan.setMaHangHoa(request.getMaHangHoa());
        binhLuan.setNoiDung(request.getNoiDung());
        binhLuan.setTrangThai("ĐÃ DUYỆT"); // Tạm để "Đã duyệt" để cậu dễ test hiển thị

        // 🌟 Xử lý logic nối bình luận (Reply)
        if (request.getParentId() != null) {
            BinhLuan parent = binhLuanRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy bình luận gốc để trả lời!"));
            binhLuan.setParentComment(parent);
        }

        return binhLuanRepository.save(binhLuan);
    }

    public List<BinhLuan> layBinhLuanGoc(String maHangHoa) {
        // Trả về danh sách bình luận gốc.
        // Nhờ tính năng JPA, các câu "replies" sẽ tự động được kéo lên nằm bên trong thuộc tính "replies" của từng bình luận gốc.
        return binhLuanRepository.findByMaHangHoaAndParentCommentIsNull(maHangHoa);
    }
}