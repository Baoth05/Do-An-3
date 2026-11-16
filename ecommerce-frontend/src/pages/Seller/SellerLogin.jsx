// src/pages/Seller/SellerLogin.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import {
  FiShoppingBag, FiKey, FiLock, FiEye, FiEyeOff,
  FiCheckCircle, FiShield, FiArrowRight, FiBox, FiTrendingUp,
  FiZap, FiAlertCircle, FiArrowLeft, FiUserCheck
} from 'react-icons/fi';
import './SellerLogin.css';

const SellerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Kiểm tra nếu đã có phiên Khách Hàng đăng nhập trên Sàn
  const [activeCustomer, setActiveCustomer] = useState(() => authService.getCurrentCustomer());

  // Để trống dữ liệu đăng nhập, yêu cầu người dùng tự nhập
  const [taiKhoan, setTaiKhoan] = useState('');
  const [matKhau, setMatKhau] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(location.state?.message || '');
  const [infoNotice, setInfoNotice] = useState('');

  useEffect(() => {
    const cust = authService.getCurrentCustomer();
    if (cust) {
      setActiveCustomer(cust);
    }
  }, []);

  // Chuyển đổi liền mạch từ phiên Khách Hàng sang Kênh Người Bán (1 chạm)
  const handleQuickSwitchFromCustomer = () => {
    if (!activeCustomer) return;
    setLoading(true);
    setErrorMsg('');
    try {
      authService.syncSellerFromCustomer(activeCustomer);
      window.dispatchEvent(new Event('seller-user-updated'));
      navigate('/seller');
    } catch (err) {
      setErrorMsg('Lỗi chuyển đổi phiên người bán: ' + (err.message || 'Không thể đồng bộ!'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoNotice('');

    if (!taiKhoan.trim() || !matKhau.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ tên tài khoản và mật khẩu người bán!');
      return;
    }

    setLoading(true);

    try {
      await authService.loginSeller({
        taiKhoan: taiKhoan.trim(),
        matKhau: matKhau,
      });

      window.dispatchEvent(new Event('seller-user-updated'));
      navigate('/seller');
    } catch (err) {
      const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : null) || err.message || 'Tài khoản hoặc mật khẩu người bán không chính xác!';
      setErrorMsg(msg);
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
              <span>Cổng Quản Trị Người Bán Hàng & Kho Vận B2B2C</span>
            </div>
          </div>

          <div className="banner-highlight-text">
            <h2>Quản Lý Gian Hàng & Vận Hành Chuỗi Cung Ứng</h2>
            <p>
              Hệ thống quản trị chuyên biệt dành riêng cho Chủ Cửa Hàng: Nhập hàng trực tiếp từ Kho Tổng CTUT
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

          <div className="merchant-footer-note">
            <span>🛡️ Bảo mật phân hệ Người Bán 256-bit SSL • RBAC Seller Model</span>
          </div>
        </div>

        {/* Cột Phải: Form Đăng Nhập Dành Riêng Cho Model Người Bán */}
        <div className="seller-login-form-side">
          <div className="form-card-inner">
            <div className="login-header-text">
              <div className="seller-model-badge">
                <FiShield size={13} /> MODEL NGƯỜI BÁN HÀNG (SELLER ONLY)
              </div>
              <h2>Cổng Đăng Nhập Kênh Người Bán</h2>
              <p>Dành riêng cho Chủ Gian Hàng & Đối Tác Kinh Doanh trên sàn CTUT Gear</p>
            </div>

            {/* Thẻ Chuyển Đổi Nhanh Nếu Đã Có Phiên Khách Hàng Đăng Nhập */}
            {activeCustomer && (
              <div className="seller-quick-switch-card">
                <div className="sqs-top">
                  <div className="sqs-icon-wrap">
                    <FiUserCheck size={20} />
                  </div>
                  <div className="sqs-info">
                    <span className="sqs-badge">Tài khoản Khách Hàng sẵn sàng</span>
                    <strong>@{activeCustomer.taiKhoan} ({activeCustomer.hoTen || activeCustomer.taiKhoan})</strong>
                    <p>Bạn đang đăng nhập tài khoản này trên Sàn Mua Sắm.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-quick-switch-seller"
                  onClick={handleQuickSwitchFromCustomer}
                  disabled={loading}
                >
                  <FiZap size={15} /> Chuyển Ngay Sang Kênh Người Bán (Không Cần Nhập Lại Pass) →
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="seller-login-alert-error">
                <FiAlertCircle size={18} className="err-icon" />
                <span>{errorMsg}</span>
              </div>
            )}

            {infoNotice && (
              <div className="seller-login-alert-info">
                <FiCheckCircle size={16} />
                <span>{infoNotice}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="seller-auth-form">
              <div className="input-group-seller">
                <label>Tài khoản Người Bán / Chủ Shop <span className="req">*</span></label>
                <div className="input-field-wrap">
                  <FiKey className="field-icon" />
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: admin, seller_minhquan..."
                    value={taiKhoan}
                    onChange={(e) => setTaiKhoan(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="input-group-seller">
                <label>Mật khẩu xác thực <span className="req">*</span></label>
                <div className="input-field-wrap">
                  <FiLock className="field-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={matKhau}
                    onChange={(e) => setMatKhau(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="btn-toggle-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    aria-label="Ẩn hiện mật khẩu"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="remember-row">
                <label className="remember-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Ghi nhớ phiên quản trị shop</span>
                </label>
                <a href="#forgot" className="forgot-seller-link" onClick={(e) => { e.preventDefault(); alert('Vui lòng liên hệ ban quản trị sàn CTUT Gear qua hotline 1900-888-CTUT để khôi phục quyền quản lý shop.'); }}>
                  Quên mật khẩu?
                </a>
              </div>

              <button
                type="submit"
                className="btn-submit-seller-login"
                disabled={loading}
              >
                <span>{loading ? 'Đang Xác Thực Người Bán...' : 'ĐĂNG NHẬP VÀO GIAN HÀNG'}</span>
                <FiArrowRight size={18} />
              </button>
            </form>

            {/* Phân luồng đăng ký & chuyển đổi model */}
            <div className="seller-switch-actions">
              <div className="action-row">
                <span>Chưa có gian hàng bán hàng?</span>
                <Link to="/seller/register" className="highlight-link">
                  Đăng ký mở gian hàng mới ngay →
                </Link>
              </div>

              <div className="divider-line">
                <span>HOẶC</span>
              </div>

              <div className="action-row customer-portal-row">
                <span>Bạn muốn mua sắm thiết bị?</span>
                <Link to="/login" className="link-customer-login">
                  Chuyển sang Cổng Mua Hàng Khách Hàng →
                </Link>
              </div>

              <div className="back-marketplace-center">
                <Link to="/" className="link-home">
                  <FiArrowLeft size={13} /> Quay lại trang chủ Sàn TMĐT CTUT Gear
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