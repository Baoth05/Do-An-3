// src/pages/Seller/SellerLogin.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import {
  FiKey,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiShield,
  FiArrowRight,
  FiBox,
  FiTrendingUp,
  FiZap,
  FiAlertCircle,
  FiArrowLeft,
  FiUserCheck,
  FiHeadphones,
  FiShoppingCart,
  FiUserPlus,
  FiAward,
  FiLoader
} from 'react-icons/fi';

// Import trực tiếp logo mới từ thư mục src/assets
import ctutLogo from '../../assets/Glossy Red and White Gaming Logo.png';
import './SellerLogin.css';

const SellerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Kiểm tra nếu đã có phiên Khách Hàng đăng nhập trên Sàn
  const [activeCustomer, setActiveCustomer] = useState(() => authService.getCurrentCustomer());

  // State lưu thông tin form đăng nhập
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
  const handleQuickSwitchFromCustomer = async () => {
    if (!activeCustomer) return;
    const role = (activeCustomer.vaiTro || '').toUpperCase();
    const isAlreadySeller = role === 'STORE_OWNER' || role === 'SELLER' || role === 'ADMIN';

    if (
      !isAlreadySeller &&
      !window.confirm(
        'Tài khoản của bạn sẽ được nâng cấp thành Chủ Cửa Hàng và hệ thống sẽ mở 1 gian hàng mới cho bạn. Tiếp tục?'
      )
    ) {
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await authService.syncSellerFromCustomer(activeCustomer);
      window.dispatchEvent(new Event('seller-user-updated'));
      navigate('/seller');
    } catch (err) {
      setErrorMsg('Lỗi chuyển đổi phiên người bán: ' + (err.message || 'Không thể đồng bộ!'));
    } finally {
      setLoading(false);
    }
  };

  // Xử lý gửi form đăng nhập Người Bán
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
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response?.data : null) ||
        err.message ||
        'Tài khoản hoặc mật khẩu người bán không chính xác!';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSupportClick = (e) => {
    e.preventDefault();
    alert('Tổng đài hỗ trợ Đối tác CTUT Gear: 1900-888-CTUT (8:00 - 22:00 hàng ngày).');
  };

  return (
    <div className="seller-login-wrapper">
      {/* Hiệu ứng nền chuyển động sinh động */}
      <div className="seller-bg-effects" aria-hidden="true">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
        <div className="bg-grid-pattern"></div>
      </div>

      {/* ================= HEADER KÊNH NGƯỜI BÁN ================= */}
      <header className="seller-top-header">
        <div className="header-inner">
          <Link to="/" className="header-brand">
            <div className="header-logo-frame">
              <img src={ctutLogo} alt="CTUT Gear Logo" className="header-logo-img" />
            </div>
            <div className="header-brand-text">
              <div className="brand-title-line">
                <span className="brand-name">CTUT GEAR</span>
                <span className="brand-divider">|</span>
                <span className="brand-portal-pill">Kênh Người Bán</span>
              </div>
              <span className="brand-sub">Hệ thống Quản trị Gian hàng &amp; Chuỗi cung ứng B2B2C</span>
            </div>
          </Link>

          <nav className="header-nav-actions">
            <a href="#support" className="header-nav-link" onClick={handleSupportClick}>
              <FiHeadphones size={16} />
              <span>Hỗ trợ Đối tác</span>
            </a>
            <Link to="/" className="header-nav-link">
              <FiShoppingCart size={16} />
              <span>Sàn Mua Sắm</span>
            </Link>
            <Link to="/seller/register" className="header-btn-register">
              <FiUserPlus size={15} />
              <span>Mở Gian Hàng</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* ================= NỘI DUNG CHÍNH 2 CỘT ================= */}
      <main className="seller-login-page">
        <div className="seller-login-container">
          {/* CỘT TRÁI: Form giới thiệu CTUT GEAR MERCHANT */}
          <section className="seller-login-banner-side">
            <div className="banner-decor-circle circle-top"></div>
            <div className="banner-decor-circle circle-bottom"></div>

            <div className="banner-content-z">
              <div className="banner-logo-row animate-stagger-1">
                <div className="merchant-logo-box">
                  <img src={ctutLogo} alt="CTUT Gear Merchant" className="merchant-logo-img" />
                </div>
                <div>
                  <div className="merchant-title-wrap">
                    <h3>CTUT GEAR MERCHANT</h3>
                    <span className="verified-tag">
                      <FiAward size={12} /> OFFICIAL
                    </span>
                  </div>
                  <span className="merchant-subtitle">Cổng Quản Trị Người Bán &amp; Kho Vận B2B2C</span>
                </div>
              </div>

              <div className="banner-highlight-text animate-stagger-2">
                <h2>Quản Lý Gian Hàng &amp; Vận Hành Chuỗi Cung Ứng</h2>
                <p>
                  Hệ thống quản trị chuyên biệt dành riêng cho Chủ Cửa Hàng: Nhập hàng trực tiếp từ
                  Kho Tổng CTUT qua hợp đồng điện tử, kiểm soát tồn kho thời gian thực và điều phối
                  đơn hàng đa shop tự động.
                </p>
              </div>

              <div className="seller-feature-cards">
                <div className="feat-item animate-stagger-3">
                  <div className="f-icon-wrap">
                    <FiBox size={20} />
                  </div>
                  <div>
                    <strong>Khởi Tạo Kho Riêng Độc Lập</strong>
                    <p>Mỗi gian hàng sở hữu mã kho riêng, đồng bộ 2 tầng với Kho Tổng Trung Tâm.</p>
                  </div>
                </div>

                <div className="feat-item animate-stagger-4">
                  <div className="f-icon-wrap">
                    <FiShield size={20} />
                  </div>
                  <div>
                    <strong>Ký Hợp Đồng Cung Ứng Điện Tử</strong>
                    <p>Nhập hàng chính hãng chuẩn Master Catalog với hợp đồng pháp lý minh bạch.</p>
                  </div>
                </div>

                <div className="feat-item animate-stagger-5">
                  <div className="f-icon-wrap">
                    <FiTrendingUp size={20} />
                  </div>
                  <div>
                    <strong>Order Splitting &amp; Tự Động Hóa</strong>
                    <p>Đơn hàng được tách tự động về shop để đóng gói nhanh và bàn giao vận chuyển.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="merchant-footer-note animate-stagger-5">
              <FiShield size={15} className="footer-shield-icon" />
              <span>Bảo mật phân hệ Người Bán 256-bit SSL • Chuẩn phân quyền RBAC</span>
            </div>
          </section>

          {/* CỘT PHẢI: Form Đăng Nhập Kênh Người Bán */}
          <section className="seller-login-form-side">
            <div className="form-card-inner">
              <div className="login-header-text animate-stagger-1">
                <div className="seller-model-badge">
                  <span className="badge-pulse-dot"></span>
                  <FiShield size={13} />
                  <span>MODEL NGƯỜI BÁN HÀNG (SELLER ONLY)</span>
                </div>
                <h2>Đăng Nhập Kênh Người Bán</h2>
                <p>Dành riêng cho Chủ Gian Hàng &amp; Đối Tác Kinh Doanh trên sàn CTUT Gear</p>
              </div>

              {/* Thẻ Chuyển Đổi Nhanh Nếu Đã Có Phiên Khách Hàng Đăng Nhập */}
              {activeCustomer && (
                <div className="seller-quick-switch-card animate-stagger-2">
                  <div className="sqs-top">
                    <div className="sqs-icon-wrap">
                      <FiUserCheck size={20} />
                    </div>
                    <div className="sqs-info">
                      <span className="sqs-badge">Phiên khách hàng khả dụng</span>
                      <strong>
                        @{activeCustomer.taiKhoan} ({activeCustomer.hoTen || activeCustomer.taiKhoan})
                      </strong>
                      <p>Bạn đang đăng nhập tài khoản này trên Sàn Mua Sắm.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-quick-switch-seller"
                    onClick={handleQuickSwitchFromCustomer}
                    disabled={loading}
                  >
                    <FiZap size={16} />
                    <span>Chuyển Ngay Sang Kênh Người Bán (1 Chạm)</span>
                    <FiArrowRight size={15} className="btn-arrow-icon" />
                  </button>
                </div>
              )}

              {/* Thông báo lỗi */}
              {errorMsg && (
                <div className="seller-login-alert-error" role="alert">
                  <FiAlertCircle size={18} className="err-icon" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Thông báo thành công / thông tin */}
              {infoNotice && (
                <div className="seller-login-alert-info" role="status">
                  <FiCheckCircle size={17} />
                  <span>{infoNotice}</span>
                </div>
              )}

              {/* Form nhập tài khoản & mật khẩu */}
              <form onSubmit={handleLogin} className="seller-auth-form animate-stagger-3">
                <div className="input-group-seller">
                  <label htmlFor="seller-username">
                    Tài khoản Người Bán / Chủ Shop <span className="req">*</span>
                  </label>
                  <div className="input-field-wrap">
                    <FiKey className="field-icon" />
                    <input
                      id="seller-username"
                      type="text"
                      required
                      placeholder="Ví dụ: admin, seller_minhquan..."
                      value={taiKhoan}
                      onChange={(e) => setTaiKhoan(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="input-group-seller">
                  <label htmlFor="seller-password">
                    Mật khẩu xác thực <span className="req">*</span>
                  </label>
                  <div className="input-field-wrap">
                    <FiLock className="field-icon" />
                    <input
                      id="seller-password"
                      type={showPassword ? 'text' : 'password'}
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
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
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
                  <a
                    href="#forgot"
                    className="forgot-seller-link"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(
                        'Vui lòng liên hệ ban quản trị sàn CTUT Gear qua hotline 1900-888-CTUT để khôi phục quyền quản lý shop.'
                      );
                    }}
                  >
                    Quên mật khẩu?
                  </a>
                </div>

                <button
                  type="submit"
                  className="btn-submit-seller-login"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FiLoader size={18} className="icon-spin" />
                      <span>Đang Xác Thực Người Bán...</span>
                    </>
                  ) : (
                    <>
                      <span>ĐĂNG NHẬP VÀO GIAN HÀNG</span>
                      <FiArrowRight size={18} className="btn-arrow-icon" />
                    </>
                  )}
                </button>
              </form>

              {/* Các liên kết điều hướng phụ */}
              <div className="seller-switch-actions animate-stagger-4">
                <div className="action-row">
                  <span>Chưa có gian hàng bán hàng?</span>
                  <Link to="/seller/register" className="highlight-link">
                    Đăng ký mở gian hàng ngay →
                  </Link>
                </div>

                <div className="divider-line">
                  <span>HOẶC</span>
                </div>

                <div className="action-row customer-portal-row">
                  <span>Bạn muốn mua sắm thiết bị?</span>
                  <Link to="/login" className="link-customer-login">
                    Chuyển sang Cổng Khách Hàng →
                  </Link>
                </div>

                <div className="back-marketplace-center">
                  <Link to="/" className="link-home">
                    <FiArrowLeft size={14} />
                    <span>Quay lại trang chủ Sàn TMĐT CTUT Gear</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SellerLogin;