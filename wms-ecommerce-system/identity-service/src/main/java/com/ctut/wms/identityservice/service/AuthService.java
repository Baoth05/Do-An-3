package com.ctut.wms.identityservice.service;

import com.ctut.wms.identityservice.dto.*;
import com.ctut.wms.identityservice.entity.User;
import com.ctut.wms.identityservice.entity.UserInfo;
import com.ctut.wms.identityservice.repository.RoleRepository;
import com.ctut.wms.identityservice.repository.UserInfoRepository;
import com.ctut.wms.identityservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserInfoRepository userInfoRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

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
        String maQuyen = (request.getVaiTro() != null && !request.getVaiTro().isEmpty()) ? request.getVaiTro() : "CUSTOMER";
        newuser.setVaiTro(maQuyen);

        // 2. LOGIC MỚI: Xử lý trạng thái tài khoản dựa trên vai trò
        // Nếu là chủ cửa hàng (người bán), tài khoản sẽ bị khóa (false) chờ Admin duyệt
        if (maQuyen.equalsIgnoreCase("STORE_OWNER")) {
            newuser.setTrangThai(false);
        } else {
            newuser.setTrangThai(true); // Khách hàng bình thường thì hoạt động ngay
        }

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
        User user = userRepository.findByTaiKhoan(request.getTaiKhoan())
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản không tồn tại!"));

        if (!passwordEncoder.matches(request.getMatKhau(), user.getMatKhau())) {
            throw new RuntimeException("Lỗi: Sai mật khẩu!");
        }

        // MỚI THÊM: Kiểm tra nếu tài khoản chưa được duyệt hoặc bị khóa
        if (Boolean.FALSE.equals(user.getIsApproved())) {
            throw new RuntimeException("Lỗi: Tài khoản của bạn đang chờ quản trị viên phê duyệt!");
        }
        if (Boolean.FALSE.equals(user.getTrangThai())) {
            throw new RuntimeException("Lỗi: Tài khoản của bạn đã bị khóa!");
        }

        UserInfo userInfo = userInfoRepository.findByUser(user).orElse(null);
        String hoTen = (userInfo != null && userInfo.getHoTen() != null) ? userInfo.getHoTen() : user.getTaiKhoan();

        String roleName = user.getRoles() != null && !user.getRoles().isEmpty() ? user.getRoles().iterator().next().getMaVaiTro() : user.getVaiTro();
        if (roleName == null || roleName.isEmpty()) {
            roleName = "CUSTOMER";
        }
        String token = jwtService.generateToken(user.getTaiKhoan(), roleName, user.getId());

        return AuthResponse.builder()
                .token(token)
                .message("Đăng nhập thành công!")
                .id(user.getId())
                .taiKhoan(user.getTaiKhoan())
                .email(user.getEmail())
                .vaiTro(roleName)
                .hoTen(hoTen)
                .build();
    }

    @Transactional
    public String deleteUser(String taiKhoan) {
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

        user.setEmail(request.getEmail());

        UserInfo userInfo = userInfoRepository.findByUser(user).orElse(new UserInfo());
        userInfo.setUser(user);
        userInfo.setHoTen(request.getHoTen());
        userInfo.setSoDienThoai(request.getSoDienThoai());
        userInfoRepository.save(userInfo);

        if (request.getVaiTro() != null && !request.getVaiTro().isEmpty()) {
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

        String matKhauMoiDaMaHoa = passwordEncoder.encode(request.getMatKhauMoi());
        user.setMatKhau(matKhauMoiDaMaHoa);
        userRepository.save(user);

        return "Đổi mật khẩu thành công!";
    }

    @Transactional
    public List<UserProfileResponse> getAllUsers() {
        List<User> users = userRepository.findAll();

        return users.stream().map(u -> {
            UserInfo userInfo = userInfoRepository.findByUser(u).orElse(new UserInfo());

            String maVaiTro = "CUSTOMER";
            if (u.getRoles() != null && !u.getRoles().isEmpty()) {
                maVaiTro = u.getRoles().iterator().next().getMaVaiTro();
            } else if (u.getVaiTro() != null) {
                maVaiTro = u.getVaiTro();
            }

            // MỚI THÊM: Truyền thêm trạng thái và isApproved vào hàm tạo
            return new UserProfileResponse(
                    u.getId(),
                    u.getTaiKhoan(),
                    u.getEmail(),
                    maVaiTro,
                    userInfo.getHoTen() != null ? userInfo.getHoTen() : u.getTaiKhoan(),
                    userInfo.getSoDienThoai(),
                    userInfo.getDiaChi(),
                    userInfo.getNgaySinh(),
                    userInfo.getGioiTinh(),
                    userInfo.getAnhDaiDien(),
                    u.getTrangThai(),
                    u.getIsApproved()
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public String toggleUserStatus(Long id) {
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
}