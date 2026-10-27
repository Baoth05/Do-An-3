/**
 * ==============================================================================
 * Service: DanhGiaService
 * Phân hệ: Interaction Service (Đánh giá, nhận xét & hỏi đáp - Port 8083)
 * Mô tả: Cung cấp logic nghiệp vụ, giao dịch cơ sở dữ liệu và xử lý dữ liệu cho DanhGiaService.
 * ==============================================================================
 */
package com.ctut.wms.interactionservice.service;

import com.ctut.wms.interactionservice.dto.DanhGiaRequest;
import com.ctut.wms.interactionservice.entity.DanhGia;
import com.ctut.wms.interactionservice.repository.DanhGiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DanhGiaService {

    private final DanhGiaRepository danhGiaRepository;

    public DanhGia themDanhGia(DanhGiaRequest request) {
        DanhGia danhGia = new DanhGia();
        danhGia.setNguoiDungId(request.getNguoiDungId());
        danhGia.setCuaHangId(request.getCuaHangId());
        danhGia.setMaHangHoa(request.getMaHangHoa());
        danhGia.setDonHangId(request.getDonHangId());

        if (request.getSoSao() < 1 || request.getSoSao() > 5) {
            throw new IllegalArgumentException("Số sao phải nằm trong khoảng từ 1 đến 5");
        }
        danhGia.setSoSao(request.getSoSao());
        danhGia.setNoiDung(request.getNoiDung());
        danhGia.setDaMuaHang(true); // Ghi nhận khách mua hàng thật
        danhGia.setTrangThai("ĐÃ DUYỆT");

        return danhGiaRepository.save(danhGia);
    }

    public List<DanhGia> layDanhGiaTheoSanPham(String maHangHoa) {
        return danhGiaRepository.findByMaHangHoa(maHangHoa);
    }

    public List<DanhGia> layDanhGiaTheoShop(Long cuaHangId) {
        return danhGiaRepository.findByCuaHangId(cuaHangId);
    }
}
