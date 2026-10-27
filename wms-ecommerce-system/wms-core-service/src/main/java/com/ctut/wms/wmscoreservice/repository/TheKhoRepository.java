/**
 * ==============================================================================
 * Repository: TheKhoRepository
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Giao diện truy vấn dữ liệu Spring Data JPA thao tác với cơ sở dữ liệu cho TheKhoRepository.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.repository;

import com.ctut.wms.wmscoreservice.entity.TheKho;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TheKhoRepository extends JpaRepository<TheKho, Long> {
    List<TheKho> findByKhoCuaHangIdOrderByNgayTaoDesc(Long khoCuaHangId);
    List<TheKho> findByHangHoaIdOrderByNgayTaoDesc(Long hangHoaId);
    List<TheKho> findByKhoCuaHangIdAndHangHoaIdOrderByNgayTaoDesc(Long khoCuaHangId, Long hangHoaId);
}

