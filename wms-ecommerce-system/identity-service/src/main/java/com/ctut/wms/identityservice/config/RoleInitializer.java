/**
 * ==============================================================================
 * Cấu Hình (Configuration): RoleInitializer
 * Phân hệ: Identity Service (Quản lý định danh & Phân quyền RBAC - Port 8084)
 * Mô tả: Khởi tạo các vai trò chuẩn và tài khoản mặc định phục vụ vận hành & kiểm thử
 * ==============================================================================
 */
package com.ctut.wms.identityservice.config;

import com.ctut.wms.identityservice.entity.Role;
import com.ctut.wms.identityservice.entity.User;
import com.ctut.wms.identityservice.entity.UserInfo;
import com.ctut.wms.identityservice.repository.RoleRepository;
import com.ctut.wms.identityservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoleInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 1. Khởi tạo các vai trò chuẩn theo kiến trúc B2B2C Sàn Tập Trung & Kho 2 Tầng
        initRoleIfNotExists("ADMIN", "Quản trị viên");
        initRoleIfNotExists("STORE_OWNER", "Chủ cửa hàng");
        initRoleIfNotExists("WAREHOUSE_MANAGER", "Thủ kho trung tâm");
        initRoleIfNotExists("WAREHOUSE_STAFF", "Nhân viên kho vận");
        initRoleIfNotExists("CUSTOMER", "Khách hàng");
        initRoleIfNotExists("THUKHO", "Thủ kho");
        initRoleIfNotExists("NVKHO", "Nhân viên kho");

        // 2. Tự động kiểm tra và khởi tạo tài khoản ban đầu nếu DB chưa có
        initUserIfNotExists("admin", "admin", "ADMIN", "Quản Trị Viên Hệ Thống", "admin@ctutgear.vn");
        initUserIfNotExists("thukho", "123456", "WAREHOUSE_MANAGER", "Thủ Kho Tổng Trung Tâm", "thukho@ctutgear.vn");
        initUserIfNotExists("nvkho", "123456", "WAREHOUSE_STAFF", "Nhân Viên Kho Vận", "nvkho@ctutgear.vn");
        initUserIfNotExists("baomap05", "123456", "CUSTOMER", "Trương Hoàng Bảo", "baomap05@ctutgear.vn");
        initUserIfNotExists("hungbakkka", "123456", "CUSTOMER", "Hùng Bakkka", "hungbakkka@ctutgear.vn");
        initUserIfNotExists("seller_minhquan", "123456", "STORE_OWNER", "Trần Minh Quân (Chủ Shop)", "seller_minhquan@ctutgear.vn");
        initUserIfNotExists("shop_apple", "123456", "STORE_OWNER", "Apple Authorized Store", "shop_apple@ctutgear.vn");
        initUserIfNotExists("khachhang", "123456", "CUSTOMER", "Khách Hàng Mẫu", "khachhang@ctutgear.vn");

        // 3. Tự động kích hoạt toàn bộ tài khoản trong database để không bị kẹt phê duyệt
        try {
            userRepository.findAll().forEach(u -> {
                boolean changed = false;
                if (!Boolean.TRUE.equals(u.getIsApproved())) {
                    u.setIsApproved(true);
                    changed = true;
                }
                if (!Boolean.TRUE.equals(u.getTrangThai())) {
                    u.setTrangThai(true);
                    changed = true;
                }
                if (changed) {
                    userRepository.save(u);
                    log.info("-> Đã kích hoạt tài khoản: {}", u.getTaiKhoan());
                }
            });
        } catch (Exception e) {
            log.warn("Không thể cập nhật trạng thái user: {}", e.getMessage());
        }
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

    private void initUserIfNotExists(String taiKhoan, String matKhau, String maVaiTro, String hoTen, String email) {
        try {
            if (!userRepository.existsByTaiKhoan(taiKhoan)) {
                User user = new User();
                user.setTaiKhoan(taiKhoan);
                user.setMatKhau(passwordEncoder.encode(matKhau));
                user.setEmail(email);
                user.setVaiTro(maVaiTro);
                user.setTrangThai(true);
                user.setIsApproved(true);
                user.setNgayTao(LocalDateTime.now());
                user.setNgayCapNhat(LocalDateTime.now());

                roleRepository.findByMaVaiTro(maVaiTro).ifPresent(role -> user.getRoles().add(role));

                UserInfo info = new UserInfo();
                info.setUser(user);
                info.setHoTen(hoTen);
                info.setSoDienThoai("0901234567");
                info.setDiaChi("Cần Thơ, Việt Nam");
                info.setNgayCapNhat(LocalDateTime.now());
                user.setUserInfo(info);

                userRepository.save(user);
                log.info("-> Đã khởi tạo tài khoản mặc định: {} | Vai trò: {}", taiKhoan, maVaiTro);
            }
        } catch (Exception e) {
            log.warn("Không thể khởi tạo user {}: {}", taiKhoan, e.getMessage());
        }
    }
}
