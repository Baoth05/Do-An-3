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
