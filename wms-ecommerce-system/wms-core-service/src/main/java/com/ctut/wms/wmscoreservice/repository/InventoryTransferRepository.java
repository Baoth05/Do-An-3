package com.ctut.wms.wmscoreservice.repository;

import com.ctut.wms.wmscoreservice.entity.InventoryTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryTransferRepository extends JpaRepository<InventoryTransfer, Long> {
    List<InventoryTransfer> findAllByOrderByNgayDieuChuyenDesc();
}

