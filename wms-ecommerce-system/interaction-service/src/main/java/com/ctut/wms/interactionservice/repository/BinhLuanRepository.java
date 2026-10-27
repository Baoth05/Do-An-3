/**
 * ==============================================================================
 * Repository: BinhLuanRepository
 * Phân hệ: Interaction Service (Đánh giá, nhận xét & hỏi đáp - Port 8083)
 * Mô tả: Giao diện truy vấn dữ liệu Spring Data JPA thao tác với cơ sở dữ liệu cho BinhLuanRepository.
 * ==============================================================================
 */
package com.ctut.wms.interactionservice.repository;

import com.ctut.wms.interactionservice.entity.BinhLuan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BinhLuanRepository extends JpaRepository<BinhLuan, Long> {
    List<BinhLuan> findByMaHangHoaAndParentCommentIsNull(String maHangHoa);
    List<BinhLuan> findByCuaHangIdAndParentCommentIsNull(Long cuaHangId);
}
