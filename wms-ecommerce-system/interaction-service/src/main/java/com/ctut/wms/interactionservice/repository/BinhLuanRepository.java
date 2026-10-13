package com.ctut.wms.interactionservice.repository;

import com.ctut.wms.interactionservice.entity.BinhLuan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BinhLuanRepository extends JpaRepository<BinhLuan, Long> {
    // Chỉ lấy các bình luận gốc (parentComment bị null),
    // tránh lấy trùng lặp các câu trả lời (replies) vì chúng đã nằm bên trong bình luận gốc rồi.
    List<BinhLuan> findByMaHangHoaAndParentCommentIsNull(String maHangHoa);
}