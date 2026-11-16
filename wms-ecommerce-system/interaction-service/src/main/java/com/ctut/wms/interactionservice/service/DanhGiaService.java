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
    private final com.ctut.wms.interactionservice.client.OrderClient orderClient;

    public DanhGia themDanhGia(DanhGiaRequest request) {
        com.ctut.wms.interactionservice.security.CurrentUser.requireAuthenticated();
        Long me = com.ctut.wms.interactionservice.security.CurrentUser.id();
        DanhGia danhGia = new DanhGia();
        // Người đánh giá luôn là người đang đăng nhập (không tin nguoiDungId client gửi lên)
        danhGia.setNguoiDungId(me != null ? me : request.getNguoiDungId());
        danhGia.setCuaHangId(request.getCuaHangId());
        danhGia.setMaHangHoa(request.getMaHangHoa());
        danhGia.setDonHangId(request.getDonHangId());

        if (request.getSoSao() == null || request.getSoSao() < 1 || request.getSoSao() > 5) {
            throw new IllegalArgumentException("Số sao phải nằm trong khoảng từ 1 đến 5");
        }
        danhGia.setSoSao(request.getSoSao());
        danhGia.setNoiDung(request.getNoiDung());
        // Xác minh qua order-service: chỉ gắn nhãn "Đã mua hàng" khi người dùng thực sự đã nhận sản phẩm này
        danhGia.setDaMuaHang(orderClient.hasPurchased(danhGia.getNguoiDungId(), request.getMaHangHoa()));
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
