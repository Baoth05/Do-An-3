
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/authService';
import {
  LuUser,
  LuLock,
  LuEye,
  LuEyeOff,
  LuShieldCheck,
  LuLogIn,
  LuExternalLink,
  LuZap,
  LuCircleCheck,
  LuArrowRight
} from 'react-icons/lu';
import logoImage from '../assets/Glossy Red and White Gaming Logo.png';
import './Login.css';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // State quản lý form đăng nhập
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoNotice, setInfoNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Điền nhanh tài khoản mẫu
  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
    setInfoNotice(`Đã điền tài khoản mẫu: ${u}`);

    setTimeout(() => setInfoNotice(''), 2500);
  };

  // Xử lý đăng nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoNotice('');
    setIsLoading(true);

    try {
      const response = await authService.login(
        username.trim(),
        password.trim()
      );

      const data = response.data || response;
      const { token, hoTen, vaiTro, taiKhoan } = data;

      // Chỉ tài khoản ADMIN được phép truy cập
      if (vaiTro && vaiTro !== 'ADMIN') {
        setErrorMessage(
          `Từ chối truy cập: Tài khoản có vai trò [${vaiTro}]. Chỉ Quản trị viên (ADMIN) mới có quyền truy cập Cổng Quản Trị!`
        );
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
      console.error('Lỗi đăng nhập:', error);

      const backendMsg =
        error?.response?.data?.message || error?.response?.data;

      setErrorMessage(
        typeof backendMsg === 'string'
          ? backendMsg
          : 'Tài khoản hoặc mật khẩu không chính xác hoặc không thể kết nối tới máy chủ!'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Ẩn/hiện mật khẩu
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-wrapper">

      {/* Trạng thái máy chủ */}
      <div className="server-status">
        <span className="status-dot"></span>
        <span>
          HỆ THỐNG QUẢN TRỊ TRỰC TUYẾN • CỔNG 8080 GATEWAY
        </span>
      </div>

      <div className="login-card">
        <div className="login-header">

          {/* Logo CTUT Gear */}
          <div className="brand-logo">
            <img
              src={logoImage}
              alt="CTUT Gear Logo"
              className="logo-icon-img"
            />
            <strong>CTUT GEAR</strong>
            <span className="logo-badge">SYSTEM ADMIN</span>
          </div>

          <h1>Cổng Quản Trị Hệ Thống</h1>

          <p className="login-subtitle">
            Bảng điều khiển giám sát & vận hành Sàn TMĐT & Kho Vận Trung Tâm
          </p>

          <div className="module-badge">
            <LuShieldCheck size={16} />
            Phân hệ dành riêng cho ADMIN
          </div>
        </div>

        {/* Quick Fill tài khoản mẫu */}
        <div className="quick-fill-box">
          <div className="quick-fill-inner">
            <span className="quick-fill-label">
              <LuZap size={15} />
              Tài khoản mẫu:
            </span>

            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin')}
              className="quick-fill-btn"
            >
              👑 admin / admin
            </button>
          </div>
        </div>

        {/* Form đăng nhập */}
        <form className="login-form" onSubmit={handleLogin}>

          {/* Thông báo lỗi */}
          {errorMessage && (
            <div className="login-alert error">
              {errorMessage}
            </div>
          )}

          {/* Thông báo điền tài khoản mẫu */}
          {infoNotice && (
            <div className="login-alert success">
              <LuCircleCheck size={15} />
              {infoNotice}
            </div>
          )}

          {/* Tài khoản */}
          <div className="input-group">
            <label>
              Tài khoản quản trị <span className="required">*</span>
            </label>

            <div className="input-wrapper">
              <LuUser className="input-icon" size={18} />

              <input
                type="text"
                placeholder="Nhập tên tài khoản admin..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div className="input-group">
            <label>
              Mật khẩu xác thực <span className="required">*</span>
            </label>

            <div className="input-wrapper">
              <LuLock className="input-icon" size={18} />

              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="toggle-password"
                onClick={togglePasswordVisibility}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword
                  ? <LuEyeOff size={18} />
                  : <LuEye size={18} />
                }
              </button>
            </div>
          </div>

          {/* Tùy chọn đăng nhập */}
          <div className="form-actions">
            <label className="remember-me">
              <input type="checkbox" defaultChecked />
              <span>Ghi nhớ đăng nhập</span>
            </label>

            <a
              href="#forgot"
              className="forgot-password"
              onClick={(e) => {
                e.preventDefault();
                alert(
                  'Vui lòng liên hệ quản trị hệ thống root để khôi phục mật khẩu.'
                );
              }}
            >
              Quên mật khẩu?
            </a>
          </div>

          {/* Nút đăng nhập */}
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading
              ? 'ĐANG XÁC THỰC...'
              : 'ĐĂNG NHẬP HỆ THỐNG'
            }
            <LuArrowRight size={18} />
          </button>
        </form>

        {/* Cảnh báo bảo mật */}
        <div className="security-warning">
          <LuShieldCheck size={18} className="warning-icon" />

          <p>
            Trang dành riêng cho Quản trị viên (ADMIN) có thẩm quyền.
            <br />
            Thủ kho, Nhân viên kho và Đối tác vui lòng truy cập đúng cổng chuyên trách.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="login-footer">
        <p className="footer-title">
          <strong>CTUT Gear Enterprise Platform v2.0</strong>
          {' '}• Bảo mật đa lớp RBAC
        </p>

        <p className="footer-links">
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
          >
            🏢 Cổng Kho Vận <LuExternalLink size={12} />
          </a>

          <span className="separator">•</span>

          <a
            href="http://localhost:5175/seller"
            target="_blank"
            rel="noreferrer"
          >
            🏪 Kênh Người Bán <LuExternalLink size={12} />
          </a>

          <span className="separator">•</span>

          <a
            href="http://localhost:5175"
            target="_blank"
            rel="noreferrer"
          >
            🛒 Sàn TMĐT <LuExternalLink size={12} />
          </a>
        </p>

        <p className="ssl-text">
          HỆ THỐNG BẢO MẬT 256-BIT SSL | ĐỒ ÁN TMĐT CTUT
        </p>
      </div>
    </div>
  );
};

export default Login;
