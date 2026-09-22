package com.ctut.wms.wmscoreservice.repository;

import com.ctut.wms.wmscoreservice.entity.Inventory;
import com.ctut.wms.wmscoreservice.entity.Product;
import com.ctut.wms.wmscoreservice.entity.Warehouse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findBySanPhamAndKhoHang(Product sanPham, Warehouse khoHang);
}
