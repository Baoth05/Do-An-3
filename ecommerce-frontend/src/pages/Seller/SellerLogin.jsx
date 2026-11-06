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
  const [taiKhoan, setTaiKhoan] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const seller = await authService.loginSeller({
        taiKhoan: taiKhoan.trim(),
        matKhau: matKhau,
      });

      // Nếu chưa có store ID được chọn, gán mặc định store 2
      if (!localStorage.getItem('seller_selected_store_id')) {
        localStorage.setItem('seller_selected_store_id', '2');
      }

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
              <p>Vui lòng nhập tài khoản quản trị gian hàng của bạn</p>
            </div>

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
                <span>Chưa có gian hàng trên sàn?</span>
                <Link to="/seller/register" className="highlight-link">
                  Đăng ký mở gian hàng & tạo kho ngay
                </Link>
              </div>

              <div className="divider-line">
                <span>HOẶC</span>
              </div>

              <div className="action-row customer-portal-row">
                <span>Bạn là khách hàng mua sắm?</span>
                <Link to="/login" className="link-customer-login">
                  Đăng nhập tài khoản Khách Hàng →
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

