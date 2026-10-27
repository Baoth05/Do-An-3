/**
 * ==============================================================================
 * Repository: DanhGiaRepository
 * Phân hệ: Interaction Service (Đánh giá, nhận xét & hỏi đáp - Port 8083)
 * Mô tả: Giao diện truy vấn dữ liệu Spring Data JPA thao tác với cơ sở dữ liệu cho DanhGiaRepository.
 * ==============================================================================
 */
package com.ctut.wms.interactionservice.repository;

import com.ctut.wms.interactionservice.entity.DanhGia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DanhGiaRepository extends JpaRepository<DanhGia, Long> {
    List<DanhGia> findByMaHangHoa(String maHangHoa);
    List<DanhGia> findByCuaHangId(Long cuaHangId);
}
