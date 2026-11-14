// src/pages/CustomerRegister.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { 
  FiUser, FiMail, FiPhone, FiLock, FiKey, 
  FiMapPin, FiCheckCircle, FiShield, FiArrowRight, FiShoppingBag, FiTruck, FiGift 
} from 'react-icons/fi';
import './CustomerRegister.css';

const CustomerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    taiKhoan: '',
    matKhau: '',
    xacNhanMatKhau: '',
    hoTen: '',
    email: '',
    soDienThoai: '',
    diaChi: '',
  });

  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

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
      await authService.registerCustomer({
        taiKhoan: formData.taiKhoan.trim(),
        matKhau: formData.matKhau,
        hoTen: formData.hoTen.trim(),
        email: formData.email.trim(),
        soDienThoai: formData.soDienThoai.trim(),
        diaChi: formData.diaChi.trim(),
      });

      // Tự động đăng nhập
      await authService.loginCustomer({
        taiKhoan: formData.taiKhoan.trim(),
        matKhau: formData.matKhau,
      });

      // Tặng ngay gói Voucher Chào Mừng vào ví tài khoản khách hàng mới
      const welcomeVouchers = [
        {
          id: 'welcome-1',
          maVoucher: 'CTUT50K',
          phanTramGiam: 10,
          giamToiDa: 50000,
          donHangToiThieu: 150000,
          soLuongConLai: 500,
          moTa: '🎁 Quà Chào Mừng Thành Viên Mới - Giảm 10% tối đa 50.000đ toàn sàn'
        },
        {
          id: 'welcome-2',
          maVoucher: 'FREESHIP',
          phanTramGiam: 100,
          giamToiDa: 30000,
          donHangToiThieu: 200000,
          soLuongConLai: 1000,
          moTa: '🚚 Miễn phí vận chuyển toàn quốc 30.000đ cho đơn từ 200.000đ'
        },
        {
          id: 'welcome-3',
          maVoucher: 'CTUTNEW50',
          phanTramGiam: 15,
          giamToiDa: 50000,
          donHangToiThieu: 150000,
          soLuongConLai: 500,
          moTa: '🎉 Ưu đãi đơn hàng đầu tiên - Giảm ngay 15% tối đa 50.000đ'
        }
      ];
      localStorage.setItem(`customer_vouchers_${formData.taiKhoan.trim()}`, JSON.stringify(welcomeVouchers));
      localStorage.setItem('user_saved_vouchers', JSON.stringify(welcomeVouchers));
      window.dispatchEvent(new Event('customer-user-updated'));

      setSuccessNotice('🎉 Đăng ký tài khoản thành công! Đã tặng 3 Voucher chào mừng vào ví!');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data || err.message || 'Lỗi khi đăng ký tài khoản. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-register-page">
      <div className="customer-register-container">
        {/* Cột Trái: Quyền Lợi Thành Viên Khách Hàng */}
        <div className="register-benefits-side">
          <div className="brand-logo-badge">
            <FiShoppingBag size={24} />
            <div>
              <h3>CTUT GEAR MARKETPLACE</h3>
              <span>Cộng Đồng Game Thủ & Tín Đồ Công Nghệ</span>
            </div>
          </div>

          <div className="benefits-intro">
            <h2>Tạo Tài Khoản Khách Hàng Ngay Hôm Nay!</h2>
            <p>
              Tận hưởng trải nghiệm mua sắm công nghệ chính hãng từ hệ thống kho tổng chuẩn B2B2C 
              cùng hàng ngàn ưu đãi độc quyền.
            </p>
          </div>

          <div className="benefits-list">
            <div className="benefit-item">
              <div className="b-icon"><FiGift /></div>
              <div>
                <strong>Voucher Giảm 50.000đ Chào Mừng</strong>
                <p>Nhận ngay mã ưu đãi toàn sàn cho đơn hàng đầu tiên.</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="b-icon"><FiTruck /></div>
              <div>
                <strong>Miễn Phí Vận Chuyển Toàn Quốc</strong>
                <p>Tách đơn tự động theo shop, giao hàng nhanh 24h - 48h.</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="b-icon"><FiShield /></div>
              <div>
                <strong>Bảo Hành 1 Đổi 1 Tại Kho Tổng</strong>
                <p>Cam kết 100% hàng chính hãng Master Catalog, an tâm mua sắm.</p>
              </div>
            </div>
          </div>

          <div className="register-seller-teaser" style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>🏪 Bạn muốn mở gian hàng kinh doanh trên sàn?</span>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
              Chỉ cần đăng ký tài khoản thành viên tại đây. Sau khi đăng nhập, bạn có thể kích hoạt mở gian hàng & kho riêng ngay trong <strong>Trang Cá Nhân</strong>!
            </p>
          </div>
        </div>

        {/* Cột Phải: Form Đăng Ký Khách Hàng */}
        <div className="register-form-side">
          <div className="form-inner-box">
            <div className="form-header-title">
              <h2>Đăng Ký Tài Khoản Mua Hàng</h2>
              <p>Điền thông tin để tạo tài khoản khách hàng CTUT Gear</p>
            </div>

            {errorMsg && (
              <div className="alert-box-error">
                {errorMsg}
              </div>
            )}

            {successNotice && (
              <div className="alert-box-success">
                <FiCheckCircle size={18} /> {successNotice}
              </div>
            )}

            <form onSubmit={handleRegister} className="customer-form">
              <div className="form-row-2">
                <div className="field-group">
                  <label>Tên đăng nhập *</label>
                  <div className="input-box">
                    <FiKey className="i-icon" />
                    <input
                      type="text"
                      required
                      placeholder="ví dụ: user_minhquan"
                      value={formData.taiKhoan}
                      onChange={(e) => setFormData({ ...formData, taiKhoan: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label>Họ và tên khách hàng *</label>
                  <div className="input-box">
                    <FiUser className="i-icon" />
                    <input
                      type="text"
                      required
                      placeholder="ví dụ: Trần Minh Quân"
                      value={formData.hoTen}
                      onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row-2">
                <div className="field-group">
                  <label>Mật khẩu đăng nhập *</label>
                  <div className="input-box">
                    <FiLock className="i-icon" />
                    <input
                      type="password"
                      required
                      placeholder="Tối thiểu 6 ký tự"
                      value={formData.matKhau}
                      onChange={(e) => setFormData({ ...formData, matKhau: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label>Nhập lại mật khẩu *</label>
                  <div className="input-box">
                    <FiLock className="i-icon" />
                    <input
                      type="password"
                      required
                      placeholder="Xác nhận mật khẩu"
                      value={formData.xacNhanMatKhau}
                      onChange={(e) => setFormData({ ...formData, xacNhanMatKhau: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row-2">
                <div className="field-group">
                  <label>Địa chỉ Email *</label>
                  <div className="input-box">
                    <FiMail className="i-icon" />
                    <input
                      type="email"
                      required
                      placeholder="minhquan@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label>Số điện thoại nhận hàng *</label>
                  <div className="input-box">
                    <FiPhone className="i-icon" />
                    <input
                      type="tel"
                      required
                      placeholder="ví dụ: 0901234567"
                      value={formData.soDienThoai}
                      onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="field-group">
                <label>Địa chỉ nhận hàng mặc định (Tùy chọn)</label>
                <div className="input-box">
                  <FiMapPin className="i-icon" />
                  <input
                    type="text"
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
                  Tôi đồng ý với <a href="#">Điều khoản dịch vụ</a> và <a href="#">Chính sách bảo mật</a> của Sàn CTUT Gear.
                </span>
              </label>

              <button
                type="submit"
                className="btn-submit-register"
                disabled={loading}
              >
                {loading ? 'Đang Đăng Ký...' : 'TẠO TÀI KHOẢN MUA HÀNG →'}
              </button>
            </form>

            <div className="register-footer-switch">
              <p>
                Đã có tài khoản khách hàng?{' '}
                <Link to="/login" className="login-link-highlight">
                  Đăng nhập tại đây
                </Link>
              </p>

              <div className="divider-sep"><span>HOẶC</span></div>

              <div className="seller-channel-prompt">
                <span>Bạn là Chủ Cửa Hàng / Đối Tác?</span>
                <Link to="/seller/login" className="seller-link">
                  Đăng nhập Kênh Người Bán →
                </Link>
              </div>

              <div className="back-home-link-wrap">
                <Link to="/" className="link-back-home">
                  ← Về Trang Chủ Sàn Mua Sắm
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegister;

