/**
 * ==============================================================================
 * Repository: CategoryRepository
 * Phân hệ: WMS Core Service (Quản lý kho cốt lõi & Tồn kho 2 tầng - Port 8081)
 * Mô tả: Giao diện truy vấn dữ liệu Spring Data JPA thao tác với cơ sở dữ liệu cho CategoryRepository.
 * ==============================================================================
 */
package com.ctut.wms.wmscoreservice.repository;

import com.ctut.wms.wmscoreservice.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long>{

}
