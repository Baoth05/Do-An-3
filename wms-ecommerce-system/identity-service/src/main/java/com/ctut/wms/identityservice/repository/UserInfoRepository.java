/**
 * ==============================================================================
 * Repository: UserInfoRepository
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Giao diện truy vấn dữ liệu Spring Data JPA thao tác với cơ sở dữ liệu cho UserInfoRepository.
 * ==============================================================================
 */
package com.ctut.wms.identityservice.repository;

import com.ctut.wms.identityservice.entity.User;
import com.ctut.wms.identityservice.entity.UserInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserInfoRepository extends JpaRepository<UserInfo, Long> {
    // Tạm thời chúng ta chỉ cần các lệnh CRUD mặc định do JpaRepository cung cấp
    Optional<UserInfo> findByUser(User user);
}