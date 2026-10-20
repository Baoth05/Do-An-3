package com.ctut.wms.identityservice.service;

import com.ctut.wms.identityservice.dto.*;
import com.ctut.wms.identityservice.entity.User;
import com.ctut.wms.identityservice.entity.UserInfo;
import com.ctut.wms.identityservice.repository.UserInfoRepository;
import com.ctut.wms.identityservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserInfoRepository userInfoRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

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
    public UserProfileResponse updateUserProfile(String taiKhoan, UpdateProfileRequest request) {
        User user = userRepository.findByTaiKhoan(taiKhoan)
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản không tồn tại!"));

        UserInfo userInfo = userInfoRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy thông tin chi tiết!"));

        if (request.getHoTen() != null) userInfo.setHoTen(request.getHoTen());
        if (request.getSoDienThoai() != null) userInfo.setSoDienThoai(request.getSoDienThoai());
        if (request.getDiaChi() != null) userInfo.setDiaChi(request.getDiaChi());
        if (request.getNgaySinh() != null) userInfo.setNgaySinh(request.getNgaySinh());
        if (request.getGioiTinh() != null) userInfo.setGioiTinh(request.getGioiTinh());
        if (request.getAnhDaiDien() != null) userInfo.setAnhDaiDien(request.getAnhDaiDien());

        userInfoRepository.save(userInfo);

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
}