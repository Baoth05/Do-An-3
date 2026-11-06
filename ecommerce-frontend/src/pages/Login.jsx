// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FiEye, FiEyeOff, FiMonitor, FiZap, FiBox, FiCheck, FiShoppingBag, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import { authService } from '../services/authService';
import './Login.css';

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
            const customer = await authService.loginCustomer({
                taiKhoan: username.trim(),
                matKhau: password,
            });

            setSuccessNotice(`Chào mừng trở lại, ${customer.hoTen || customer.taiKhoan}! Đang chuyển hướng...`);
            setTimeout(() => {
                navigate(from, { replace: true });
            }, 800);
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
                    <span className="nav-portal-title">Cổng Đăng Nhập Mua Hàng</span>
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
                            <span className="badge-flash"><span className="dot"></span> Kho Hàng Sẵn Sàng</span>
                        </div>

                        <h1 className="promo-title">Nâng Tầm Không Gian Chiến Game & Sáng Tạo</h1>
                        <p className="promo-subtitle">Sàn thương mại điện tử thiết bị phần cứng & Gaming Gear hàng đầu Việt Nam.</p>

                        <div className="promo-features">
                            <div className="feat-box">
                                <div className="feat-icon"><FiMonitor /></div>
                                <div className="feat-text">
                                    <strong>100% Linh Kiện Chính Hãng & Đổi Mới 1-1</strong>
                                    <p>Chính sách bảo hành trực tiếp từ Kho Tổng CTUT Gear cho toàn bộ GPU, Mainboard, Switch.</p>
                                </div>
                            </div>
                            <div className="feat-box">
                                <div className="feat-icon"><FiZap /></div>
                                <div className="feat-text">
                                    <strong>Giao Hỏa Tốc & Tự Động Phân Tuyến Shop</strong>
                                    <p>Tối ưu hóa hành trình giao vận thông minh giữa các kho cửa hàng đối tác trên cả nước.</p>
                                </div>
                            </div>
                            <div className="feat-box">
                                <div className="feat-icon"><FiBox /></div>
                                <div className="feat-text">
                                    <strong>Voucher Toàn Sàn & Ưu Đãi Độc Quyền</strong>
                                    <p>Áp dụng mã giảm giá nhiều tầng cho giỏ hàng đa gian hàng, thanh toán tiện lợi linh hoạt.</p>
                                </div>
                            </div>
                        </div>

                        <div className="promo-trust-badge">
                            <div className="trust-avatars">
                                <span className="av">Q</span><span className="av">K</span><span className="av">H</span>
                            </div>
                            <div className="trust-text">
                                <div className="stars">★★★★★ 4.9/5</div>
                                <div className="desc">Tin dùng bởi hơn 120.000 game thủ & PC Builder</div>
                            </div>
                            <div className="authentic-tag">CHÍNH HÃNG</div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="login-form-side">
                    <div className="form-tabs">
                        <button className="tab-btn active" type="button">Đăng Nhập Khách</button>
                        <button 
                            className="tab-btn" 
                            type="button"
                            onClick={() => navigate('/register')}
                        >
                            Đăng Ký Khách Mới
                        </button>
                    </div>

                    <div className="form-header">
                        <h2>Chào Mừng Trở Lại!</h2>
                        <p>Đăng nhập tài khoản khách hàng để quản lý đơn hàng & giỏ đồ công nghệ.</p>
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
                            <label>Tên đăng nhập hoặc Email</label>
                            <div className="input-wrapper">
                                <span className="input-icon">👤</span>
                                <input
                                    type="text"
                                    placeholder="ví dụ: user_minhquan hoặc email"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Mật khẩu</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="btn-toggle-pass"
                                    onClick={() => setShowPassword(!showPassword)}
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
                            <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); alert('Vui lòng liên hệ Bot Tư Vấn hoặc bộ phận hỗ trợ 1900-888-CTUT để khôi phục mật khẩu.'); }}>
                                Quên mật khẩu?
                            </a>
                        </div>

                        <button 
                            type="submit" 
                            className="btn-primary-login"
                            disabled={loading}
                        >
                            {loading ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP MUA HÀNG →'}
                        </button>
                    </form>

                    <div className="register-prompt">
                        <p>
                            Chưa có tài khoản mua hàng?{' '}
                            <Link to="/register" className="highlight-link">
                                Đăng ký tài khoản khách ngay
                            </Link>
                        </p>
                    </div>

                    {/* Dedicated Seller Portal Section */}
                    <div className="seller-switch-banner">
                        <div className="seller-banner-icon">
                            <FiShoppingBag size={20} />
                        </div>
                        <div className="seller-banner-text">
                            <strong>Bạn là Chủ Cửa Hàng / Đối Tác?</strong>
                            <p>Quản lý gian hàng, kho hàng và ký hợp đồng cung ứng B2B2C.</p>
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
                    <a href="#">Chính Sách Bảo Mật</a> | <a href="#">Điều Khoản Dịch Vụ</a> | <a href="#">Quy Định Đổi Trả</a>
                </div>
                <div className="footer-copyright">
                    © 2024 CTUT Gear E-Commerce Platform. All Rights Reserved.
                </div>
            </footer>
        </div>
    );
};

export default Login;
