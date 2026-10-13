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

    // Tính năng 1: Gửi đánh giá mới
    public DanhGia themDanhGia(DanhGiaRequest request) {
        // Tương lai: Gọi sang order-service để kiểm tra xem donHangId này có thật không
        // và người dùng này đã mua maHangHoa này chưa (để set trường daMuaHang = true).
        // Tạm thời, chúng ta cứ lưu lại trước.

        DanhGia danhGia = new DanhGia();
        danhGia.setNguoiDungId(request.getNguoiDungId());
        danhGia.setMaHangHoa(request.getMaHangHoa());
        danhGia.setDonHangId(request.getDonHangId());

        // Ràng buộc số sao từ 1 đến 5
        if (request.getSoSao() < 1 || request.getSoSao() > 5) {
            throw new IllegalArgumentException("Số sao phải nằm trong khoảng từ 1 đến 5");
        }
        danhGia.setSoSao(request.getSoSao());
        danhGia.setNoiDung(request.getNoiDung());

        // Mặc định là khách chưa mua hàng, chờ gọi API xác thực sau
        danhGia.setDaMuaHang(false);
        danhGia.setTrangThai("CHỜ DUYỆT");

        return danhGiaRepository.save(danhGia);
    }

    // Tính năng 2: Lấy danh sách đánh giá của 1 sản phẩm để hiển thị lên Web
    public List<DanhGia> layDanhGiaTheoSanPham(String maHangHoa) {
        return danhGiaRepository.findByMaHangHoa(maHangHoa);
    }
}