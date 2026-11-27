package com.ctut.wms.identityservice.service;

import com.ctut.wms.identityservice.dto.*;
import com.ctut.wms.identityservice.entity.User;
import com.ctut.wms.identityservice.entity.UserInfo;
import com.ctut.wms.identityservice.repository.RoleRepository;
import com.ctut.wms.identityservice.repository.UserInfoRepository;
import com.ctut.wms.identityservice.repository.UserRepository;
import com.ctut.wms.identityservice.security.CurrentUser;
import com.ctut.wms.identityservice.security.ForbiddenException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserInfoRepository userInfoRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

    // Vai trò được phép TỰ đăng ký. Vai trò nhân sự (ADMIN, kho...) chỉ Admin mới tạo được.
    private static final String LOGIN_FAILED = "Lỗi: Tài khoản hoặc mật khẩu không chính xác!";

    private static final Set<String> SELF_REGISTER_ROLES = Set.of("CUSTOMER", "STORE_OWNER");

    @Transactional
    public String registerUser(RegisterRequest request){
        if(userRepository.existsByTaiKhoan(request.getTaiKhoan())){
            return "Lỗi: Tên tài khoản đã tồn tại";
        }
        if (userRepository.existsByEmail(request.getEmail())){
            return "Lỗi: Email đã tồn tại";
        }

        User newuser = new User();
        newuser.setTaiKhoan(request.getTaiKhoan());
        String maHoaMatKhau = passwordEncoder.encode(request.getMatKhau());
        newuser.setMatKhau(maHoaMatKhau);
        newuser.setEmail(request.getEmail());

        newuser.setNgayTao(LocalDateTime.now());
        newuser.setNgayCapNhat(LocalDateTime.now());

        // 1. Gán quyền
        String maQuyen = (request.getVaiTro() != null && !request.getVaiTro().isBlank())
                ? request.getVaiTro().trim().toUpperCase()
                : "CUSTOMER";
        if (!SELF_REGISTER_ROLES.contains(maQuyen) && !CurrentUser.isAdmin()) {
            throw new ForbiddenException("Lỗi: Không được phép tự đăng ký tài khoản với vai trò [" + maQuyen + "]!");
        }
        newuser.setVaiTro(maQuyen);

        // 2. LOGIC: Tài khoản đăng ký ở E-Commerce đều hoạt động ngay (không cần duyệt để đăng nhập)
        newuser.setTrangThai(true);
        newuser.setIsApproved(true);

        roleRepository.findByMaVaiTro(maQuyen).ifPresent(role -> {
            newuser.getRoles().add(role);
        });

        UserInfo userInfo = new UserInfo();
        userInfo.setUser(newuser);
        userInfo.setHoTen(request.getHoTen());
        userInfo.setSoDienThoai(request.getSoDienThoai());
        userInfo.setNgayCapNhat(LocalDateTime.now());
        userInfo.setDiaChi(request.getDiaChi());
        userInfo.setNgaySinh(request.getNgaySinh());
        userInfo.setGioiTinh(request.getGioiTinh());

        newuser.setUserInfo(userInfo);
        userRepository.save(newuser);

        return "Đăng ký tài khoản thành công!";
    }

    public AuthResponse login(LoginRequest request) {
        // Dùng chung 1 thông báo để không lộ việc tài khoản có tồn tại hay không
        User user = userRepository.findByTaiKhoan(request.getTaiKhoan())
                .orElseThrow(() -> new RuntimeException(LOGIN_FAILED));

        if (!passwordEncoder.matches(request.getMatKhau(), user.getMatKhau())) {
            throw new RuntimeException(LOGIN_FAILED);
        }

        // Kiểm tra nếu tài khoản bị khóa
        if (Boolean.FALSE.equals(user.getTrangThai())) {
            throw new RuntimeException("Lỗi: Tài khoản của bạn đã bị khóa!");
        }

        return buildAuthResponse(user, "Đăng nhập thành công!");
    }

    /** Khách hàng tự mở gian hàng: nâng vai trò CUSTOMER -> STORE_OWNER và cấp token mới. */
    @Transactional
    public AuthResponse upgradeToSeller() {
        CurrentUser.requireAuthenticated();
        String account = CurrentUser.account();
        User user = userRepository.findByTaiKhoan(account)
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản không tồn tại!"));

        String current = currentRole(user);
        if (!"STORE_OWNER".equals(current)) {
            if (!"CUSTOMER".equals(current)) {
                throw new ForbiddenException("Từ chối: Tài khoản vai trò [" + current + "] không thể chuyển thành Chủ cửa hàng!");
            }
            user.setVaiTro("STORE_OWNER");
            user.getRoles().clear();
            roleRepository.findByMaVaiTro("STORE_OWNER").ifPresent(role -> user.getRoles().add(role));
            user.setNgayCapNhat(LocalDateTime.now());
            userRepository.save(user);
        }
        return buildAuthResponse(user, "Đã chuyển tài khoản thành Chủ cửa hàng!");
    }

    private String currentRole(User user) {
        String roleName = user.getRoles() != null && !user.getRoles().isEmpty()
                ? user.getRoles().iterator().next().getMaVaiTro()
                : user.getVaiTro();
        return (roleName == null || roleName.isEmpty()) ? "CUSTOMER" : roleName;
    }

    private AuthResponse buildAuthResponse(User user, String message) {
        UserInfo userInfo = userInfoRepository.findByUser(user).orElse(null);
        String hoTen = (userInfo != null && userInfo.getHoTen() != null) ? userInfo.getHoTen() : user.getTaiKhoan();

        String roleName = currentRole(user);
        String token = jwtService.generateToken(user.getTaiKhoan(), roleName, user.getId());

        return AuthResponse.builder()
                .token(token)
                .message(message)
                .id(user.getId())
                .taiKhoan(user.getTaiKhoan())
                .email(user.getEmail())
                .vaiTro(roleName)
                .hoTen(hoTen)
                .build();
    }

    @Transactional
    public String deleteUser(String taiKhoan) {
        CurrentUser.requireAdmin();
        User user = userRepository.findByTaiKhoan(taiKhoan)
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản không tồn tại!"));

        userInfoRepository.findByUser(user)
                .ifPresent(userInfo -> userInfoRepository.delete(userInfo));

        userRepository.delete(user);
        return "Xóa tài khoản thành công!";
    }

    public void validateToken(String token) {
        jwtService.validateToken(token);
    }

    public UserProfileResponse getUserProfile(String taiKhoan) {
        User user = userRepository.findByTaiKhoan(taiKhoan)
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản không tồn tại!"));
        requireSelfOrAdmin(user);

        UserInfo userInfo = userInfoRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy thông tin chi tiết!"));

        // MỚI THÊM: Trả về trạng thái và isApproved ở cuối
        return new UserProfileResponse(
                user.getId(),
                user.getTaiKhoan(),
                user.getEmail(),
                user.getVaiTro(),
                userInfo.getHoTen(),
                userInfo.getSoDienThoai(),
                userInfo.getDiaChi(),
                userInfo.getNgaySinh(),
                userInfo.getGioiTinh(),
                userInfo.getAnhDaiDien(),
                user.getTrangThai(),
                user.getIsApproved()
        );
    }

    @Transactional
    public String updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy người dùng!"));
        requireSelfOrAdmin(user);

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            user.setEmail(request.getEmail());
        }

        UserInfo userInfo = userInfoRepository.findByUser(user).orElse(new UserInfo());
        userInfo.setUser(user);
        userInfo.setHoTen(request.getHoTen());
        userInfo.setSoDienThoai(request.getSoDienThoai());
        userInfoRepository.save(userInfo);

        // Chỉ Admin mới được đổi vai trò (chống tự nâng quyền)
        if (request.getVaiTro() != null && !request.getVaiTro().isEmpty()) {
            CurrentUser.requireAdmin();
            user.setVaiTro(request.getVaiTro());
            user.getRoles().clear();
            roleRepository.findByMaVaiTro(request.getVaiTro()).ifPresent(role -> {
                user.getRoles().add(role);
            });
        }

        userRepository.save(user);
        return "Cập nhật thông tin thành công!";
    }

    @Transactional
    public String changePassword(String taiKhoan, ChangePasswordRequest request) {
        User user = userRepository.findByTaiKhoan(taiKhoan)
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản không tồn tại!"));
        requireSelfOrAdmin(user);

        if (request.getMatKhauMoi() == null || request.getMatKhauMoi().length() < 6) {
            throw new RuntimeException("Lỗi: Mật khẩu mới phải có ít nhất 6 ký tự!");
        }
        // Người dùng tự đổi mật khẩu phải nhập đúng mật khẩu cũ (Admin đặt lại mật khẩu thì không cần)
        if (!CurrentUser.isAdmin()) {
            if (request.getMatKhauCu() == null || !passwordEncoder.matches(request.getMatKhauCu(), user.getMatKhau())) {
                throw new RuntimeException("Lỗi: Mật khẩu cũ không chính xác!");
            }
        }

        String matKhauMoiDaMaHoa = passwordEncoder.encode(request.getMatKhauMoi());
        user.setMatKhau(matKhauMoiDaMaHoa);
        userRepository.save(user);

        return "Đổi mật khẩu thành công!";
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUsers() {
        CurrentUser.requireAdmin();
        return userRepository.findAll().stream()
                .map(this::toUserProfileResponse)
                .collect(Collectors.toList());
    }

    /** Lấy danh sách tài khoản cửa hàng cho Admin và Bộ phận Kho (không yêu cầu quyền Admin như /auth/users). */
    @Transactional(readOnly = true)
    public List<UserProfileResponse> getStoreUsers() {
        if (!CurrentUser.isAdmin() && !CurrentUser.isWarehouse()) {
            throw new ForbiddenException("Từ chối truy cập: Chỉ Quản trị viên hoặc nhân sự Kho mới được xem danh sách tài khoản cửa hàng!");
        }
        return userRepository.findAll().stream()
                .map(this::toUserProfileResponse)
                .filter(this::isStoreAccount)
                .collect(Collectors.toList());
    }

    private UserProfileResponse toUserProfileResponse(User u) {
        UserInfo userInfo = userInfoRepository.findByUser(u).orElse(new UserInfo());
        return new UserProfileResponse(
                u.getId(),
                u.getTaiKhoan(),
                u.getEmail(),
                currentRole(u),
                userInfo.getHoTen() != null ? userInfo.getHoTen() : u.getTaiKhoan(),
                userInfo.getSoDienThoai(),
                userInfo.getDiaChi(),
                userInfo.getNgaySinh(),
                userInfo.getGioiTinh(),
                userInfo.getAnhDaiDien(),
                u.getTrangThai(),
                u.getIsApproved()
        );
    }

    private boolean isStoreAccount(UserProfileResponse user) {
        if (user == null || user.getVaiTro() == null) {
            return false;
        }
        String normalizedRole = Normalizer.normalize(user.getVaiTro(), Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replace("đ", "d")
                .replace("Đ", "D")
                .toLowerCase()
                .trim();

        return normalizedRole.contains("store_owner")
                || normalizedRole.contains("chu cua hang")
                || normalizedRole.contains("chu_cua_hang")
                || normalizedRole.contains("seller")
                || normalizedRole.contains("sales")
                || normalizedRole.contains("banhang")
                || normalizedRole.contains("ban hang");
    }

    @Transactional
    public String toggleUserStatus(Long id) {
        CurrentUser.requireAdmin();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy người dùng!"));
        boolean current = user.getTrangThai() != null ? user.getTrangThai() : true;
        user.setTrangThai(!current);
        userRepository.save(user);
        return user.getTrangThai() ? "Hoạt động" : "Đã khóa";
    }

    // MỚI THÊM: Hàm xử lý Duyệt Tài Khoản
    @Transactional
    public String approveUser(Long id) {
        CurrentUser.requireAdmin();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy người dùng!"));

        if (Boolean.TRUE.equals(user.getIsApproved())) {
            return "Tài khoản này đã được duyệt trước đó!";
        }

        user.setIsApproved(true);
        user.setTrangThai(true); // Khi duyệt thành công thì mở khóa cho phép hoạt động
        userRepository.save(user);

        return "Duyệt tài khoản bán hàng thành công!";
    }

    /** Chỉ chính chủ tài khoản hoặc Admin mới được xem/sửa thông tin. */
    private void requireSelfOrAdmin(User user) {
        if (CurrentUser.isAdmin()) return;
        Long myId = CurrentUser.id();
        String myAccount = CurrentUser.account();
        boolean isOwner = (myId != null && myId.equals(user.getId()))
                || (myAccount != null && myAccount.equals(user.getTaiKhoan()));
        if (!isOwner) {
            throw new ForbiddenException("Từ chối truy cập: Bạn không có quyền với tài khoản của người khác!");
        }
    }
}
