// src/pages/Seller/SellerLogin.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { 
  FiShoppingBag, FiKey, FiLock, FiEye, FiEyeOff, 
  FiCheckCircle, FiShield, FiArrowRight, FiBox, FiTrendingUp 
} from 'react-icons/fi';
import './SellerLogin.css';

const SellerLogin = () => {
  const navigate = useNavigate();
  const loggedCustomer = authService.getCurrentCustomer();
  const hasStore = loggedCustomer && (
    loggedCustomer.isSeller || 
    loggedCustomer.vaiTro === 'STORE_OWNER' || 
    loggedCustomer.vaiTro === 'SELLER' ||
    !!localStorage.getItem(`seller_store_${loggedCustomer.taiKhoan}`)
  );

  const [taiKhoan, setTaiKhoan] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleQuickEnterSeller = () => {
    navigate('/seller');
  };

  const handleQuickGoRegisterStore = () => {
    navigate('/profile', { state: { activeTab: 'seller' } });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await authService.loginSeller({
        taiKhoan: taiKhoan.trim(),
        matKhau: matKhau,
      });

      window.dispatchEvent(new Event('customer-user-updated'));
      navigate('/seller');
    } catch (err) {
      setErrorMsg(err.response?.data || err.message || 'Tài khoản hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-login-page">
      <div className="seller-login-container">
        {/* Cột Trái: Quảng bá Kênh Người Bán */}
        <div className="seller-login-banner-side">
          <div className="banner-logo-row">
            <div className="merchant-badge-icon">
              <FiShoppingBag size={24} />
            </div>
            <div>
              <h3>CTUT GEAR MERCHANT</h3>
              <span>Kênh Quản Trị Người Bán Hàng & Kho Vận B2B2C</span>
            </div>
          </div>

          <div className="banner-highlight-text">
            <h2>Quản Lý Gian Hàng & Vận Hành Chuỗi Cung Ứng</h2>
            <p>
              Cổng quản trị chuyên biệt dành riêng cho Chủ Cửa Hàng: Nhập hàng trực tiếp từ Kho Tổng CTUT 
              qua hợp đồng điện tử, quản lý tồn kho kệ hàng, định giá bán lẻ và điều phối đơn hàng đa shop.
            </p>
          </div>

          <div className="seller-feature-cards">
            <div className="feat-item">
              <div className="f-icon"><FiBox /></div>
              <div>
                <strong>Khởi Tạo Kho Riêng Độc Lập</strong>
                <p>Mỗi gian hàng sở hữu một mã kho riêng, kết nối 2 tầng với Kho Tổng Trung Tâm.</p>
              </div>
            </div>

            <div className="feat-item">
              <div className="f-icon"><FiShield /></div>
              <div>
                <strong>Ký Hợp Đồng Cung Ứng Điện Tử</strong>
                <p>Nhập hàng chính hãng chuẩn Master Catalog với hợp đồng pháp lý bảo vệ quyền lợi.</p>
              </div>
            </div>

            <div className="feat-item">
              <div className="f-icon"><FiTrendingUp /></div>
              <div>
                <strong>Order Splitting & Tự Động Hóa</strong>
                <p>Đơn hàng của khách được tách tự động về shop để chuẩn bị xuất kho và bưu tá tới lấy.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cột Phải: Form Đăng Nhập */}
        <div className="seller-login-form-side">
          <div className="form-card-inner">
            <div className="login-header-text">
              <h2>Đăng Nhập Kênh Người Bán</h2>
              <p>Chủ cửa hàng sử dụng tài khoản đăng nhập chung với tài khoản Khách Hàng</p>
            </div>

            {/* Thẻ chuyển hướng nhanh nếu đã đăng nhập tài khoản Khách Hàng */}
            {loggedCustomer && (
              <div className="logged-customer-quick-box" style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '18px',
                fontSize: '13px',
                color: '#1e3a8a'
              }}>
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                  👋 Đang đăng nhập tài khoản: @{loggedCustomer.taiKhoan}
                </div>
                <div style={{ color: '#475569', marginBottom: '10px' }}>
                  {hasStore 
                    ? 'Tài khoản này đã mở gian hàng thành công!' 
                    : 'Tài khoản này chưa kích hoạt gian hàng bán hàng.'}
                </div>
                {hasStore ? (
                  <button
                    type="button"
                    onClick={handleQuickEnterSeller}
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FiShoppingBag /> Vào Thẳng Kênh Người Bán
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleQuickGoRegisterStore}
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    🚀 Mở Gian Hàng Tại Trang Cá Nhân
                  </button>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="seller-login-alert-error">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="seller-auth-form">
              <div className="input-group-seller">
                <label>Tên tài khoản quản trị</label>
                <div className="input-field-wrap">
                  <FiKey className="field-icon" />
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: admin_store / shop_apple"
                    value={taiKhoan}
                    onChange={(e) => setTaiKhoan(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group-seller">
                <label>Mật khẩu</label>
                <div className="input-field-wrap">
                  <FiLock className="field-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={matKhau}
                    onChange={(e) => setMatKhau(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-toggle-eye"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="remember-row">
                <label className="remember-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Ghi nhớ phiên đăng nhập</span>
                </label>
                <span className="demo-hint">Tài khoản demo: <code>admin</code> / <code>123456</code></span>
              </div>

              <button
                type="submit"
                className="btn-submit-seller-login"
                disabled={loading}
              >
                {loading ? 'Đang Đăng Nhập...' : 'ĐĂNG NHẬP VÀO GIAN HÀNG →'}
              </button>
            </form>

            {/* Rẽ hướng phân luồng tài khoản */}
            <div className="seller-switch-actions">
              <div className="action-row">
                <span>Chưa có tài khoản trên sàn?</span>
                <Link to="/register" className="highlight-link">
                  Đăng ký tài khoản Khách Hàng để mở shop
                </Link>
              </div>

              <div className="divider-line">
                <span>HOẶC</span>
              </div>

              <div className="action-row customer-portal-row">
                <span>Bạn muốn mua sắm công nghệ?</span>
                <Link to="/login" className="link-customer-login">
                  Đăng nhập mua hàng trên Sàn TMĐT →
                </Link>
              </div>

              <div className="back-marketplace-center">
                <Link to="/" className="link-home">
                  ← Quay lại trang chủ Sàn Mua Sắm CTUT Gear
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerLogin;

