// src/pages/Seller/SellerRegister.jsx
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { 
  FiShoppingBag, FiBox, FiCheckCircle, FiShield, 
  FiUser, FiArrowRight, FiLock, FiHome, FiCreditCard 
} from 'react-icons/fi';
import './SellerRegister.css';

const SellerRegister = () => {
  const navigate = useNavigate();
  const customer = authService.getCurrentCustomer();
  const seller = authService.getCurrentSeller();

  useEffect(() => {
    // Nếu khách hàng đã đăng nhập, tự động chuyển vào Trang Cá Nhân (Tab Mở Gian Hàng)
    if (customer) {
      navigate('/profile', { 
        state: { 
          activeTab: 'seller',
          toastNotice: '💡 Chào mừng! Bạn hãy hoàn tất điền thông tin kho hàng để mở gian hàng ngay dưới đây.' 
        }, 
        replace: true 
      });
    }
  }, [customer, navigate]);

  return (
    <div className="seller-register-page">
      <div className="container">
        {/* Banner hướng dẫn chính sách tài khoản thống nhất */}
        <div className="register-hero-header">
          <div className="hero-badge-wrap">
            <span className="hero-pill">✨ MÔ HÌNH TÀI KHOẢN HỢP NHẤT (SINGLE ACCOUNT)</span>
            <h2>Chính Sách Khởi Tạo Gian Hàng & Kho Riêng CTUT Gear</h2>
            <p>
              Tại Sàn TMĐT CTUT Gear, bạn không cần phải đăng ký một tài khoản riêng biệt để bán hàng. 
              Mỗi thành viên chỉ cần <strong>1 tài khoản Khách Hàng duy nhất</strong> để vừa mua sắm linh hoạt, 
              vừa có thể kích hoạt chức năng <strong>Người Bán Hàng</strong> và sở hữu Kho Riêng độc lập!
            </p>
          </div>
        </div>

        {/* 3 Bước Đơn Giản Để Bắt Đầu Bán Hàng */}
        <div className="seller-onboarding-guide-card">
          <h3 className="guide-title">
            <FiShoppingBag /> Quy Trình 3 Bước Để Trở Thành Chủ Cửa Hàng:
          </h3>

          <div className="guide-steps-grid">
            <div className="g-step-item">
              <div className="g-step-number">1</div>
              <div className="g-step-content">
                <h4>Đăng Ký Tài Khoản Khách Hàng</h4>
                <p>Khởi tạo tài khoản thành viên CTUT Gear với đầy đủ thông tin định danh và địa chỉ.</p>
              </div>
            </div>

            <div className="g-step-item">
              <div className="g-step-number">2</div>
              <div className="g-step-content">
                <h4>Truy Cập Trang Cá Nhân</h4>
                <p>Đăng nhập tài khoản, chọn mục <strong>"Mở Gian Hàng Bán Hàng"</strong> để thiết lập kho riêng của shop.</p>
              </div>
            </div>

            <div className="g-step-item">
              <div className="g-step-number">3</div>
              <div className="g-step-content">
                <h4>Bắt Đầu Kinh Doanh & Mua Sắm</h4>
                <p>Ký hợp đồng cung ứng nhập hàng từ Kho Tổng, mở bán sản phẩm và tự do mua hàng từ các shop khác.</p>
              </div>
            </div>
          </div>

          {/* Các nút hành động chính */}
          <div className="guide-action-buttons">
            <Link to="/register" className="btn-primary-register-customer">
              <FiUser /> 👉 ĐĂNG KÝ TÀI KHOẢN KHÁCH HÀNG NGAY
            </Link>
            <Link to="/login" className="btn-secondary-login">
              <FiLock /> Đã Có Tài Khoản Khách Hàng? Đăng Nhập
            </Link>
            <Link to="/" className="btn-return-home">
              <FiHome /> Về Trang Chủ Mua Sắm
            </Link>
          </div>

          <div className="guide-footer-badge">
            <FiShield /> Cam kết 100% bảo mật thông tin tài khoản • Ký hợp đồng điện tử pháp lý minh bạch
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerRegister;
