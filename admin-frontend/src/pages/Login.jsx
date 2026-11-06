// src/pages/Login.jsx
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/authService';
import { FiUser, FiLock, FiEye, FiEyeOff, FiShield, FiArrowRight } from 'react-icons/fi';
import './Login.css';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Các state để lưu trữ dữ liệu form và trạng thái
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Hàm xử lý hành động khi nhấn nút ĐĂNG NHẬP
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Xóa thông báo lỗi cũ (nếu có)
    setIsLoading(true);

    try {
      // 1. Gọi API đăng nhập tới Backend Spring Boot
      const response = await authService.login(username, password);

      // Axios thường bọc dữ liệu trả về bên trong thuộc tính .data
      const data = response.data || response;

      // 2. Tách các thông tin mà Backend (AuthResponse) trả về
      const { token, hoTen, vaiTro, taiKhoan } = data;

      // 🌟 KIỂM TRA PHÂN QUYỀN RBAC: Chỉ duy nhất ADMIN mới có quyền truy cập Cổng Quản Trị
      if (vaiTro && vaiTro !== 'ADMIN') {
        setErrorMessage(`Từ chối truy cập: Tài khoản của bạn có vai trò [${vaiTro}]. Chỉ Quản trị viên (ADMIN) mới có quyền truy cập Cổng Quản Trị Hệ Thống!`);
        return;
      }

      // 3. Đóng gói dữ liệu người dùng để truyền vào Context
      const userData = {
        name: hoTen || taiKhoan || 'Quản trị viên', // Ưu tiên tên thật, nếu không có thì lấy tài khoản
        role: vaiTro || 'ADMIN',
        status: 'TRỰC TUYẾN',
        // Lấy chữ cái đầu của tên làm ảnh đại diện
        avatar: (hoTen || taiKhoan || 'A').charAt(0).toUpperCase()
      };

      // 4. Truyền thông tin UI và Token thực tế vào hàm login của Context
      login(userData, token);

      // 5. Chuyển hướng sang trang Bảng điều khiển chính
      navigate('/');
    } catch (error) {
      // Bắt lỗi nếu sai tài khoản/mật khẩu hoặc Backend không phản hồi
      console.error("Lỗi đăng nhập:", error);
      const backendMsg = error?.response?.data?.message || error?.response?.data;
      setErrorMessage(typeof backendMsg === 'string' ? backendMsg : 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-wrapper">
      <div className="server-status">
        <span className="status-dot"></span>
        MÁY CHỦ QUẢN TRỊ HOẠT ĐỘNG • CỔNG 443 SSL
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="brand-logo">
            <span className="logo-icon">🔥</span>
            <strong>CTUT GEAR</strong>
            <span className="logo-badge">OFFICIAL WEB TECH & GAMING</span>
          </div>
          <h1>Cổng Quản Trị Hệ Thống</h1>
          <p>Đăng nhập để truy cập bảng điều khiển vận hành</p>
          <div className="module-badge">
            <FiShield size={14} /> Phân hệ Quản trị viên Toàn quyền (ADMIN ONLY)
          </div>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {/* Hiển thị lỗi nếu có */}
          {errorMessage && (
            <div className="error-message" style={{ color: '#dc2626', background: '#fee2e2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', textAlign: 'center', fontWeight: '600' }}>
              {errorMessage}
            </div>
          )}

          <div className="input-group">
            <label>Tài khoản quản trị <span className="required">*</span></label>
            <div className="input-wrapper">
              <FiUser className="input-icon" size={18} />
              <input
                type="text"
                placeholder="Nhập tài khoản admin..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Mật khẩu xác thực <span className="required">*</span></label>
            <div className="input-wrapper">
              <FiLock className="input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-actions">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Ghi nhớ phiên đăng nhập</span>
            </label>
            <a href="#" className="forgot-password">Quên mật khẩu?</a>
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'} <FiArrowRight size={18} />
          </button>
        </form>

        <div className="security-warning">
          <FiShield size={16} className="warning-icon" />
          <p>
            Chỉ dành cho Quản trị viên (ADMIN) được cấp quyền tối cao.<br />
            Thủ kho, Nhân viên kho, Chủ shop và Khách hàng vui lòng truy cập đúng cổng phân hệ của mình.
          </p>
        </div>
      </div>

      <div className="login-footer">
        <p><strong>CTUT Gear Enterprise Platform v1.0.4</strong> <FiShield size={12} /> Bảo mật đa lớp RBAC</p>
        <p className="footer-links">
          <a href="http://localhost:5173" target="_blank" rel="noreferrer">🏢 Cổng Kho Vận (WMS)</a>
          <span style={{ margin: '0 8px', color: '#94a3b8' }}>•</span>
          <a href="http://localhost:5175/seller" target="_blank" rel="noreferrer">🏪 Kênh Người Bán</a>
          <span style={{ margin: '0 8px', color: '#94a3b8' }}>•</span>
          <a href="http://localhost:5175" target="_blank" rel="noreferrer">🛒 Sàn TMĐT</a>
        </p>
        <p className="ssl-text">HỆ THỐNG BẢO MẬT 256-BIT SSL | ĐỒ ÁN TMĐT CTUT</p>
      </div>
    </div>
  );
};

export default Login;
