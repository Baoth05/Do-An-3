// src/pages/Auth/Login.jsx
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  FiUser, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiArrowRight, 
  FiShield, 
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
  FiExternalLink,
  FiDatabase,
  FiZap
} from 'react-icons/fi';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('thukho');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoNotice, setInfoNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
    setInfoNotice(`Đã chọn tài khoản mẫu: ${u}`);
    setTimeout(() => setInfoNotice(''), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoNotice('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ tài khoản và mật khẩu!');
      return;
    }

    try {
      setIsLoading(true);
      const result = await login(username, password);
      if (result.success) {
        if (result.offlineMode) {
          setInfoNotice('Đang đăng nhập chế độ kho bãi nội bộ...');
          setTimeout(() => navigate('/dashboard'), 600);
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrorMessage(result.message || 'Tài khoản hoặc mật khẩu không chính xác!');
      }
    } catch {
      setErrorMessage('Không thể kết nối đến máy chủ kho bãi (Port 8080)!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wms-login-overlay">
      <div className="wms-login-container">
        
        {/* 1. Thẻ trạng thái kết nối Máy chủ */}
        <div className="wms-server-badge">
          <span className="pulse-dot"></span>
          <span>HỆ THỐNG KHO TỔNG CTUT GEAR • CỔNG 8080 GATEWAY</span>
        </div>

        {/* 2. Card Đăng nhập chính */}
        <div className="wms-auth-card">
          
          {/* Header */}
          <div className="wms-auth-header">
            <div className="wms-brand-pill">
              <FiPackage className="brand-pill-icon" />
              <span className="brand-pill-title">CTUT WMS CORE PLATFORM</span>
              <span className="brand-pill-sub">KHO 2 TẦNG CHUỖI CUNG ỨNG</span>
            </div>

            <h1 className="wms-auth-title">Cổng Đăng Nhập Quản Trị Kho</h1>
            <p className="wms-auth-desc">
              Phân hệ vận hành Kho Tổng Trung Tâm & Điều phối Chuỗi Cung Ứng B2B2C
            </p>

            <div className="wms-role-pill">
              <FiShield className="role-pill-icon" />
              <span>Chỉ dành cho Thủ Kho, Quản Trị Kho & Nhân Viên Kho</span>
            </div>
          </div>

          {/* Báo lỗi nếu có */}
          {errorMessage && (
            <div className="wms-auth-error">
              <FiAlertCircle size={16} className="error-icon" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Báo thông tin nhanh nếu có */}
          {infoNotice && (
            <div className="wms-auth-info">
              <FiCheckCircle size={16} />
              <span>{infoNotice}</span>
            </div>
          )}

          {/* Gợi ý tài khoản nhanh */}
          <div className="wms-quick-fill-section">
            <span className="quick-label"><FiZap size={13} /> Chọn nhanh tài khoản kiểm thử:</span>
            <div className="quick-chips">
              <button 
                type="button" 
                className={`chip-btn ${username === 'thukho' ? 'active' : ''}`}
                onClick={() => handleQuickFill('thukho', '123456')}
              >
                📦 Thủ Kho (thukho)
              </button>
              <button 
                type="button" 
                className={`chip-btn ${username === 'admin' ? 'active' : ''}`}
                onClick={() => handleQuickFill('admin', 'admin')}
              >
                ⚡ Quản Trị (admin)
              </button>
              <button 
                type="button" 
                className={`chip-btn ${username === 'nvkho' ? 'active' : ''}`}
                onClick={() => handleQuickFill('nvkho', '123456')}
              >
                👷 Nhân Viên (nvkho)
              </button>
            </div>
          </div>

          {/* Form nhập liệu */}
          <form onSubmit={handleSubmit} className="wms-auth-form">
            
            {/* Ô nhập Tài khoản */}
            <div className="wms-field-group">
              <label htmlFor="username">Tài khoản kho / quản lý <span className="req">*</span></label>
              <div className="wms-input-box">
                <FiUser className="wms-field-icon" />
                <input
                  id="username"
                  type="text"
                  placeholder="Nhập tên tài khoản (thukho / admin)..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Ô nhập Mật khẩu */}
            <div className="wms-field-group">
              <label htmlFor="password">Mật khẩu xác thực <span className="req">*</span></label>
              <div className="wms-input-box">
                <FiLock className="wms-field-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="wms-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  aria-label="Ẩn hiện mật khẩu"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Tùy chọn Ghi nhớ */}
            <div className="wms-auth-options">
              <label className="wms-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ghi nhớ phiên làm việc</span>
              </label>
              <span className="wms-security-notice">
                <FiDatabase size={12} /> Dữ liệu đồng bộ Realtime
              </span>
            </div>

            {/* Nút Đăng nhập */}
            <button type="submit" className="wms-btn-submit" disabled={isLoading}>
              <span>{isLoading ? 'ĐANG XÁC THỰC VẬN HÀNH...' : 'ĐĂNG NHẬP HỆ THỐNG KHO'}</span>
              <FiArrowRight size={18} />
            </button>
          </form>

          {/* Chuyển hướng liên hệ nếu nhầm cổng */}
          <div className="wms-cross-links">
            <span>Bạn nhầm cổng đăng nhập?</span>
            <div className="cross-links-row">
              <a href="http://localhost:5175" className="cross-link" target="_blank" rel="noreferrer">
                🛒 Sàn Mua Hàng <FiExternalLink size={12} />
              </a>
              <a href="http://localhost:5175/seller" className="cross-link" target="_blank" rel="noreferrer">
                🏪 Kênh Người Bán <FiExternalLink size={12} />
              </a>
              <a href="http://localhost:5174" className="cross-link" target="_blank" rel="noreferrer">
                🛡️ Quản Trị Admin <FiExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Khung cảnh báo bảo mật */}
          <div className="wms-security-box">
            <FiShield className="security-icon" />
            <p>
              Hệ thống kiểm soát xuất nhập tồn kho 2 tầng chuẩn B2B2C. 
              Mọi hành động nhập xuất kho đều được ghi nhận thẻ kho tự động.
            </p>
          </div>
        </div>

        {/* 3. Footer bên ngoài Card */}
        <footer className="wms-auth-footer">
          <p className="f-line-1">
            <strong>CTUT WMS Enterprise Platform v2.0</strong> • Kho Tổng Cần Thơ Logistics
          </p>
          <p className="f-line-2">
            Bảo Mật 256-Bit SSL • Phân Quyền RBAC Phân Hệ Kho
          </p>
        </footer>

      </div>
    </div>
  );
};

export default Login;
