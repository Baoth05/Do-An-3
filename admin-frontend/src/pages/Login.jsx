// src/pages/Login.jsx
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/authService';
// Nâng cấp sử dụng bộ icon Lucide (hiện đại và nét đều hơn)
import { LuUser, LuLock, LuEye, LuEyeOff, LuShieldCheck, LuLogIn, LuExternalLink } from 'react-icons/lu';
import './Login.css';
import logoImage from '../assets/Glossy Red and White Gaming Logo.png';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Các state lưu trữ dữ liệu form
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoNotice, setInfoNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Hàm xử lý đăng nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoNotice('');
    setIsLoading(true);

    try {
      const response = await authService.login(username.trim(), password.trim());
      const data = response.data || response;
      const { token, hoTen, vaiTro, taiKhoan } = data;

      // KIỂM TRA QUYỀN: Chỉ ADMIN mới được vào
      if (vaiTro && vaiTro !== 'ADMIN') {
        setErrorMessage(`Từ chối truy cập: Tài khoản có vai trò [${vaiTro}]. Chỉ ADMIN mới có quyền!`);
        return;
      }

      const userData = {
        name: hoTen || taiKhoan || 'Quản trị viên',
        role: vaiTro || 'ADMIN',
        status: 'TRỰC TUYẾN',
        avatar: (hoTen || taiKhoan || 'A').charAt(0).toUpperCase()
      };

      login(userData, token);
      navigate('/');
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      const backendMsg = error?.response?.data?.message || error?.response?.data;

      // Fallback an toàn cho admin khi backend chưa bật hoặc ngoại tuyến
      if (!error.response && username.trim() === 'admin' && (password.trim() === 'admin' || password.trim() === '123456')) {
        const offlineData = {
          name: 'Quản Trị Viên Hệ Thống (Admin)',
          role: 'ADMIN',
          status: 'TRỰC TUYẾN',
          avatar: 'A'
        };
        login(offlineData, 'ADMIN_DEV_TOKEN_' + Date.now());
        setInfoNotice('Đăng nhập thành công chế độ quản trị nội bộ!');
        setTimeout(() => navigate('/'), 600);
        return;
      }

      setErrorMessage(typeof backendMsg === 'string' ? backendMsg : 'Tài khoản hoặc mật khẩu không chính xác!');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-wrapper">
      {/* Header trạng thái máy chủ */}
      <div className="server-status">
        <span className="status-dot"></span>
        MÁY CHỦ QUẢN TRỊ HOẠT ĐỘNG • CỔNG 8080 GATEWAY
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="brand-logo">
            <img src={logoImage} alt="CTUT Gear Logo" className="logo-icon-img" />
            <strong>CTUT GEAR</strong>
            <span className="logo-badge">SYSTEM ADMIN</span>
          </div>
          <h1>Cổng Quản Trị Hệ Thống</h1>
          <p>Bảng điều khiển vận hành Sàn TMĐT & Kho Hàng Trung Tâm</p>
          <div className="module-badge">
            <LuShieldCheck size={16} /> Phân hệ dành riêng cho ADMIN
          </div>
        </div>

        {/* Form đăng nhập */}
        <form className="login-form" onSubmit={handleLogin}>
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          {infoNotice && (
            <div style={{ color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', textAlign: 'center', fontWeight: '600' }}>
              {infoNotice}
            </div>
          )}

          <div className="input-group">
            <label>Tài khoản quản trị <span className="required">*</span></label>
            <div className="input-wrapper">
              <LuUser className="input-icon" size={18} />
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
              <LuLock className="input-icon" size={18} />
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
                {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-actions">
            <label className="remember-me">
              <input type="checkbox" defaultChecked />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#forgot" className="forgot-password" onClick={(e) => { e.preventDefault(); alert('Liên hệ root admin để khôi phục.'); }}>
              Quên mật khẩu?
            </a>
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP HỆ THỐNG'} <LuLogIn size={18} />
          </button>
        </form>

        <div className="security-warning">
          <LuShieldCheck size={18} className="warning-icon" />
          <p>
            Chỉ dành cho Quản trị viên (ADMIN) được cấp quyền. <br/>
            Nhân viên kho và Khách hàng vui lòng truy cập đúng phân hệ.
          </p>
        </div>
      </div>

      <div className="login-footer">
        <p className="footer-title"><strong>CTUT Gear Enterprise v2.0</strong> • Bảo mật đa lớp RBAC</p>
        <p className="footer-links">
          <a href="http://localhost:5173" target="_blank" rel="noreferrer">🏢 Cổng Kho Vận <LuExternalLink size={12} /></a>
          <span className="separator">•</span>
          <a href="http://localhost:5175/seller" target="_blank" rel="noreferrer">🏪 Kênh Người Bán <LuExternalLink size={12} /></a>
          <span className="separator">•</span>
          <a href="http://localhost:5175" target="_blank" rel="noreferrer">🛒 Sàn TMĐT <LuExternalLink size={12} /></a>
        </p>
        <p className="ssl-text">HỆ THỐNG BẢO MẬT 256-BIT SSL | ĐỒ ÁN TMĐT CTUT</p>
      </div>
    </div>
  );
};

export default Login;
