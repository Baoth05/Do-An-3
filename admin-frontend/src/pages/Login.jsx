// src/pages/Login.jsx
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/authService';
import { FiUser, FiLock, FiEye, FiEyeOff, FiShield, FiArrowRight, FiZap, FiExternalLink } from 'react-icons/fi';
import './Login.css';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Các state để lưu trữ dữ liệu form và trạng thái
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoNotice, setInfoNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick fill helper
  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
    setInfoNotice(`Đã chọn tài khoản mẫu: ${u}`);
    setTimeout(() => setInfoNotice(''), 2500);
  };

  // Hàm xử lý hành động khi nhấn nút ĐĂNG NHẬP
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoNotice('');
    setIsLoading(true);

    try {
      // 1. Gọi API đăng nhập tới Backend Spring Boot
      const response = await authService.login(username.trim(), password.trim());
      const data = response.data || response;
      const { token, hoTen, vaiTro, taiKhoan } = data;

      // 🌟 KIỂM TRA PHÂN QUYỀN RBAC: Chỉ duy nhất ADMIN mới có quyền truy cập Cổng Quản Trị
      if (vaiTro && vaiTro !== 'ADMIN') {
        setErrorMessage(`Từ chối truy cập: Tài khoản của bạn có vai trò [${vaiTro}]. Chỉ Quản trị viên (ADMIN) mới có quyền truy cập Cổng Quản Trị Hệ Thống!`);
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
      <div className="server-status">
        <span className="status-dot"></span>
        MÁY CHỦ QUẢN TRỊ HOẠT ĐỘNG • CỔNG 8080 GATEWAY
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="brand-logo">
            <span className="logo-icon">🔥</span>
            <strong>CTUT GEAR</strong>
            <span className="logo-badge">SYSTEM ADMIN PORTAL</span>
          </div>
          <h1>Cổng Quản Trị Hệ Thống</h1>
          <p>Bảng điều khiển vận hành Sàn TMĐT & Kho Hàng Trung Tâm</p>
          <div className="module-badge">
            <FiShield size={14} /> Phân hệ Quản trị viên Toàn quyền (ADMIN ONLY)
          </div>
        </div>

        {/* Quick fill chip */}
        <div style={{ padding: '0 32px', marginTop: '16px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FiZap size={14} color="#f59e0b" /> Tài khoản mẫu:
            </span>
            <button 
              type="button" 
              onClick={() => handleQuickFill('admin', 'admin')}
              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
            >
              👑 admin / admin
            </button>
          </div>
        </div>

        <form className="login-form" onSubmit={handleLogin} style={{ padding: '20px 32px 32px 32px' }}>
          {/* Hiển thị lỗi nếu có */}
          {errorMessage && (
            <div className="error-message" style={{ color: '#dc2626', background: '#fee2e2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', textAlign: 'center', fontWeight: '600' }}>
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
              <input type="checkbox" defaultChecked />
              <span>Ghi nhớ phiên đăng nhập</span>
            </label>
            <a href="#forgot" className="forgot-password" onClick={(e) => { e.preventDefault(); alert('Vui lòng liên hệ quản trị hệ thống root để khôi phục.'); }}>
              Quên mật khẩu?
            </a>
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP HỆ THỐNG'} <FiArrowRight size={18} />
          </button>
        </form>

        <div className="security-warning">
          <FiShield size={16} className="warning-icon" />
          <p>
            Chỉ dành cho Quản trị viên (ADMIN) được cấp quyền toàn hệ thống.<br />
            Thủ kho, Nhân viên kho, Chủ shop và Khách hàng vui lòng truy cập đúng cổng phân hệ của mình.
          </p>
        </div>
      </div>

      <div className="login-footer">
        <p><strong>CTUT Gear Enterprise Platform v2.0</strong> <FiShield size={12} /> Bảo mật đa lớp RBAC</p>
        <p className="footer-links">
          <a href="http://localhost:5173" target="_blank" rel="noreferrer">🏢 Cổng Kho Vận (WMS) <FiExternalLink size={11} /></a>
          <span style={{ margin: '0 8px', color: '#94a3b8' }}>•</span>
          <a href="http://localhost:5175/seller" target="_blank" rel="noreferrer">🏪 Kênh Người Bán <FiExternalLink size={11} /></a>
          <span style={{ margin: '0 8px', color: '#94a3b8' }}>•</span>
          <a href="http://localhost:5175" target="_blank" rel="noreferrer">🛒 Sàn TMĐT <FiExternalLink size={11} /></a>
        </p>
        <p className="ssl-text">HỆ THỐNG BẢO MẬT 256-BIT SSL | ĐỒ ÁN TMĐT CTUT</p>
      </div>
    </div>
  );
};

export default Login;
