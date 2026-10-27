/**
 * ==============================================================================
 * Cấu Hình (Configuration): RoleInitializer
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Lớp cấu hình hệ thống, bảo mật hoặc thiết lập các Spring Bean cho Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084).
 * ==============================================================================
 */
package com.ctut.wms.identityservice.config;

import com.ctut.wms.identityservice.entity.Role;
import com.ctut.wms.identityservice.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoleInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        // Khởi tạo các vai trò chuẩn theo tài liệu V2.0 (B2B2C Sàn Tập Trung & Kho 2 Tầng)
        initRoleIfNotExists("ADMIN", "Quản trị viên");
        initRoleIfNotExists("STORE_OWNER", "Chủ cửa hàng");
        initRoleIfNotExists("WAREHOUSE_MANAGER", "Thủ kho trung tâm");
        initRoleIfNotExists("WAREHOUSE_STAFF", "Nhân viên kho vận");
        initRoleIfNotExists("CUSTOMER", "Khách hàng");
        // Giữ tương thích ngược cho mã vai trò cũ nếu có
        initRoleIfNotExists("THUKHO", "Thủ kho");
        initRoleIfNotExists("NVKHO", "Nhân viên kho");
    }

    private void initRoleIfNotExists(String maVaiTro, String tenVaiTro) {
        if (!roleRepository.existsByMaVaiTro(maVaiTro)) {
            Role role = new Role();
            role.setMaVaiTro(maVaiTro);
            role.setTenVaiTro(tenVaiTro);
            roleRepository.save(role);
            log.info("-> Đã khởi tạo vai trò: {} ({})", maVaiTro, tenVaiTro);
        }
    }
}
