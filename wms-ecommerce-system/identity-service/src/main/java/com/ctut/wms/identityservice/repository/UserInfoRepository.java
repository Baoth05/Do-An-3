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