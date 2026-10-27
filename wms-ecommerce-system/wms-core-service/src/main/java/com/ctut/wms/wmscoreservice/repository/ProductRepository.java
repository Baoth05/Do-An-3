/**
 * ==============================================================================
 * Repository: ProductRepository
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Giao diện truy vấn dữ liệu Spring Data JPA thao tác với cơ sở dữ liệu cho ProductRepository.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.repository;

import com.ctut.wms.wmscoreservice.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface ProductRepository extends JpaRepository<Product, Long>{
    Optional<Product> findBySku(String sku);
}
