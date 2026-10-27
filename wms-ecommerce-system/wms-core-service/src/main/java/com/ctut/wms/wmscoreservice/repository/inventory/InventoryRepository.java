package com.ctut.wms.wmscoreservice.repository.inventory;

import com.ctut.wms.wmscoreservice.entity.inventory.Inventory;
import com.ctut.wms.wmscoreservice.entity.product.Product;
import com.ctut.wms.wmscoreservice.entity.warehouse.Warehouse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findBySanPhamAndKhoHang(Product sanPham, Warehouse khoHang);
    List<Inventory> findByKhoHang(Warehouse khoHang);
    List<Inventory> findByKhoHangId(Long khoHangId);
    List<Inventory> findByDangBanTrueAndSoLuongThucTeGreaterThan(Integer minQty);
    Optional<Inventory> findBySanPhamIdAndKhoHangId(Long sanPhamId, Long khoHangId);
}
