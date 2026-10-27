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
