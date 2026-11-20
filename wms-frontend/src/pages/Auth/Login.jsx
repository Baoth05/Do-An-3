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
  FiBox,
  FiAlertCircle,
  FiCheckCircle,
  FiServer,
  FiBriefcase,
  FiShoppingCart,
  FiSettings,
  FiTrendingUp,
  FiPackage
} from 'react-icons/fi';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoNotice, setInfoNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

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
    <div className="wms-login-layout">
      {/* CỘT BÊN TRÁI: Đồ họa và Thông điệp */}
      <div className="wms-login-left">
        <div className="left-content-wrapper">
          <div className="left-header-text">
            <span className="left-subtitle">CTUT • Không gian quản trị kết nối</span>
            <h1 className="left-title">Kiểm soát hôm nay.<br/>Vững bước ngày mai.</h1>
            <p className="left-desc">
              Lưu trữ, điều phối và vận hành chuỗi cung ứng.<br/>Một nền tảng để tối ưu hóa toàn bộ kho bãi của doanh nghiệp.
            </p>
          </div>

          {/* Cụm đồ họa minh họa (Mock UI) */}
          <div className="left-graphics">
            <div className="graphic-circle"></div>
            
            {/* Card Truy cập nhanh */}
            <div className="floating-card float-1">
              <h4>Cổng truy cập nhanh</h4>
              <div className="mock-input"><FiUser /> Tài khoản nhân sự</div>
              <div className="mock-input"><FiLock /> Đăng nhập hệ thống</div>
            </div>

            {/* Card Trạng thái khối lập phương */}
            <div className="floating-card float-2 center-cube">
              <div className="cube-wrapper">
                <FiBox className="cube-icon" />
              </div>
              <p>WMS Core Active</p>
            </div>

            {/* Card Thống kê */}
            <div className="floating-card float-3">
              <h4>Hiệu suất vận hành</h4>
              <div className="stat-flex">
                <div className="stat-circle">
                  <span>95%</span>
                </div>
                <div className="stat-bars">
                  <div className="bar b1"></div>
                  <div className="bar b2"></div>
                  <div className="bar b3"></div>
                  <div className="bar b4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CỘT BÊN PHẢI: Form đăng nhập */}
      <div className="wms-login-right">
        <div className="wms-login-container">
          
          <div className="wms-auth-card">
            
            {/* Header */}
            <div className="wms-auth-header">
              <div className="wms-brand-icon">
                <FiBox size={32} color="#3b82f6" />
              </div>
              <h2 className="wms-auth-title">Cổng Đăng Nhập WMS</h2>
              <p className="wms-auth-desc">Đăng nhập nhanh. Chính xác. An toàn.</p>
              
              <div className="wms-role-badge">
                <FiShield className="role-icon" />
                <span>Dành cho Cán bộ Quản lý Kho</span>
              </div>
            </div>

            {/* Báo lỗi/Thông tin */}
            {errorMessage && (
              <div className="wms-auth-error">
                <FiAlertCircle size={16} className="error-icon" />
                <span>{errorMessage}</span>
              </div>
            )}
            {infoNotice && (
              <div className="wms-auth-info">
                <FiCheckCircle size={16} />
                <span>{infoNotice}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="wms-auth-form">
              <div className="wms-field-group">
                <div className="wms-input-box">
                  <FiUser className="wms-field-icon" />
                  <input
                    id="username"
                    type="text"
                    placeholder="Mã nhân viên / Tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="wms-field-group">
                <div className="wms-input-box">
                  <FiLock className="wms-field-icon" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu hệ thống"
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
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="wms-auth-options">
                <label className="wms-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Ghi nhớ phiên bản</span>
                </label>
                <span className="wms-security-notice">
                  <FiServer size={14} style={{ marginRight: '4px' }} /> Realtime
                </span>
              </div>

              <button type="submit" className="wms-btn-submit" disabled={isLoading}>
                {isLoading ? 'ĐANG XÁC THỰC...' : 'Đăng nhập vào WMS'}
              </button>
            </form>

            <div className="wms-auth-divider">
              <span>hoặc</span>
            </div>

            {/* Điều hướng hệ thống khác */}
            <div className="wms-cross-links-grid">
              <a href="http://localhost:5173" className="cross-link-btn" target="_blank" rel="noreferrer">
                <FiShoppingCart /> Sàn TMĐT
              </a>
              <a href="http://localhost:5173/seller" className="cross-link-btn" target="_blank" rel="noreferrer">
                <FiBriefcase /> Kênh Người Bán
              </a>
              <a href="http://localhost:5174" className="cross-link-btn full-width" target="_blank" rel="noreferrer">
                <FiSettings /> Quản Trị Hệ Thống (Admin)
              </a>
            </div>

            <footer className="wms-auth-footer-inner">
              <p>Điều khoản • Bảo mật • Hướng dẫn • Cookie</p>
              <p className="copyright">Phát triển bởi CTUT • © 2026</p>
            </footer>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;