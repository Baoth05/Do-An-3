// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    FiEye, FiEyeOff, FiMonitor, FiZap, FiBox, FiCheck,
    FiShoppingBag, FiArrowRight, FiAlertCircle, FiUser,
    FiLock, FiShield, FiHome, FiPhone, FiTruck, FiAward
} from 'react-icons/fi';
import { authService } from '../services/authService';

// Import trực tiếp file logo từ thư mục src/assets
import ctutLogo from '../assets/Glossy Red and White Gaming Logo.png';
import './Login.css';

// Component Logo đồng bộ với Header trang chủ CTUT GEAR
const BrandLogo = () => (
    <div className="nav-brand-logo">
        <div className="brand-logo-badge">
            <img
                src={ctutLogo}
                alt="CTUT GEAR Logo"
                className="brand-logo-img"
            />
        </div>
        <div className="brand-logo-text">
            <span className="brand-name">
                CTUT<span className="brand-name-accent">GEAR</span>
            </span>
            <span className="brand-tagline">SÀN LINH KIỆN &amp; GAMING GEAR</span>
        </div>
    </div>
);

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successNotice, setSuccessNotice] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from
        ? `${location.state.from.pathname || '/'}${location.state.from.search || ''}`
        : '/';
    const redirectMessage = location.state?.message || '';

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessNotice('');

        if (!username.trim() || !password) {
            setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
            return;
        }

        setLoading(true);
        try {
            // 1. Gọi API xác thực từ authService
            const customer = await authService.loginCustomer({
                taiKhoan: username.trim(),
                matKhau: password,
            });

            // 2. Kiểm tra phân quyền (Role-based Validation)
            const userRoles = customer.roles || customer.vaiTro || [];
            const roleString = Array.isArray(userRoles) ? userRoles.join(',') : String(userRoles);

            // Chặn tài khoản nghiệp vụ kho bãi đăng nhập cổng khách hàng
            if (
                roleString.includes('WAREHOUSE_MANAGER') ||
                roleString.includes('THUKHO') ||
                roleString.includes('NVKHO') ||
                roleString.includes('WAREHOUSE_STAFF')
            ) {
                localStorage.removeItem('customer_token');
                localStorage.removeItem('customer_user');

                setErrorMsg('Truy cập bị từ chối: Tài khoản nghiệp vụ kho không được phép truy cập cổng mua sắm!');
                setLoading(false);
                return;
            }

            // 3. Đăng nhập thành công và chuyển hướng
            window.dispatchEvent(new Event('customer-user-updated'));
            setSuccessNotice(`Chào mừng trở lại, ${customer.hoTen || customer.taiKhoan}! Đang chuyển hướng...`);

            setTimeout(() => {
                navigate(from, { replace: true });
            }, 700);

        } catch (err) {
            setErrorMsg(err.response?.data?.message || err.message || 'Tài khoản hoặc mật khẩu không chính xác!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-wrapper">
            {/* Header 2 tầng đồng bộ hoàn toàn màu cam trang chủ CTUT GEAR */}
            <header className="login-header-group">
                {/* Tầng 1: Thanh tiện ích đồng bộ tông cam */}
                <div className="login-top-utility">
                    <div className="utility-inner">
                        <div className="utility-left">
                            <span className="utility-item highlight">
                                <FiPhone size={12} /> Hotline: <strong>1900-888-CTUT</strong>
                            </span>
                            <span className="utility-sep">|</span>
                            <span className="utility-item">
                                <FiAward size={12} /> Bảo hành chính hãng 100%
                            </span>
                            <span className="utility-sep hide-mobile">|</span>
                            <span className="utility-item hide-mobile">
                                <FiTruck size={12} /> Giao hỏa tốc toàn quốc
                            </span>
                        </div>
                        <div className="utility-right">
                            <Link to="/seller/login" className="utility-link">
                                <FiShoppingBag size={12} /> Kênh Người Bán
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Tầng 2: Thanh điều hướng chính */}
                <nav className="login-top-nav">
                    <div className="nav-inner">
                        <div className="nav-left">
                            <Link to="/" className="nav-logo-link" aria-label="Về trang chủ CTUT GEAR">
                                <BrandLogo />
                            </Link>
                            <span className="nav-divider" aria-hidden="true"></span>
                            <span className="nav-portal-title">Đăng Nhập Khách Hàng</span>
                        </div>

                        <div className="nav-right">
                            <Link to="/seller/login" className="seller-portal-cta">
                                <FiShoppingBag size={14} />
                                <span>Kênh Người Bán</span>
                            </Link>
                            <Link to="/" className="nav-home-btn">
                                <FiHome size={14} />
                                <span>Về Trang Chủ</span>
                            </Link>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Khu vực nội dung chính */}
            <main className="login-main-section">
                <div className="login-main-container">
                    {/* Cột trái: Khung giới thiệu tông cam sáng kèm hiệu ứng động */}
                    <div className="login-promo-side">
                        <div className="promo-overlay"></div>
                        <div className="promo-grid-pattern" aria-hidden="true"></div>
                        <div className="promo-glow promo-glow-primary" aria-hidden="true"></div>
                        <div className="promo-glow promo-glow-secondary" aria-hidden="true"></div>

                        <div className="promo-content">
                            <div className="promo-badges">
                                <span className="badge-official">
                                    <FiCheck size={12} /> CTUT OFFICIAL MALL
                                </span>
                                <span className="badge-flash">
                                    <span className="status-dot"></span> Kho Tổng Sẵn Sàng
                                </span>
                            </div>

                            <h1 className="promo-title">
                                Nâng Tầm Không Gian <span className="promo-highlight">Chiến Game &amp; Sáng Tạo</span>
                            </h1>
                            <p className="promo-subtitle">
                                Sàn thương mại điện tử thiết bị phần cứng &amp; Gaming Gear chính hãng hàng đầu Việt Nam.
                            </p>

                            <div className="promo-features">
                                <div className="feat-box feat-delay-1">
                                    <div className="feat-icon"><FiMonitor /></div>
                                    <div className="feat-text">
                                        <strong>100% Linh Kiện Chính Hãng &amp; Đổi Mới 1-1</strong>
                                        <p>Bảo hành chính ngạch từ Kho Tổng Trung Tâm cho mọi GPU, Mainboard, Phím cơ.</p>
                                    </div>
                                </div>
                                <div className="feat-box feat-delay-2">
                                    <div className="feat-icon"><FiZap /></div>
                                    <div className="feat-text">
                                        <strong>Giao Hỏa Tốc &amp; Tự Động Phân Tuyến Shop</strong>
                                        <p>Tối ưu hóa hành trình giao nhận hàng giữa Kho Tổng và các Shop đối tác.</p>
                                    </div>
                                </div>
                                <div className="feat-box feat-delay-3">
                                    <div className="feat-icon"><FiBox /></div>
                                    <div className="feat-text">
                                        <strong>Voucher Toàn Sàn &amp; Thanh Toán Đa Kênh</strong>
                                        <p>Áp dụng mã giảm giá nhiều tầng cho giỏ hàng đa gian hàng, thanh toán CTUT Pay tiện lợi.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="promo-trust-badge">
                                <div className="trust-avatars">
                                    <span className="av">B</span>
                                    <span className="av">Q</span>
                                    <span className="av">H</span>
                                </div>
                                <div className="trust-text">
                                    <div className="stars">★★★★★ 4.9/5</div>
                                    <div className="desc">Tin dùng bởi hơn 150.000 game thủ &amp; PC Builder</div>
                                </div>
                                <div className="authentic-tag">CHÍNH HÃNG 100%</div>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Form Đăng Nhập Khách Hàng */}
                    <div className="login-form-side">
                        <div className="form-header">
                            <div className="customer-role-pill">
                                <FiShield size={12} /> KHÁCH HÀNG THÀNH VIÊN
                            </div>
                            <h2>Chào Mừng Trở Lại!</h2>
                            <p>Đăng nhập tài khoản mua sắm để theo dõi đơn hàng &amp; săn voucher ưu đãi cá nhân.</p>
                        </div>

                        {(errorMsg || redirectMessage) && (
                            <div className="auth-alert-box error" role="alert">
                                <FiAlertCircle size={17} className="alert-icon" />
                                <span>{errorMsg || redirectMessage}</span>
                            </div>
                        )}

                        {successNotice && (
                            <div className="auth-alert-box success" role="status">
                                <FiCheck size={17} className="alert-icon" />
                                <span>{successNotice}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="auth-form">
                            <div className="input-group">
                                <label htmlFor="customer-username">
                                    Tên đăng nhập hoặc Email <span className="req">*</span>
                                </label>
                                <div className="input-wrapper">
                                    <span className="input-icon"><FiUser /></span>
                                    <input
                                        id="customer-username"
                                        type="text"
                                        placeholder="Nhập tên đăng nhập hoặc email..."
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        autoFocus
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="customer-password">
                                    Mật khẩu <span className="req">*</span>
                                </label>
                                <div className="input-wrapper">
                                    <span className="input-icon"><FiLock /></span>
                                    <input
                                        id="customer-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Nhập mật khẩu của bạn..."
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="btn-toggle-pass"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex="-1"
                                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    >
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-actions">
                                <label className="remember-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span>Ghi nhớ đăng nhập</span>
                                </label>
                                <a
                                    href="#forgot"
                                    className="forgot-link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        alert('Vui lòng liên hệ tổng đài hỗ trợ 1900-888-CTUT để đặt lại mật khẩu.');
                                    }}
                                >
                                    Quên mật khẩu?
                                </a>
                            </div>

                            <button type="submit" className="btn-primary-login" disabled={loading}>
                                <span className="btn-shimmer" aria-hidden="true"></span>
                                <span className="btn-label">
                                    {loading ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP MUA HÀNG'}
                                </span>
                                {!loading && <FiArrowRight size={18} className="btn-arrow" />}
                            </button>
                        </form>

                        <div className="register-prompt">
                            <p>
                                Chưa có tài khoản CTUT GEAR?{' '}
                                <Link to="/register" className="highlight-link">
                                    Đăng ký ngay
                                </Link>
                            </p>
                        </div>

                        {/* Banner chuyển sang Kênh Người Bán */}
                        <div className="seller-switch-banner">
                            <div className="seller-banner-icon">
                                <FiShoppingBag size={19} />
                            </div>
                            <div className="seller-banner-text">
                                <strong>Bạn là Chủ Cửa Hàng / Đối Tác?</strong>
                                <p>Đăng nhập cổng Người Bán để quản lý gian hàng và đơn vận chuyển.</p>
                            </div>
                            <Link to="/seller/login" className="btn-go-seller">
                                Kênh Người Bán <FiArrowRight size={13} />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer đồng bộ */}
            <footer className="login-footer">
                <div className="footer-links">
                    <span>Hotline Hỗ Trợ: <strong>1900-888-CTUT</strong></span>
                    <span className="footer-dot">•</span>
                    <span>Bảo Mật SSL 256-Bit</span>
                    <span className="footer-dot">•</span>
                    <span>Bảo Hành Chính Hãng Kho Tổng</span>
                </div>
                <div className="footer-policy">
                    <a href="#policy" onClick={(e) => e.preventDefault()}>Chính Sách Bảo Mật</a>
                    <span>|</span>
                    <a href="#terms" onClick={(e) => e.preventDefault()}>Điều Khoản Dịch Vụ</a>
                    <span>|</span>
                    <a href="#returns" onClick={(e) => e.preventDefault()}>Quy Định Đổi Trả</a>
                </div>
                <div className="footer-copyright">
                    © 2026 CTUT GEAR E-Commerce Platform. Sàn Thương Mại Điện Tử &amp; Chuỗi Cung Ứng Chuẩn B2B2C.
                </div>
            </footer>
        </div>
    );
};

export default Login;