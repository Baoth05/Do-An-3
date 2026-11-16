// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    FiEye, FiEyeOff, FiMonitor, FiZap, FiBox, FiCheck,
    FiShoppingBag, FiArrowRight, FiAlertCircle, FiUser, FiLock, FiShield
} from 'react-icons/fi';
import { authService } from '../services/authService';
import './Login.css';

const Login = () => {
    // Để trống hoàn toàn các trường dữ liệu khi mới mở form
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successNotice, setSuccessNotice] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

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

            // 2. Logic kiểm tra Vai trò (Role-based Validation)
            // Lấy danh sách quyền từ backend (có thể là mảng roles hoặc chuỗi vaiTro)
            const userRoles = customer.roles || customer.vaiTro || [];
            const roleString = Array.isArray(userRoles) ? userRoles.join(',') : String(userRoles);

            // Chặn nhân viên kho bãi truy cập vào cổng mua sắm
            if (
                roleString.includes('WAREHOUSE_MANAGER') ||
                roleString.includes('THUKHO') ||
                roleString.includes('NVKHO') ||
                roleString.includes('WAREHOUSE_STAFF')
            ) {
                // Xóa token rác nếu authService đã lỡ lưu
                localStorage.removeItem('customer_token');
                localStorage.removeItem('customer_user');

                setErrorMsg('Truy cập bị từ chối: Tài khoản nghiệp vụ kho không được phép truy cập cổng mua sắm!');
                setLoading(false);
                return; // Dừng tại đây, không cho chuyển hướng
            }

            // 3. Nếu hợp lệ, cho phép đăng nhập thành công
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
            {/* Top Navigation Bar */}
            <nav className="login-top-nav">
                <div className="nav-left">
                    <Link to="/" className="nav-logo-link">
                        <div className="nav-logo">
                            <span className="logo-icon">G</span>
                            <strong>CTUT GEAR</strong>
                        </div>
                    </Link>
                    <span className="nav-divider">|</span>
                    <span className="nav-portal-title">Cổng Đăng Nhập Khách Hàng</span>
                </div>
                <div className="nav-right">
                    <Link to="/seller/login" className="seller-portal-cta">
                        <FiShoppingBag size={14} /> Kênh Người Bán
                    </Link>
                    <Link to="/" className="nav-help">Về Trang Chủ</Link>
                </div>
            </nav>

            {/* Main Login Container */}
            <div className="login-main-container">
                {/* Left Side: Promo Content */}
                <div className="login-promo-side">
                    <div className="promo-overlay"></div>
                    <div className="promo-content">
                        <div className="promo-badges">
                            <span className="badge-official"><FiCheck size={12} /> CTUT OFFICIAL MALL</span>
                            <span className="badge-flash"><span className="dot"></span> Kho Tổng Sẵn Sàng</span>
                        </div>

                        <h1 className="promo-title">Nâng Tầm Không Gian Chiến Game & Sáng Tạo</h1>
                        <p className="promo-subtitle">Sàn thương mại điện tử thiết bị phần cứng & Gaming Gear chính hãng hàng đầu Việt Nam.</p>

                        <div className="promo-features">
                            <div className="feat-box">
                                <div className="feat-icon"><FiMonitor /></div>
                                <div className="feat-text">
                                    <strong>100% Linh Kiện Chính Hãng & Đổi Mới 1-1</strong>
                                    <p>Bảo hành chính ngạch từ Kho Tổng Trung Tâm cho mọi GPU, Mainboard, Phím cơ.</p>
                                </div>
                            </div>
                            <div className="feat-box">
                                <div className="feat-icon"><FiZap /></div>
                                <div className="feat-text">
                                    <strong>Giao Hỏa Tốc & Tự Động Phân Tuyến Shop</strong>
                                    <p>Tối ưu hóa hành trình giao nhận hàng giữa Kho Tổng và các Shop đối tác.</p>
                                </div>
                            </div>
                            <div className="feat-box">
                                <div className="feat-icon"><FiBox /></div>
                                <div className="feat-text">
                                    <strong>Voucher Toàn Sàn & Thanh Toán Đa Kênh</strong>
                                    <p>Áp dụng mã giảm giá nhiều tầng cho giỏ hàng đa gian hàng, thanh toán CTUT Pay tiện lợi.</p>
                                </div>
                            </div>
                        </div>

                        <div className="promo-trust-badge">
                            <div className="trust-avatars">
                                <span className="av">B</span><span className="av">Q</span><span className="av">H</span>
                            </div>
                            <div className="trust-text">
                                <div className="stars">★★★★★ 4.9/5</div>
                                <div className="desc">Tin dùng bởi hơn 150.000 game thủ & PC Builder</div>
                            </div>
                            <div className="authentic-tag">CHÍNH HÃNG 100%</div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form Cho Riêng Model Khách Hàng */}
                <div className="login-form-side">
                    <div className="form-tabs">
                        <button className="tab-btn active" type="button">Đăng Nhập Khách</button>
                        <button className="tab-btn" type="button" onClick={() => navigate('/register')}>
                            Đăng Ký Khách Mới
                        </button>
                    </div>

                    <div className="form-header">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', marginBottom: '8px' }}>
                            <FiShield size={12} /> MODEL KHÁCH HÀNG (CUSTOMER)
                        </div>
                        <h2>Chào Mừng Trở Lại!</h2>
                        <p>Đăng nhập tài khoản mua sắm để theo dõi đơn hàng & voucher ưu đãi cá nhân.</p>
                    </div>

                    {errorMsg && (
                        <div className="auth-alert-box error">
                            <FiAlertCircle size={16} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {successNotice && (
                        <div className="auth-alert-box success">
                            <FiCheck size={16} />
                            <span>{successNotice}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="input-group">
                            <label>Tên đăng nhập hoặc Email <span className="req">*</span></label>
                            <div className="input-wrapper">
                                <span className="input-icon"><FiUser /></span>
                                <input
                                    type="text"
                                    placeholder="Nhập tên đăng nhập..."
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Mật khẩu xác thực <span className="req">*</span></label>
                            <div className="input-wrapper">
                                <span className="input-icon"><FiLock /></span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••••••"
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
                                    aria-label="Ẩn hiện mật khẩu"
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
                                <span className="checkmark"></span>
                                Ghi nhớ đăng nhập
                            </label>
                            <a
                                href="#forgot"
                                className="forgot-link"
                                onClick={(e) => {
                                    e.preventDefault();
                                    alert('Vui lòng liên hệ tổng đài hỗ trợ để đặt lại mật khẩu.');
                                }}
                            >
                                Quên mật khẩu?
                            </a>
                        </div>

                        <button type="submit" className="btn-primary-login" disabled={loading}>
                            <span>{loading ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP MUA HÀNG'}</span>
                            <FiArrowRight size={18} />
                        </button>
                    </form>

                    <div className="register-prompt">
                        <p>
                            Chưa có tài khoản khách hàng?{' '}
                            <Link to="/register" className="highlight-link">
                                Đăng ký tài khoản khách ngay
                            </Link>
                        </p>
                    </div>

                    {/* Dedicated Seller Portal Section Switch */}
                    <div className="seller-switch-banner">
                        <div className="seller-banner-icon">
                            <FiShoppingBag size={20} />
                        </div>
                        <div className="seller-banner-text">
                            <strong>Bạn là Chủ Cửa Hàng / Đối Tác?</strong>
                            <p>Phân hệ Người Bán có cổng đăng nhập riêng biệt để quản lý gian hàng và kho shop.</p>
                        </div>
                        <Link to="/seller/login" className="btn-go-seller">
                            Vào Kênh Người Bán <FiArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Footer */}
            <footer className="login-footer">
                <div className="footer-links">
                    <span>🎧 Hotline Hỗ Trợ: 1900-888-CTUT</span>
                    <span className="dot">•</span>
                    <span>🔒 Bảo Mật SSL 256-Bit</span>
                    <span className="dot">•</span>
                    <span>🛡️ Bảo Hành Chính Hãng Kho Tổng</span>
                </div>
                <div className="footer-policy">
                    <a href="#policy" onClick={(e) => e.preventDefault()}>Chính Sách Bảo Mật</a> |
                    <a href="#terms" onClick={(e) => e.preventDefault()}> Điều Khoản Dịch Vụ</a> |
                    <a href="#returns" onClick={(e) => e.preventDefault()}> Quy Định Đổi Trả</a>
                </div>
                <div className="footer-copyright">
                    © 2026 CTUT Gear E-Commerce Platform. Sàn Thương Mại Điện Tử & Chuỗi Cung Ứng Chuẩn B2B2C.
                </div>
            </footer>
        </div>
    );
};

export default Login;