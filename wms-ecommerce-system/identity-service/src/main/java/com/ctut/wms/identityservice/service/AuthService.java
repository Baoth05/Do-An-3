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
    private final RoleRepository    roleRepository;

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
        newuser.setTrangThai(true);
        newuser.setNgayTao(LocalDateTime.now());
        newuser.setNgayCapNhat(LocalDateTime.now());

        // 🌟 ĐÃ CẬP NHẬT: Xử lý gán quyền
        // Nếu Frontend có gửi vaiTro (tạo nhân viên) thì lấy, nếu không thì mặc định là CUSTOMER (khách hàng đăng ký trên web)
        String maQuyen = (request.getVaiTro() != null && !request.getVaiTro().isEmpty()) ? request.getVaiTro() : "CUSTOMER";

        // Tìm quyền dưới DB và gán cho User
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
        // 1. Tìm người dùng trong cơ sở dữ liệu
        User user = userRepository.findByTaiKhoan(request.getTaiKhoan())
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản không tồn tại!"));

        // 2. So sánh mật khẩu đã được mã hóa
        if (!passwordEncoder.matches(request.getMatKhau(), user.getMatKhau())) {
            throw new RuntimeException("Lỗi: Sai mật khẩu!");
        }

        // 3. Nếu đúng, tạo Token và chuẩn bị thông tin trả về
        UserInfo userInfo = userInfoRepository.findByUser(user).orElse(null);
        String hoTen = (userInfo != null && userInfo.getHoTen() != null) ? userInfo.getHoTen() : user.getTaiKhoan();
        String token = jwtService.generateToken(user.getTaiKhoan());

        // 🌟 Đã sửa lỗi: Giữ lại cú pháp Builder hiện đại để trả về nhiều dữ liệu cho Frontend
        return AuthResponse.builder()
                .token(token)
                .message("Đăng nhập thành công!")
                .id(user.getId())
                .taiKhoan(user.getTaiKhoan())
                .email(user.getEmail())
                .vaiTro(user.getVaiTro())
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

    // --- LẤY THÔNG TIN CÁ NHÂN ---
    public UserProfileResponse getUserProfile(String taiKhoan) {
        User user = userRepository.findByTaiKhoan(taiKhoan)
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản không tồn tại!"));

        UserInfo userInfo = userInfoRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy thông tin chi tiết!"));

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
                userInfo.getAnhDaiDien()
        );
    }

    @Transactional
    public String updateUser(Long id, UpdateUserRequest request) {
        // 1. Tìm người dùng theo ID
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy người dùng!"));

        // 2. Cập nhật Email
        user.setEmail(request.getEmail());

        // 3. Cập nhật Thông tin cá nhân (Họ tên, SĐT)
        UserInfo userInfo = userInfoRepository.findByUser(user).orElse(new UserInfo());
        userInfo.setUser(user);
        userInfo.setHoTen(request.getHoTen());
        userInfo.setSoDienThoai(request.getSoDienThoai());
        userInfoRepository.save(userInfo);

        // 4. Cập nhật Vai trò (Nếu có gửi vai trò mới)
        if (request.getVaiTro() != null && !request.getVaiTro().isEmpty()) {
            user.getRoles().clear(); // Xóa vai trò cũ
            roleRepository.findByMaVaiTro(request.getVaiTro()).ifPresent(role -> {
                user.getRoles().add(role); // Gán vai trò mới
            });
        }

        userRepository.save(user);
        return "Cập nhật thông tin thành công!";
    }

    @Transactional
    public String changePassword(String taiKhoan, ChangePasswordRequest request) {
        User user = userRepository.findByTaiKhoan(taiKhoan)
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản không tồn tại!"));

        if (!passwordEncoder.matches(request.getMatKhauCu(), user.getMatKhau())) {
            throw new RuntimeException("Lỗi: Mật khẩu hiện tại không đúng!");
        }

        String matKhauMoiDaMaHoa = passwordEncoder.encode(request.getMatKhauMoi());
        user.setMatKhau(matKhauMoiDaMaHoa);
        userRepository.save(user);

        return "Đổi mật khẩu thành công!";
    }
    @Transactional
    public List<UserProfileResponse> getAllUsers() {
        // Lấy tất cả user từ CSDL
        List<User> users = userRepository.findAll();

        // Chuyển đổi từng User thành UserProfileResponse để gửi cho Frontend
        return users.stream().map(u -> {
            // Tìm thông tin chi tiết, nếu chưa có (null) thì tạo một cái rỗng để khỏi bị lỗi
            UserInfo userInfo = userInfoRepository.findByUser(u).orElse(new UserInfo());

            // Xử lý an toàn Vai trò: Nếu CSDL chưa có Role, trả về chuỗi tạm thời
            String maVaiTro = "CHƯA PHÂN QUYỀN";
            if (u.getRoles() != null && !u.getRoles().isEmpty()) {
                maVaiTro = u.getRoles().iterator().next().getMaVaiTro();
            }

            return new UserProfileResponse(
                    u.getId(),
                    u.getTaiKhoan(),
                    u.getEmail(),
                    maVaiTro, // Vai trò an toàn
                    userInfo.getHoTen() != null ? userInfo.getHoTen() : u.getTaiKhoan(),
                    userInfo.getSoDienThoai(),
                    userInfo.getDiaChi(),
                    userInfo.getNgaySinh(),
                    userInfo.getGioiTinh(),
                    userInfo.getAnhDaiDien()
            );
        }).collect(Collectors.toList());
    }
}