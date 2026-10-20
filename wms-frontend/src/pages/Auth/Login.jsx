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
  FiPackage 
} from 'react-icons/fi';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ tài khoản và mật khẩu!');
      return;
    }

    try {
      setIsLoading(true);
      const result = await login(username, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrorMessage(result.message || 'Tài khoản hoặc mật khẩu không chính xác!');
      }
    } catch {
      setErrorMessage('Không thể kết nối đến máy chủ kho bãi!');
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
          <span>MÁY CHỦ KHO BÃI HOẠT ĐỘNG • CỔNG 8081 WMS-CORE</span>
        </div>

        {/* 2. Card Đăng nhập chính */}
        <div className="wms-auth-card">
          
          {/* Header */}
          <div className="wms-auth-header">
            <div className="wms-brand-pill">
              <FiPackage className="brand-pill-icon" />
              <span className="brand-pill-title">CTUT WMS CORE</span>
              <span className="brand-pill-sub">SYSTEM WAREHOUSE LOGISTICS</span>
            </div>

            <h1 className="wms-auth-title">Cổng Đăng Nhập Quản Lý Kho</h1>
            <p className="wms-auth-desc">
              Đăng nhập để truy cập bảng điều khiển vận hành xuất nhập tồn
            </p>

            <div className="wms-role-pill">
              <FiShield className="role-pill-icon" />
              <span>Phân Hệ Thủ Kho & Quản Lý Kho Bãi</span>
            </div>
          </div>

          {/* Báo lỗi nếu có */}
          {errorMessage && (
            <div className="wms-auth-error">
              {errorMessage}
            </div>
          )}

          {/* Form nhập liệu */}
          <form onSubmit={handleSubmit} className="wms-auth-form">
            
            {/* Ô nhập Tài khoản */}
            <div className="wms-field-group">
              <label htmlFor="username">Tài khoản thủ kho / quản lý <span className="req">*</span></label>
              <div className="wms-input-box">
                <FiUser className="wms-field-icon" />
                <input
                  id="username"
                  type="text"
                  placeholder="Nhập tên tài khoản..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
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

            {/* Tùy chọn Ghi nhớ & Quên mật khẩu */}
            <div className="wms-auth-options">
              <label className="wms-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ghi nhớ phiên đăng nhập</span>
              </label>
              <a href="#forgot" className="wms-forgot-link" onClick={(e) => e.preventDefault()}>
                Quên mật khẩu?
              </a>
            </div>

            {/* Nút Đăng nhập */}
            <button type="submit" className="wms-btn-submit" disabled={isLoading}>
              <span>{isLoading ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP'}</span>
              <FiArrowRight size={18} />
            </button>
          </form>

          {/* Khung cảnh báo bảo mật */}
          <div className="wms-security-box">
            <FiShield className="security-icon" />
            <p>
              Chỉ dành cho cán bộ quản lý kho và thủ kho được cấp quyền truy cập. 
              Mọi hành vi truy cập trái phép đều được ghi lại trong nhật ký hệ thống.
            </p>
          </div>
        </div>

        {/* 3. Footer bên ngoài Card */}
        <footer className="wms-auth-footer">
          <p className="f-line-1">
            <strong>CTUT WMS Enterprise Platform v1.0.4</strong> • <FiShield size={12} /> Bảo mật hệ thống kho
          </p>
          <p className="f-line-2">
            Hỗ trợ kỹ thuật • Điều khoản bảo mật nội bộ • Nhật ký Audit
          </p>
          <p className="f-line-3">
            HỆ THỐNG BẢO MẬT WMS 256-BIT SSL | ĐỒ ÁN TMĐT CTUT
          </p>
        </footer>

      </div>
    </div>
  );
};

export default Login;