package com.ctut.wms.identityservice.repository;

import com.ctut.wms.identityservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Tìm kiếm người dùng dựa trên tên đăng nhập (Tài khoản)
    Optional<User> findByTaiKhoan(String taiKhoan);

    // Kiểm tra xem một email đã tồn tại trong hệ thống chưa (Trả về true/false)
    boolean existsByEmail(String email);

    // Kiểm tra xem tên tài khoản đã có người đăng ký chưa
    boolean existsByTaiKhoan(String taiKhoan);
}