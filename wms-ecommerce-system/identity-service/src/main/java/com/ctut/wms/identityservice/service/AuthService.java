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
import org.springframework.web.bind.annotation.DeleteMapping; // Import thư viện này
import org.springframework.web.bind.annotation.PathVariable;
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
            return "lỗi: Tên đã tồn tại";
        }
        if (userRepository.existsByEmail(request.getEmail())){
            return "Lỗi: gmail đã tồn tại";
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

        // 2. So sánh mật khẩu (Đang dùng mật khẩu thô để test, sẽ nâng cấp mã hóa sau)
        if (!passwordEncoder.matches(request.getMatKhau(), user.getMatKhau())) {
            throw new RuntimeException("Lỗi: Sai mật khẩu!");
        }

        // 3. Nếu đúng, tạo Token và trả về
        String token = jwtService.generateToken(user.getTaiKhoan());
        return new AuthResponse(token, "Đăng nhập thành công!");
    }
    @Transactional // Đảm bảo tính toàn vẹn: Lỗi ở đâu thì hoàn tác (rollback) toàn bộ
    public String deleteUser(String taiKhoan) {
        // 1. Tìm tài khoản chính trong cơ sở dữ liệu
        User user = userRepository.findByTaiKhoan(taiKhoan)
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản không tồn tại!"));

        // 2. Tìm và xóa thông tin phụ (UserInfo) trước để tránh lỗi khóa ngoại
        userInfoRepository.findByUser(user)
                .ifPresent(userInfo -> userInfoRepository.delete(userInfo));

        // 3. Sau khi dọn dẹp xong thông tin phụ, tiến hành xóa tài khoản chính
        userRepository.delete(user);

        return "Xóa tài khoản thành công!";
    }
    public void validateToken(String token) {
        jwtService.validateToken(token);
    }
    // --- LẤY THÔNG TIN CÁ NHÂN ---
    public UserProfileResponse getUserProfile(String taiKhoan) {
        // 1. Tìm User
        User user = userRepository.findByTaiKhoan(taiKhoan)
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản không tồn tại!"));

        // 2. Tìm UserInfo
        UserInfo userInfo = userInfoRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy thông tin chi tiết!"));

        // 3. Đóng gói vào DTO và trả về
        return new UserProfileResponse(
                user.getTaiKhoan(),
                user.getEmail(),
                user.getVaiTro(), // Từ bảng User
                userInfo.getHoTen(), // Từ bảng UserInfo
                userInfo.getSoDienThoai(),
                userInfo.getDiaChi(),
                userInfo.getNgaySinh(),
                userInfo.getGioiTinh(),
                userInfo.getAnhDaiDien()
        );

    }
    @Transactional
    public UserProfileResponse updateUserProfile(String taiKhoan, UpdateProfileRequest request) {
        // 1. Kiểm tra tài khoản có tồn tại không
        User user = userRepository.findByTaiKhoan(taiKhoan)
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản không tồn tại!"));

        // 2. Lấy thông tin chi tiết hiện tại của người dùng
        UserInfo userInfo = userInfoRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy thông tin chi tiết!"));

        // 3. Cập nhật dữ liệu mới (Chỉ cập nhật nếu khách hàng có truyền dữ liệu lên)
        if (request.getHoTen() != null) {
            userInfo.setHoTen(request.getHoTen());
        }
        if (request.getSoDienThoai() != null) {
            userInfo.setSoDienThoai(request.getSoDienThoai());
        }
        if (request.getDiaChi() != null) {
            userInfo.setDiaChi(request.getDiaChi());
        }
        if (request.getNgaySinh() != null) {
            userInfo.setNgaySinh(request.getNgaySinh());
        }
        if (request.getGioiTinh() != null) {
            userInfo.setGioiTinh(request.getGioiTinh());
        }
        if (request.getAnhDaiDien() != null) {
            userInfo.setAnhDaiDien(request.getAnhDaiDien());
        }

        // 4. Lưu sự thay đổi xuống cơ sở dữ liệu
        userInfoRepository.save(userInfo);

        // 5. Trả về thông tin hồ sơ mới nhất cho người dùng xem
        return new UserProfileResponse(
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
        // 1. Tìm người dùng
        User user = userRepository.findByTaiKhoan(taiKhoan)
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản không tồn tại!"));

        // 2. Kiểm tra mật khẩu cũ xem có khớp với DB không
        if (!passwordEncoder.matches(request.getMatKhauCu(), user.getMatKhau())) {
            throw new RuntimeException("Lỗi: Mật khẩu hiện tại không đúng!");
        }

        // 3. Mã hóa mật khẩu mới và lưu lại
        String matKhauMoiDaMaHoa = passwordEncoder.encode(request.getMatKhauMoi());
        user.setMatKhau(matKhauMoiDaMaHoa);

        userRepository.save(user);

        return "Đổi mật khẩu thành công!";
    }
}