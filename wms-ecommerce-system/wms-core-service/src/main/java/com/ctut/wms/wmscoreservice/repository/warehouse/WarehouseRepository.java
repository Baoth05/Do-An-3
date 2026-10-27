package com.ctut.wms.wmscoreservice.repository.warehouse;

import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;
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
