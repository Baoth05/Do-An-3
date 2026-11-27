// src/pages/CustomerRegister.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
// Import trực tiếp logo hệ thống từ thư mục src/assets
import systemLogo from '../assets/Glossy Red and White Gaming Logo.png';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiKey,
  FiMapPin,
  FiCheckCircle,
  FiShield,
  FiArrowRight,
  FiArrowLeft,
  FiShoppingBag,
  FiTruck,
  FiGift,
  FiEye,
  FiEyeOff,
  FiHelpCircle,
  FiHome,
  FiHeadphones,
  FiAlertCircle,
  FiZap,
  FiCheck,
  FiXCircle,
  FiAward,
  FiUserPlus,
  FiLogIn,
} from 'react-icons/fi';
import './CustomerRegister.css';

const CustomerRegister = () => {
  const navigate = useNavigate();

  // State lưu dữ liệu các ô nhập trong form
  const [formData, setFormData] = useState({
    taiKhoan: '',
    matKhau: '',
    xacNhanMatKhau: '',
    hoTen: '',
    email: '',
    soDienThoai: '',
    diaChi: '',
  });

  // State điều khiển nút con mắt ẩn/hiện mật khẩu cho từng ô
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State trạng thái xử lý và thông báo
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Đánh giá độ mạnh của mật khẩu để vẽ thanh trạng thái
  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, label: '', className: '' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8 && /[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { level: 1, label: 'Mật khẩu yếu', className: 'weak' };
    if (score === 2) return { level: 2, label: 'Độ mạnh trung bình', className: 'medium' };
    return { level: 3, label: 'Mật khẩu rất mạnh', className: 'strong' };
  };

  const passwordStrength = getPasswordStrength(formData.matKhau);

  // Kiểm tra nhanh trạng thái khớp mật khẩu xác nhận
  const hasConfirmInput = formData.xacNhanMatKhau.length > 0;
  const isPasswordMatched =
    hasConfirmInput && formData.matKhau === formData.xacNhanMatKhau;
  const isPasswordMismatched =
    hasConfirmInput && formData.matKhau !== formData.xacNhanMatKhau;

  // Xử lý sự kiện nhấn nút Tạo tài khoản
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.matKhau.length < 6) {
      setErrorMsg('Mật khẩu phải chứa ít nhất 6 ký tự!');
      return;
    }

    if (formData.matKhau !== formData.xacNhanMatKhau) {
      setErrorMsg('Mật khẩu và xác nhận mật khẩu không trùng khớp!');
      return;
    }

    if (!agreed) {
      setErrorMsg('Vui lòng chấp thuận Điều khoản dịch vụ & Chính sách bảo mật của CTUT Gear!');
      return;
    }

    setLoading(true);
    try {
      // 1. Gọi API đăng ký tài khoản khách hàng
      await authService.registerCustomer({
        taiKhoan: formData.taiKhoan.trim(),
        matKhau: formData.matKhau,
        hoTen: formData.hoTen.trim(),
        email: formData.email.trim(),
        soDienThoai: formData.soDienThoai.trim(),
        diaChi: formData.diaChi.trim(),
      });

      // 2. Tự động đăng nhập ngay sau khi đăng ký thành công
      await authService.loginCustomer({
        taiKhoan: formData.taiKhoan.trim(),
        matKhau: formData.matKhau,
      });

      // 3. Khởi tạo bộ 3 Voucher chào mừng lưu vào localStorage
      const welcomeVouchers = [
        {
          id: 'welcome-1',
          maVoucher: 'CTUT50K',
          phanTramGiam: 10,
          giamToiDa: 50000,
          donHangToiThieu: 150000,
          soLuongConLai: 500,
          moTa: '🎁 Quà Chào Mừng Thành Viên Mới - Giảm 10% tối đa 50.000đ toàn sàn',
        },
        {
          id: 'welcome-2',
          maVoucher: 'FREESHIP',
          phanTramGiam: 100,
          giamToiDa: 30000,
          donHangToiThieu: 200000,
          soLuongConLai: 1000,
          moTa: '🚚 Miễn phí vận chuyển toàn quốc 30.000đ cho đơn từ 200.000đ',
        },
        {
          id: 'welcome-3',
          maVoucher: 'CTUTNEW50',
          phanTramGiam: 15,
          giamToiDa: 50000,
          donHangToiThieu: 150000,
          soLuongConLai: 500,
          moTa: '🎉 Ưu đãi đơn hàng đầu tiên - Giảm ngay 15% tối đa 50.000đ',
        },
      ];

      localStorage.setItem(
        `customer_vouchers_${formData.taiKhoan.trim()}`,
        JSON.stringify(welcomeVouchers)
      );
      localStorage.setItem('user_saved_vouchers', JSON.stringify(welcomeVouchers));
      window.dispatchEvent(new Event('customer-user-updated'));

      setSuccessNotice('Đăng ký thành công! Đã tặng 3 Voucher chào mừng vào ví của bạn.');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setErrorMsg(
        err.response?.data || err.message || 'Lỗi khi đăng ký tài khoản. Vui lòng thử lại!'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-wrapper">
      {/* Nền ánh sáng chuyển động phía sau trang */}
      <div className="register-bg-decor" aria-hidden="true">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
      </div>

      {/* ================= THANH HEADER CHUYÊN NGHIỆP ================= */}
      <header className="register-header">
        {/* Tầng 1: Thanh tiện ích nhanh */}
        <div className="register-topbar">
          <div className="register-header-inner">
            <div className="topbar-left">
              <Link to="/seller/login" className="topbar-link">
                <FiShoppingBag size={13} /> Kênh Người Bán
              </Link>
              <span className="topbar-divider">|</span>
              <span className="topbar-badge">
                <FiZap size={12} /> 100% Chính Hãng Kho Tổng
              </span>
            </div>

            <div className="topbar-right">
              <a href="#support" className="topbar-link" onClick={(e) => e.preventDefault()}>
                <FiHeadphones size={13} /> Hotline: 1900 8888
              </a>
              <span className="topbar-divider">|</span>
              <a href="#help" className="topbar-link" onClick={(e) => e.preventDefault()}>
                <FiHelpCircle size={13} /> Trung tâm Trợ giúp
              </a>
            </div>
          </div>
        </div>

        {/* Tầng 2: Điều hướng chính kèm Logo hệ thống */}
        <div className="register-main-nav">
          <div className="register-header-inner">
            <div className="nav-brand-group">
              <Link to="/" className="header-logo">
                <div className="header-logo-img-wrap">
                  <img
                    src={systemLogo}
                    alt="CTUT Gear Logo"
                    className="header-logo-img"
                  />
                </div>
                <div className="header-logo-text">
                  <strong>
                    CTUT <span>GEAR</span>
                  </strong>
                  <small>SÀN CÔNG NGHỆ B2B2C</small>
                </div>
              </Link>
              <span className="header-page-divider"></span>
              <span className="header-page-title">Đăng Ký Tài Khoản</span>
            </div>

            <div className="nav-actions-group">
              <Link to="/" className="nav-btn-ghost">
                <FiHome size={15} />
                <span>Trang Chủ</span>
              </Link>
              <Link to="/login" className="nav-btn-primary">
                <FiLogIn size={15} />
                <span>Đăng Nhập</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ================= NỘI DUNG CHÍNH ================= */}
      <main className="customer-register-page">
        <div className="customer-register-container">
          {/* CỘT TRÁI: KHỐI CAM THƯƠNG HIỆU & QUYỀN LỢI (CÓ HIỆU ỨNG ĐỘNG) */}
          <aside className="register-benefits-side">
            {/* Các lớp hiệu ứng động nền cam */}
            <div className="benefits-pattern-overlay" aria-hidden="true"></div>
            <div className="orange-glow-shape shape-top" aria-hidden="true"></div>
            <div className="orange-glow-shape shape-bottom" aria-hidden="true"></div>
            <div className="orange-orbit-ring" aria-hidden="true"></div>
            <div className="orange-gloss-sweep" aria-hidden="true"></div>

            <div className="benefits-content">
              <div className="benefits-intro anim-stagger-2">
                <div className="promo-pill">
                  <FiGift size={13} /> Tặng ngay bộ 3 Voucher cho thành viên mới
                </div>
                <h2>Tạo Tài Khoản Khách Hàng Ngay Hôm Nay!</h2>
                <p>
                  Trải nghiệm mua sắm thiết bị công nghệ chính hãng từ hệ thống kho tổng chuẩn
                  B2B2C cùng hàng ngàn ưu đãi độc quyền mỗi ngày.
                </p>
              </div>

              {/* Thanh chỉ số nổi bật */}
              <div className="benefits-metrics anim-stagger-2">
                <div className="metric-chip">
                  <FiAward size={14} />
                  <span>100% Chính hãng</span>
                </div>
                <div className="metric-chip">
                  <FiTruck size={14} />
                  <span>Giao nhanh 24h</span>
                </div>
                <div className="metric-chip">
                  <FiGift size={14} />
                  <span>3 Voucher quà</span>
                </div>
              </div>

              {/* Danh sách quyền lợi dạng thẻ kính nổi */}
              <div className="benefits-list">
                <div className="benefit-item anim-stagger-3">
                  <div className="b-icon">
                    <FiGift />
                  </div>
                  <div>
                    <strong>Voucher Giảm 50.000đ Chào Mừng</strong>
                    <p>Nhận ngay mã ưu đãi toàn sàn áp dụng cho đơn hàng đầu tiên.</p>
                  </div>
                </div>

                <div className="benefit-item anim-stagger-4">
                  <div className="b-icon">
                    <FiTruck />
                  </div>
                  <div>
                    <strong>Miễn Phí Vận Chuyển Toàn Quốc</strong>
                    <p>Tách đơn tự động theo shop, giao hàng siêu tốc từ 24h - 48h.</p>
                  </div>
                </div>

                <div className="benefit-item anim-stagger-5">
                  <div className="b-icon">
                    <FiShield />
                  </div>
                  <div>
                    <strong>Bảo Hành 1 Đổi 1 Tại Kho Tổng</strong>
                    <p>Cam kết 100% hàng chính hãng Master Catalog, an tâm tuyệt đối.</p>
                  </div>
                </div>
              </div>

              {/* Hộp gợi ý mở gian hàng */}
              <div className="register-seller-teaser anim-stagger-6">
                <div className="teaser-title">
                  <FiShoppingBag size={15} />
                  <span>Bạn muốn mở gian hàng kinh doanh trên sàn?</span>
                </div>
                <p>
                  Chỉ cần đăng ký tài khoản thành viên tại đây. Sau khi đăng nhập, bạn có thể kích
                  hoạt mở gian hàng & kho riêng ngay trong <strong>Trang Cá Nhân</strong>!
                </p>
              </div>
            </div>
          </aside>

          {/* CỘT PHẢI: FORM ĐĂNG KÝ CHUYÊN NGHIỆP */}
          <section className="register-form-side">
            <div className="form-inner-box">
              <div className="form-header-title">
                <div className="form-badge-pill">
                  <FiUserPlus size={13} /> Thành viên mới
                </div>
                <h2>Đăng Ký Tài Khoản Mua Hàng</h2>
                <p>Hoàn tất thông tin bên dưới để tham gia cộng đồng CTUT Gear</p>
              </div>

              {errorMsg && (
                <div className="alert-box-error" role="alert">
                  <FiAlertCircle size={18} className="alert-icon" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successNotice && (
                <div className="alert-box-success" role="status">
                  <FiCheckCircle size={18} className="alert-icon" />
                  <span>{successNotice}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="customer-form">
                {/* NHÓM 1: THÔNG TIN TÀI KHOẢN & BẢO MẬT */}
                <div className="form-section-label">
                  <FiShield size={14} />
                  <span>Thông tin tài khoản & bảo mật</span>
                </div>

                <div className="form-row-2">
                  <div className="field-group">
                    <label htmlFor="taiKhoan">
                      Tên đăng nhập <span className="req">*</span>
                    </label>
                    <div className="input-box">
                      <FiKey className="i-icon" />
                      <input
                        id="taiKhoan"
                        type="text"
                        required
                        autoComplete="username"
                        placeholder="ví dụ: user_minhquan"
                        value={formData.taiKhoan}
                        onChange={(e) => setFormData({ ...formData, taiKhoan: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor="hoTen">
                      Họ và tên khách hàng <span className="req">*</span>
                    </label>
                    <div className="input-box">
                      <FiUser className="i-icon" />
                      <input
                        id="hoTen"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="ví dụ: Trần Minh Quân"
                        value={formData.hoTen}
                        onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row-2">
                  {/* Ô TẠO MẬT KHẨU + NÚT CON MẮT */}
                  <div className="field-group">
                    <label htmlFor="matKhau">
                      Mật khẩu đăng nhập <span className="req">*</span>
                    </label>
                    <div className="input-box">
                      <FiLock className="i-icon" />
                      <input
                        id="matKhau"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        placeholder="Tối thiểu 6 ký tự"
                        value={formData.matKhau}
                        onChange={(e) => setFormData({ ...formData, matKhau: e.target.value })}
                      />
                      <button
                        type="button"
                        className={`btn-toggle-pass ${showPassword ? 'is-visible' : ''}`}
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                      </button>
                    </div>

                    {/* Thanh đo độ mạnh mật khẩu */}
                    {formData.matKhau && (
                      <div className={`password-strength ${passwordStrength.className}`}>
                        <div className="strength-bars">
                          <span className={passwordStrength.level >= 1 ? 'active' : ''}></span>
                          <span className={passwordStrength.level >= 2 ? 'active' : ''}></span>
                          <span className={passwordStrength.level >= 3 ? 'active' : ''}></span>
                        </div>
                        <small>{passwordStrength.label}</small>
                      </div>
                    )}
                  </div>

                  {/* Ô XÁC NHẬN MẬT KHẨU + NÚT CON MẮT */}
                  <div className="field-group">
                    <label htmlFor="xacNhanMatKhau">
                      Xác nhận mật khẩu <span className="req">*</span>
                    </label>
                    <div
                      className={`input-box ${
                        isPasswordMatched
                          ? 'is-valid'
                          : isPasswordMismatched
                          ? 'is-invalid'
                          : ''
                      }`}
                    >
                      <FiLock className="i-icon" />
                      <input
                        id="xacNhanMatKhau"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        placeholder="Nhập lại mật khẩu"
                        value={formData.xacNhanMatKhau}
                        onChange={(e) =>
                          setFormData({ ...formData, xacNhanMatKhau: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        className={`btn-toggle-pass ${showConfirmPassword ? 'is-visible' : ''}`}
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={
                          showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'
                        }
                        title={
                          showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'
                        }
                      >
                        {showConfirmPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                      </button>
                    </div>

                    {isPasswordMatched && (
                      <small className="match-ok-text">
                        <FiCheck size={13} /> Mật khẩu trùng khớp
                      </small>
                    )}
                    {isPasswordMismatched && (
                      <small className="match-err-text">
                        <FiXCircle size={13} /> Mật khẩu chưa trùng khớp
                      </small>
                    )}
                  </div>
                </div>

                {/* NHÓM 2: THÔNG TIN LIÊN HỆ & GIAO HÀNG */}
                <div className="form-section-label">
                  <FiMapPin size={14} />
                  <span>Thông tin liên hệ & giao hàng</span>
                </div>

                <div className="form-row-2">
                  <div className="field-group">
                    <label htmlFor="email">
                      Địa chỉ Email <span className="req">*</span>
                    </label>
                    <div className="input-box">
                      <FiMail className="i-icon" />
                      <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="minhquan@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor="soDienThoai">
                      Số điện thoại nhận hàng <span className="req">*</span>
                    </label>
                    <div className="input-box">
                      <FiPhone className="i-icon" />
                      <input
                        id="soDienThoai"
                        type="tel"
                        required
                        autoComplete="tel"
                        placeholder="ví dụ: 0901234567"
                        value={formData.soDienThoai}
                        onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="diaChi">Địa chỉ nhận hàng mặc định (Tùy chọn)</label>
                  <div className="input-box">
                    <FiMapPin className="i-icon" />
                    <input
                      id="diaChi"
                      type="text"
                      autoComplete="street-address"
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                      value={formData.diaChi}
                      onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
                    />
                  </div>
                </div>

                <label className="agreement-checkbox">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <span>
                    Tôi đồng ý với <a href="#terms">Điều khoản dịch vụ</a> và{' '}
                    <a href="#privacy">Chính sách bảo mật</a> của Sàn CTUT Gear.
                  </span>
                </label>

                <button type="submit" className="btn-submit-register" disabled={loading}>
                  {loading ? (
                    <span className="btn-loading-content">
                      <span className="spinner-ring"></span>
                      Đang tạo tài khoản...
                    </span>
                  ) : (
                    <span className="btn-default-content">
                      TẠO TÀI KHOẢN MUA HÀNG
                      <FiArrowRight className="btn-arrow-icon" size={17} />
                    </span>
                  )}
                </button>
              </form>

              <div className="register-footer-switch">
                <p>
                  Đã có tài khoản khách hàng?{' '}
                  <Link to="/login" className="login-link-highlight">
                    Đăng nhập tại đây
                  </Link>
                </p>

                <div className="divider-sep">
                  <span>HOẶC</span>
                </div>

                <div className="seller-channel-prompt">
                  <span>Bạn là Chủ Cửa Hàng / Đối Tác?</span>
                  <Link to="/seller/login" className="seller-link">
                    Đăng nhập Kênh Người Bán →
                  </Link>
                </div>

                <div className="back-home-link-wrap">
                  <Link to="/" className="link-back-home">
                    <FiArrowLeft size={14} /> Về Trang Chủ Sàn Mua Sắm
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

export default CustomerRegister;