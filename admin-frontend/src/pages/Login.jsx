// src/pages/Login.jsx
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/authService';
import { FiUser, FiLock, FiEye, FiEyeOff, FiShield, FiArrowRight, FiZap, FiExternalLink, FiCheckCircle } from 'react-icons/fi';
import logoImage from '../assets/Glossy Red and White Gaming Logo.png';
import './Login.css';
import logoImage from '../assets/Glossy Red and White Gaming Logo.png';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Các state lưu trữ dữ liệu form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick fill helper
  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
    setInfoNotice(`Đã điền tài khoản mẫu: ${u}`);
    setTimeout(() => setInfoNotice(''), 2500);
  };

  // Hàm xử lý hành động khi nhấn nút ĐĂNG NHẬP
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await authService.login(username.trim(), password.trim());
      const data = response.data || response;
      const { token, hoTen, vaiTro, taiKhoan } = data;

      // KIỂM TRA QUYỀN: Chỉ ADMIN mới được vào
      if (vaiTro && vaiTro !== 'ADMIN') {
        setErrorMessage(`Từ chối truy cập: Tài khoản có vai trò [${vaiTro}]. Chỉ Quản trị viên (ADMIN) mới có quyền truy cập Cổng Quản Trị!`);
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
      setErrorMessage(typeof backendMsg === 'string' ? backendMsg : 'Tài khoản hoặc mật khẩu không chính xác hoặc không thể kết nối tới máy chủ!');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-wrapper">
      {/* Badge trạng thái máy chủ */}
      <div className="server-status">
        <span className="status-dot"></span>
        <span>HỆ THỐNG QUẢN TRỊ TRỰC TUYẾN • CỔNG 8080 GATEWAY</span>
      </div>

      <div className="login-card">
        <div className="login-header">
          {/* Logo hình ảnh chính hãng CTUT Gear */}
          <div className="brand-logo-container">
            <img src={logoImage} alt="CTUT Gear Logo" className="login-logo-img" />
            <div className="brand-title-wrap">
              <strong>CTUT GEAR</strong>
              <span className="logo-badge">SYSTEM ADMIN</span>
            </div>
          </div>

          <h1>Cổng Quản Trị Hệ Thống</h1>
          <p className="login-subtitle">Bảng điều khiển giám sát & vận hành Sàn TMĐT & Kho Vận Trung Tâm</p>
          
          <div className="module-badge">
            <FiShield size={14} className="badge-icon" /> Phân hệ Quản trị viên Toàn quyền (ADMIN ONLY)
          </div>
        </div>

        {/* Quick fill chip tài khoản mẫu */}
        <div className="quick-fill-box">
          <div className="quick-fill-inner">
            <span className="quick-fill-label">
              <FiZap size={15} color="#eab308" /> Tài khoản mẫu:
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

        <form className="login-form" onSubmit={handleLogin}>
          {/* Thông báo lỗi / thông tin */}
          {errorMessage && (
            <div className="login-alert error">
              {errorMessage}
            </div>
          )}

          {infoNotice && (
            <div className="login-alert success">
              <FiCheckCircle size={15} /> {infoNotice}
            </div>
          )}

          <div className="input-group">
            <label>Tài khoản quản trị <span className="required">*</span></label>
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
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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
            <a href="#forgot" className="forgot-password" onClick={(e) => { e.preventDefault(); alert('Vui lòng liên hệ quản trị hệ thống root để khôi phục mật khẩu.'); }}>
              Quên mật khẩu?
            </a>
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP HỆ THỐNG'} <FiArrowRight size={18} />
          </button>
        </form>

        <div className="security-warning">
          <LuShieldCheck size={18} className="warning-icon" />
          <p>
            Trang dành riêng cho Quản trị viên (ADMIN) có thẩm quyền.<br />
            Thủ kho, Nhân viên kho và Đối tác vui lòng truy cập đúng cổng chuyên trách.
          </p>
        </div>
      </div>

      <div className="login-footer">
        <p className="footer-brand">
          <strong>CTUT Gear Enterprise Platform v2.0</strong> • Bảo mật đa lớp RBAC
        </p>
        <p className="footer-links">
          <a href="http://localhost:5173" target="_blank" rel="noreferrer">🏢 Cổng Kho Vận (WMS) <FiExternalLink size={11} /></a>
          <span className="dot-sep">•</span>
          <a href="http://localhost:5175/seller" target="_blank" rel="noreferrer">🏪 Kênh Người Bán <FiExternalLink size={11} /></a>
          <span className="dot-sep">•</span>
          <a href="http://localhost:5175" target="_blank" rel="noreferrer">🛒 Sàn TMĐT <FiExternalLink size={11} /></a>
        </p>
        <p className="ssl-text">HỆ THỐNG BẢO MẬT 256-BIT SSL | ĐỒ ÁN TMĐT CTUT</p>
      </div>
    </div>
  );
};

export default Login;