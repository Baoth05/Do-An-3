package com.ctut.wms.identityservice.service;

import com.ctut.wms.identityservice.dto.*;
import com.ctut.wms.identityservice.entity.Role;
import com.ctut.wms.identityservice.entity.User;
import com.ctut.wms.identityservice.repository.RoleRepository;
import com.ctut.wms.identityservice.repository.UserInfoRepository;
import com.ctut.wms.identityservice.repository.UserRepository;
import com.ctut.wms.identityservice.security.ForbiddenException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashSet;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Định danh: chống tự nâng quyền, chỉ chính chủ sửa tài khoản, đổi mật khẩu cần mật khẩu cũ. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    @Mock UserInfoRepository userInfoRepository;
    @Mock UserRepository userRepository;
    @Mock JwtService jwtService;
    @Mock RoleRepository roleRepository;
    final PasswordEncoder encoder = new BCryptPasswordEncoder(4); // cost thấp cho test nhanh
    AuthService service;

    User alice; // CUSTOMER id 5
    User bob;   // CUSTOMER id 6

    @BeforeEach
    void setUp() {
        service = new AuthService(userInfoRepository, userRepository, jwtService, encoder, roleRepository);
        alice = user(5L, "alice", "CUSTOMER", "matkhau-cu");
        bob = user(6L, "bob", "CUSTOMER", "bob-pass");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(userInfoRepository.findByUser(any())).thenReturn(Optional.empty());
        when(roleRepository.findByMaVaiTro(anyString())).thenAnswer(i -> {
            Role r = new Role();
            r.setMaVaiTro(i.getArgument(0));
            return Optional.of(r);
        });
        when(jwtService.generateToken(anyString(), anyString(), any())).thenAnswer(i -> "jwt-" + i.getArgument(1));
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    private User user(Long id, String account, String role, String rawPassword) {
        User u = new User();
        u.setId(id);
        u.setTaiKhoan(account);
        u.setVaiTro(role);
        u.setMatKhau(encoder.encode(rawPassword));
        u.setTrangThai(true);
        u.setRoles(new HashSet<>());
        when(userRepository.findById(id)).thenReturn(Optional.of(u));
        when(userRepository.findByTaiKhoan(account)).thenReturn(Optional.of(u));
        return u;
    }

    private static void as(String role, Long id, String account) {
        MockHttpServletRequest req = new MockHttpServletRequest();
        if (role != null) req.addHeader("X-User-Role", role);
        if (id != null) req.addHeader("X-User-Id", String.valueOf(id));
        if (account != null) req.addHeader("X-User-Account", account);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req));
    }

    private RegisterRequest register(String account, String role) {
        RegisterRequest r = new RegisterRequest();
        r.setTaiKhoan(account);
        r.setMatKhau("123456");
        r.setEmail(account + "@mail.vn");
        r.setHoTen("Người dùng " + account);
        r.setSoDienThoai("0900000000");
        r.setVaiTro(role);
        return r;
    }

    @Test
    @DisplayName("Không ai tự đăng ký được tài khoản ADMIN / nhân sự kho")
    void cannotSelfRegisterPrivilegedRole() {
        as(null, null, null);
        assertThatThrownBy(() -> service.registerUser(register("hacker", "ADMIN"))).isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> service.registerUser(register("hacker2", "WAREHOUSE_MANAGER"))).isInstanceOf(ForbiddenException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tự đăng ký CUSTOMER (mặc định) và STORE_OWNER được phép; Admin tạo được nhân sự kho")
    void allowedRegistrations() {
        as(null, null, null);
        service.registerUser(register("khach", null));
        service.registerUser(register("chushop", "store_owner"));
        verify(userRepository).save(argThat(u -> "khach".equals(u.getTaiKhoan()) && "CUSTOMER".equals(u.getVaiTro())));
        verify(userRepository).save(argThat(u -> "chushop".equals(u.getTaiKhoan()) && "STORE_OWNER".equals(u.getVaiTro())));

        as("ADMIN", 1L, "admin");
        service.registerUser(register("thukho2", "WAREHOUSE_MANAGER"));
        verify(userRepository).save(argThat(u -> "WAREHOUSE_MANAGER".equals(u.getVaiTro())));
    }

    @Test
    @DisplayName("Đăng nhập sai tài khoản hay sai mật khẩu đều cùng một thông báo")
    void loginErrorsAreIndistinguishable() {
        when(userRepository.findByTaiKhoan("khongco")).thenReturn(Optional.empty());
        LoginRequest unknown = new LoginRequest();
        unknown.setTaiKhoan("khongco");
        unknown.setMatKhau("x");
        LoginRequest wrongPass = new LoginRequest();
        wrongPass.setTaiKhoan("alice");
        wrongPass.setMatKhau("sai");

        String m1 = catchThrowable(() -> service.login(unknown)).getMessage();
        String m2 = catchThrowable(() -> service.login(wrongPass)).getMessage();
        assertThat(m1).isEqualTo(m2).contains("không chính xác");
    }

    @Test
    @DisplayName("Khách hàng không sửa được tài khoản người khác")
    void cannotUpdateOthers() {
        as("CUSTOMER", 5L, "alice");
        UpdateUserRequest req = new UpdateUserRequest();
        req.setHoTen("Bị đổi tên");
        assertThatThrownBy(() -> service.updateUser(6L, req)).isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("Khách hàng không tự đổi vai trò của chính mình thành ADMIN")
    void cannotEscalateOwnRole() {
        as("CUSTOMER", 5L, "alice");
        UpdateUserRequest req = new UpdateUserRequest();
        req.setVaiTro("ADMIN");
        assertThatThrownBy(() -> service.updateUser(5L, req)).isInstanceOf(ForbiddenException.class);
        assertThat(alice.getVaiTro()).isEqualTo("CUSTOMER");
    }

    @Test
    @DisplayName("Đổi mật khẩu: phải đúng mật khẩu cũ, không đổi được của người khác; Admin đặt lại được")
    void changePasswordRules() {
        ChangePasswordRequest wrongOld = new ChangePasswordRequest();
        wrongOld.setMatKhauCu("doan-bua");
        wrongOld.setMatKhauMoi("matkhau-moi");
        ChangePasswordRequest ok = new ChangePasswordRequest();
        ok.setMatKhauCu("matkhau-cu");
        ok.setMatKhauMoi("matkhau-moi");

        as("CUSTOMER", 5L, "alice");
        assertThatThrownBy(() -> service.changePassword("alice", wrongOld)).hasMessageContaining("cũ không chính xác");
        assertThatThrownBy(() -> service.changePassword("bob", ok)).isInstanceOf(ForbiddenException.class);
        service.changePassword("alice", ok);
        assertThat(encoder.matches("matkhau-moi", alice.getMatKhau())).isTrue();

        as("ADMIN", 1L, "admin");
        ChangePasswordRequest reset = new ChangePasswordRequest();
        reset.setMatKhauMoi("reset-123");
        service.changePassword("bob", reset);
        assertThat(encoder.matches("reset-123", bob.getMatKhau())).isTrue();
    }

    @Test
    @DisplayName("Khách hàng nâng cấp thành chủ shop: đổi vai trò & cấp token mới")
    void upgradeToSeller() {
        as("CUSTOMER", 5L, "alice");
        AuthResponse res = service.upgradeToSeller();
        assertThat(alice.getVaiTro()).isEqualTo("STORE_OWNER");
        assertThat(res.getToken()).isEqualTo("jwt-STORE_OWNER");
    }

    @Test
    @DisplayName("Nhân sự kho không dùng được chức năng nâng cấp thành chủ shop")
    void warehouseCannotUpgrade() {
        user(9L, "nvkho", "WAREHOUSE_STAFF", "x");
        as("WAREHOUSE_STAFF", 9L, "nvkho");
        assertThatThrownBy(() -> service.upgradeToSeller()).isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("Chỉ Admin xem được danh sách người dùng và khóa tài khoản")
    void adminOnlyOperations() {
        as("STORE_OWNER", 5L, "alice");
        assertThatThrownBy(() -> service.getAllUsers()).isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> service.toggleUserStatus(6L)).isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("Admin và nhân sự kho xem được danh sách tài khoản cửa hàng (/auth/stores); khách & shop bị từ chối")
    void storeUsersAllowedForAdminAndWarehouseOnly() {
        User shop = user(10L, "shopA", "STORE_OWNER", "x");
        User kho = user(11L, "thukho", "THUKHO", "x");
        when(userRepository.findAll()).thenReturn(java.util.List.of(alice, shop, kho));

        as("CUSTOMER", 5L, "alice");
        assertThatThrownBy(() -> service.getStoreUsers()).isInstanceOf(ForbiddenException.class);
        as("STORE_OWNER", 10L, "shopA");
        assertThatThrownBy(() -> service.getStoreUsers()).isInstanceOf(ForbiddenException.class);

        as("THUKHO", 11L, "thukho");
        assertThat(service.getStoreUsers()).extracting(UserProfileResponse::getTaiKhoan).containsExactly("shopA");
        as("ADMIN", 1L, "admin");
        assertThat(service.getStoreUsers()).extracting(UserProfileResponse::getTaiKhoan).containsExactly("shopA");
    }
}
