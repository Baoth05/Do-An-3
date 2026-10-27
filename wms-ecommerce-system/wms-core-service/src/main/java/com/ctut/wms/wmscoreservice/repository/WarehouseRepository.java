/**
 * ==============================================================================
 * Repository: WarehouseRepository
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Giao diện truy vấn dữ liệu Spring Data JPA thao tác với cơ sở dữ liệu cho WarehouseRepository.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.repository;

import com.ctut.wms.wmscoreservice.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    // Tìm kho hàng dựa theo mã định danh kho
    Optional<Warehouse> findByMaKho(String maKho);
    List<Warehouse> findByLoaiHinh(String loaiHinh);
    Optional<Warehouse> findByQuanLyId(Long quanLyId);
}
