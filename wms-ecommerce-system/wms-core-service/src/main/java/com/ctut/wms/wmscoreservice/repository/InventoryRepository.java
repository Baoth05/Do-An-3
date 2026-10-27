package com.ctut.wms.wmscoreservice.repository;

import com.ctut.wms.wmscoreservice.entity.Inventory;
import com.ctut.wms.wmscoreservice.entity.Product;
import com.ctut.wms.wmscoreservice.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    // Tìm tồn kho theo Sản phẩm và Kho
    Optional<Inventory> findBySanPhamAndKhoHang(Product sanPham, Warehouse khoHang);

    // Lấy toàn bộ tồn kho của một kho bãi / gian hàng
    List<Inventory> findByKhoHang(Warehouse khoHang);

    // Lấy tồn kho theo ID kho hàng
    List<Inventory> findByKhoHangId(Long khoHangId);

    // Lấy các mặt hàng đang bật cờ đăng bán trên sàn và còn hàng
    List<Inventory> findByDangBanTrueAndSoLuongThucTeGreaterThan(Integer minQty);

    // Tra cứu nhanh theo ID sản phẩm và ID kho
    Optional<Inventory> findBySanPhamIdAndKhoHangId(Long sanPhamId, Long khoHangId);
}
