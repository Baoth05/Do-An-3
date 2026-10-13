package com.ctut.wms.interactionservice.repository;

import com.ctut.wms.interactionservice.entity.DanhGia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DanhGiaRepository extends JpaRepository<DanhGia, Long> {
    // Hàm tìm tất cả đánh giá của một sản phẩm cụ thể
    List<DanhGia> findByMaHangHoa(String maHangHoa);
}