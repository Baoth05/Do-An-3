/**
 * ==============================================================================
 * Repository: RoleRepository
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Giao diện truy vấn dữ liệu Spring Data JPA thao tác với cơ sở dữ liệu cho RoleRepository.
 * ==============================================================================
 */
package com.ctut.wms.identityservice.repository;

import com.ctut.wms.identityservice.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    // Spring Boot sẽ tự động dịch tên hàm này thành câu lệnh SQL:
    // SELECT * FROM vai_tro WHERE ma_vai_tro = ?
    Optional<Role> findByMaVaiTro(String maVaiTro);
    boolean existsByMaVaiTro(String maVaiTro);
}