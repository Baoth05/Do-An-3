// src/pages/Seller/SellerRegister.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { 
  FiShoppingBag, FiBox, FiCheckCircle, FiShield, 
  FiUser, FiArrowRight, FiLock, FiHome, FiMapPin, FiPhone, FiMail, FiLayers, FiAlertCircle 
} from 'react-icons/fi';
import './SellerRegister.css';

const SellerRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    taiKhoan: '',
    matKhau: '',
    confirmMatKhau: '',
    tenShop: '',
    maKho: '',
    hoTen: '',
    email: '',
    soDienThoai: '',
    diaChiKho: '',
  });

  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'taiKhoan' && !prev.maKho) {
        next.maKho = `STORE-${value.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
      }
      return next;
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    if (formData.matKhau.length < 6) {
      setErrorMsg('Mật khẩu người bán phải chứa tối thiểu 6 ký tự!');
      return;
    }

    if (formData.matKhau !== formData.confirmMatKhau) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp!');
      return;
    }

    if (!agreed) {
      setErrorMsg('Vui lòng chấp thuận Quy chế hoạt động gian hàng & Chuỗi cung ứng B2B2C!');
      return;
    }

    setLoading(true);

    try {
      // 1. Đăng ký thông tin gian hàng & người bán
      await authService.registerSeller({
        taiKhoan: formData.taiKhoan.trim(),
        matKhau: formData.matKhau,
        tenShop: formData.tenShop.trim(),
        maKho: formData.maKho.trim(),
        hoTen: formData.hoTen.trim() || formData.tenShop.trim(),
        email: formData.email.trim() || `${formData.taiKhoan.trim()}@seller.ctutgear.vn`,
        soDienThoai: formData.soDienThoai.trim(),
        diaChiKho: formData.diaChiKho.trim(),
      });

      // 2. Đăng nhập ngay vào Model Người Bán
      await authService.loginSeller({
        taiKhoan: formData.taiKhoan.trim(),
        matKhau: formData.matKhau,
      });

      setSuccessNotice('🎉 Đăng ký gian hàng thành công! Đang chuyển hướng vào Kênh Người Bán...');
      setTimeout(() => {
        navigate('/seller');
      }, 900);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Không thể đăng ký gian hàng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-register-page">
      <div className="container" style={{ maxWidth: '860px', margin: '0 auto', padding: '0 16px' }}>
        
        {/* Header */}
        <div className="register-hero-header">
          <div className="hero-pill">
            <FiShield size={12} /> ĐỐI TÁC THƯƠNG MẠI CTUT GEAR MERCHANT
          </div>
          <h2>Đăng Ký Trở Thành Người Bán Hàng</h2>
          <p>
            Mở gian hàng kinh doanh công nghệ, kết nối kho riêng với Kho Tổng Trung Tâm 
            để ký hợp đồng nhập hàng B2B2C và phân phối sản phẩm chính hãng toàn quốc.
          </p>
        </div>

        {errorMsg && (
          <div className="register-error-alert" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiAlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successNotice && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '14px 20px', borderRadius: '10px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiCheckCircle size={18} />
            <span>{successNotice}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="register-main-card">
          {/* Section 1: Tài khoản người bán */}
          <div className="form-section-block">
            <div className="section-title-line">
              <div className="step-num">1</div>
              <div>
                <h3>Thông Tin Tài Khoản Quản Trị Gian Hàng</h3>
                <p>Tài khoản dùng để đăng nhập vào Cổng Quản Trị Người Bán (/seller)</p>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-field-seller">
                <label>Tên đăng nhập Người Bán <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-with-icon">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    name="taiKhoan"
                    required
                    placeholder="ví dụ: shop_minhquan"
                    value={formData.taiKhoan}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-field-seller">
                <label>Mật khẩu <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    name="matKhau"
                    required
                    placeholder="Tối thiểu 6 ký tự..."
                    value={formData.matKhau}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-field-seller">
                <label>Xác nhận mật khẩu <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    name="confirmMatKhau"
                    required
                    placeholder="Nhập lại mật khẩu..."
                    value={formData.confirmMatKhau}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin gian hàng & Kho hàng riêng */}
          <div className="form-section-block">
            <div className="section-title-line">
              <div className="step-num">2</div>
              <div>
                <h3>Thông Tin Gian Hàng & Kho Riêng Của Shop</h3>
                <p>Hệ thống sẽ cấp một mã Kho Cửa Hàng kết nối 2 tầng với Kho Tổng WMS</p>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-field-seller">
                <label>Tên Gian Hàng / Cửa Hàng <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-with-icon">
                  <FiShoppingBag className="input-icon" />
                  <input
                    type="text"
                    name="tenShop"
                    required
                    placeholder="ví dụ: CTUT Gaming Cần Thơ"
                    value={formData.tenShop}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-field-seller">
                <label>Mã Kho Của Shop (Hệ thống gợi ý) <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-with-icon">
                  <FiLayers className="input-icon" />
                  <input
                    type="text"
                    name="maKho"
                    required
                    placeholder="STORE-MINHQUAN"
                    value={formData.maKho}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-field-seller">
                <label>Họ và tên chủ shop / Đại diện <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-with-icon">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    name="hoTen"
                    required
                    placeholder="Trần Minh Quân"
                    value={formData.hoTen}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-field-seller">
                <label>Số điện thoại Hotline / Zalo <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-with-icon">
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    name="soDienThoai"
                    required
                    placeholder="0901234567"
                    value={formData.soDienThoai}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-field-seller">
                <label>Email liên hệ kinh doanh</label>
                <div className="input-with-icon">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="shop@ctutgear.vn"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-field-seller">
                <label>Địa chỉ kho hàng của shop <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-with-icon">
                  <FiMapPin className="input-icon" />
                  <input
                    type="text"
                    name="diaChiKho"
                    required
                    placeholder="256 Nguyễn Văn Cừ, Cần Thơ"
                    value={formData.diaChiKho}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Cam kết chính sách */}
          <div className="form-section-block">
            <div className="policy-commitment-box">
              <label className="checkbox-agreement">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <div>
                  <strong>Cam kết tuân thủ quy chế Chuỗi Cung Ứng & Sàn TMĐT CTUT Gear</strong>
                  <p>
                    Tôi cam kết kinh doanh hàng chính hãng đã ký hợp đồng cung ứng từ Kho Tổng Trung Tâm, 
                    thực hiện xuất kho bàn giao bưu tá đúng hẹn và tuân thủ chính sách bảo hành 1 đổi 1.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="register-actions-footer">
            <Link to="/seller/login" className="btn-back-seller">
              ← Đã có tài khoản Người Bán? Đăng nhập ngay
            </Link>

            <button type="submit" className="btn-complete-register" disabled={loading}>
              <FiShoppingBag />
              <span>{loading ? 'Đang Khởi Tạo Gian Hàng...' : 'HOÀN TẤT ĐĂNG KÝ GIAN HÀNG'}</span>
              <FiArrowRight />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default SellerRegister;
