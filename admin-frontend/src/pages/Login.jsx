// src/pages/Login.jsx
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiUser, FiLock, FiEye, FiEyeOff, FiShield, FiArrowRight } from 'react-icons/fi';
import './Login.css';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    login(); // Cập nhật trạng thái đã đăng nhập
    navigate('/'); // Điều hướng về trang chủ Admin
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-wrapper">
      {/* Huy hiệu trạng thái máy chủ */}
      <div className="server-status">
        <span className="status-dot"></span>
        MÁY CHỦ QUẢN TRỊ HOẠT ĐỘNG • CỔNG 443 SSL
      </div>

      <div className="login-card">
        {/* Phần Header Form */}
        <div className="login-header">
          <div className="brand-logo">
            <span className="logo-icon">🔥</span>
            <strong>CTUT GEAR</strong>
            <span className="logo-badge">OFFICIAL WEB TECH & GAMING</span>
          </div>
          <h1>Cổng Quản Trị Hệ Thống</h1>
          <p>Đăng nhập để truy cập bảng điều khiển vận hành</p>
          <div className="module-badge">
            <FiShield size={14} /> Phân hệ Quản trị viên & Vận hành WMS
          </div>
        </div>

        {/* Form Đăng Nhập */}
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>Tài khoản quản trị <span className="required">*</span></label>
            <div className="input-wrapper">
              <FiUser className="input-icon" size={18} />
              <input type="text" placeholder="Nhập tài khoản admin..." required />
            </div>
          </div>

          <div className="input-group">
            <label>Mật khẩu xác thực <span className="required">*</span></label>
            <div className="input-wrapper">
              <FiLock className="input-icon" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Nhập mật khẩu..." 
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

          <button type="submit" className="submit-btn">
            ĐĂNG NHẬP <FiArrowRight size={18} />
          </button>
        </form>

        {/* Cảnh báo bảo mật bên trong card */}
        <div className="security-warning">
          <FiShield size={16} className="warning-icon" />
          <p>
            Chỉ dành cho cán bộ quản trị và nhân viên được cấp quyền truy cập.<br />
            Mọi hành vi truy cập trái phép đều được ghi lại trong nhật ký hệ thống.
          </p>
        </div>
      </div>

      {/* Footer bản quyền */}
      <div className="login-footer">
        <p><strong>CTUT Gear Enterprise Platform v1.0.4</strong> • <FiShield size={12}/> Bảo mật đa lớp 2FA</p>
        <p className="footer-links">
          <a href="#">Hỗ trợ kỹ thuật</a> • 
          <a href="#">Điều khoản bảo mật nội bộ</a> • 
          <a href="#">Nhật ký Audit</a>
        </p>
        <p className="ssl-text">HỆ THỐNG BẢO MẬT 256-BIT SSL | ĐỒ ÁN TMĐT CTUT</p>
      </div>
    </div>
  );
};

export default Login;