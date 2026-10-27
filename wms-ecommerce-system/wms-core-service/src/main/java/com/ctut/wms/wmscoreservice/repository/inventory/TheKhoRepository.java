package com.ctut.wms.wmscoreservice.repository.inventory;

import com.ctut.wms.wmscoreservice.entity.inventory.TheKho;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TheKhoRepository extends JpaRepository<TheKho, Long> {
    List<TheKho> findByKhoCuaHangIdOrderByNgayTaoDesc(Long khoCuaHangId);
    List<TheKho> findByHangHoaIdOrderByNgayTaoDesc(Long hangHoaId);
    List<TheKho> findByKhoCuaHangIdAndHangHoaIdOrderByNgayTaoDesc(Long khoCuaHangId, Long hangHoaId);
}

