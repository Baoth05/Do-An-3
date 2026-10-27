/**
 * ==============================================================================
 * Service: BinhLuanService
 * Phân hệ: Interaction Service (Đánh giá, nhận xét & hỏi đáp - Port 8083)
 * Mô tả: Cung cấp logic nghiệp vụ, giao dịch cơ sở dữ liệu và xử lý dữ liệu cho BinhLuanService.
 * ==============================================================================
 */
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
        binhLuan.setCuaHangId(request.getCuaHangId());
        binhLuan.setMaHangHoa(request.getMaHangHoa());
        binhLuan.setNoiDung(request.getNoiDung());
        binhLuan.setTrangThai("ĐÃ DUYỆT");

        if (request.getParentId() != null) {
            BinhLuan parent = binhLuanRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy bình luận gốc để trả lời!"));
            binhLuan.setParentComment(parent);
        }

        return binhLuanRepository.save(binhLuan);
    }

    public List<BinhLuan> layBinhLuanGoc(String maHangHoa) {
        return binhLuanRepository.findByMaHangHoaAndParentCommentIsNull(maHangHoa);
    }

    public List<BinhLuan> layBinhLuanTheoShop(Long cuaHangId) {
        return binhLuanRepository.findByCuaHangIdAndParentCommentIsNull(cuaHangId);
    }
}
