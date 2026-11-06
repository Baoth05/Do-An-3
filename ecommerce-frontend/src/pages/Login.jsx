// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiMonitor, FiZap, FiBox, FiCheck } from 'react-icons/fi';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // TODO: Ở bước sau, tớ sẽ hướng dẫn cậu gọi API đăng nhập tại đây
        console.log('Login attempt:', { username, password, rememberMe });
        alert('Đăng nhập mô phỏng thành công! Chuyển hướng...');
        navigate('/');
    };

    return (
        <div className="login-page-wrapper">
            {/* Top Navigation Bar */}
            <nav className="login-top-nav">
                <div className="nav-left">
                    <div className="nav-logo">
                        <span className="logo-icon">A</span>
                        <strong>CTUT GEAR</strong>
                    </div>
                    <span className="nav-divider">|</span>
                    <span className="nav-portal-title">Authentication Portal</span>
                </div>
                <div className="nav-right">
                    <a href="#" className="nav-help">Need Help?</a>
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
                            <span className="badge-flash"><span className="dot"></span> Flash Deals Active</span>
                        </div>

                        <h1 className="promo-title">Level Up Your Battlestation</h1>
                        <p className="promo-subtitle">Vietnam's Premier Web3 & Pro Gaming Hardware Gateway.</p>

                        <div className="promo-features">
                            <div className="feat-box">
                                <div className="feat-icon"><FiMonitor /></div>
                                <div className="feat-text">
                                    <strong>100% Genuine Tech & 2-Year Instant Swap</strong>
                                    <p>Official tier warranty coverage on GPUs, boards & switches.</p>
                                </div>
                            </div>
                            <div className="feat-box">
                                <div className="feat-icon"><FiZap /></div>
                                <div className="feat-text">
                                    <strong>Ultra-Fast 2-Hour Express Delivery</strong>
                                    <p>Immediate courier dispatch across Ho Chi Minh City & Hanoi.</p>
                                </div>
                            </div>
                            <div className="feat-box">
                                <div className="feat-icon"><FiBox /></div>
                                <div className="feat-text">
                                    <strong>Crypto & Web3 Native Settlement</strong>
                                    <p>Seamless frictionless checkout with MetaMask, USDT & SOL.</p>
                                </div>
                            </div>
                        </div>

                        <div className="promo-trust-badge">
                            <div className="trust-avatars">
                                <span className="av">K</span><span className="av">V</span><span className="av">N</span>
                            </div>
                            <div className="trust-text">
                                <div className="stars">★★★★★ 4.9/5</div>
                                <div className="desc">Trusted by 120,000+ PC Builders</div>
                            </div>
                            <div className="authentic-tag">AUTHENTIC</div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="login-form-side">
                    <div className="form-tabs">
                        <button className="tab-btn active">Log In</button>
                        <button className="tab-btn">Register</button>
                    </div>

                    <div className="qr-corner-icon">
                        {/* Icon trang trí giả lập QR */}
                        <div className="qr-mock"></div>
                    </div>

                    <div className="form-header">
                        <h2>Welcome Back!</h2>
                        <p>Please enter your credentials to access your gear & orders.</p>
                    </div>

                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="input-group">
                            <label>Username, Phone or Email</label>
                            <div className="input-wrapper">
                                <span className="input-icon">👤</span>
                                <input
                                    type="text"
                                    placeholder="gamer@ctutgear.vn or 0908 123 456"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Password</label>
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
                                Remember me
                            </label>
                            <a href="#" className="forgot-link">Forgot Password?</a>
                        </div>

                        <button type="submit" className="btn-primary-login">
                            LOG IN →
                        </button>
                    </form>

                    <div className="social-login-section">
                        <div className="divider"><span>OR CONNECT WITH</span></div>
                        <div className="social-buttons">
                            <button className="btn-social">
                                <span className="soc-icon">G</span> Google
                            </button>
                            <button className="btn-social">
                                <span className="soc-icon blue">f</span> Facebook
                            </button>
                            <button className="btn-social">
                                <span className="soc-icon fox">🦊</span> MetaMask
                            </button>
                        </div>
                    </div>

                    <div className="register-prompt">
                        <p>New to CTUT Gear? <a href="#">Sign Up Now</a></p>
                        <p className="terms-text">
                            By proceeding, you agree to CTUT Gear's <a href="#">Terms of Service</a> & <a href="#">Privacy Policy</a>.
                        </p>
                    </div>
                </div>

            </div>

            {/* Bottom Footer */}
            <footer className="login-footer">
                <div className="footer-links">
                    <span>🎧 Support Hotline: 1900-888-CTUT</span>
                    <span className="dot">•</span>
                    <span>🔒 256-Bit SSL Encrypted Security</span>
                    <span className="dot">•</span>
                    <span>🛡️ Official Tech Warranty Guaranteed</span>
                </div>
                <div className="footer-policy">
                    <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a> | <a href="#">Security Guidelines</a>
                </div>
                <div className="footer-copyright">
                    © 2024 CTUT Gear Global Commerce. All Rights Reserved.
                </div>
            </footer>
        </div>
    );
};

export default Login;