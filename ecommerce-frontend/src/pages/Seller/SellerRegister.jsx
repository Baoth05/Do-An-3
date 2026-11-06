// src/pages/Seller/SellerRegister.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { 
  FiShoppingBag, FiBox, FiCheckCircle, FiShield, 
  FiMapPin, FiUser, FiPhone, FiMail, FiArrowRight, FiFileText 
} from 'react-icons/fi';
import './SellerRegister.css';

const SellerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Thông tin người đại diện chủ shop
    hoTen: '',
    email: '',
    soDienThoai: '',
    soCccd: '',
    
    // Thông tin Kho Cửa Hàng Riêng
    maKho: '',
    tenKho: '',
    diaChi: '',
    sucChuaToiDa: 1000,
    anhDaiDienShop: '',
    moTaGianHang: '',
  });

  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tự động gợi ý mã kho khi nhập tên shop
  const handleTenKhoChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => {
      // Chuyển tên shop thành mã không dấu (VD: Apple Store -> STORE-APPLESTORE)
      const clean = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
      const suggestedCode = clean ? `STORE-${clean.substring(0, 12)}` : '';
      return {
        ...prev,
        tenKho: name,
        maKho: prev.maKho || suggestedCode,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!agreed) {
      alert('Vui lòng đồng ý với Quy chế hoạt động sàn TMĐT & Chuỗi cung ứng kho vận!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        maKho: formData.maKho.trim().toUpperCase(),
        tenKho: formData.tenKho.trim(),
        diaChi: formData.diaChi.trim(),
        soDienThoai: formData.soDienThoai.trim(),
        email: formData.email.trim(),
        sucChuaToiDa: Number(formData.sucChuaToiDa) || 1000,
        loaiHinh: 'KHO_CUA_HANG', // Loại hình kho cửa hàng bán lẻ
        moTaGianHang: formData.moTaGianHang.trim() || `Gian hàng chính thức của ${formData.tenKho} trên Sàn CTUT Gear.`,
        anhDaiDienShop: formData.anhDaiDienShop.trim() || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop',
        trangThai: 'HOAT_DONG',
      };

      const newStore = await marketplaceService.createStore(payload);

      // Lưu lại store ID vừa tạo để Kênh Người Bán sử dụng
      const createdId = newStore.id || Date.now();
      localStorage.setItem('seller_selected_store_id', String(createdId));

      alert(`🎉 Chúc mừng! Gian hàng và Kho riêng "${payload.tenKho}" đã được khởi tạo thành công!`);
      // Chuyển hướng sang trang Ký Hợp Đồng Nhập Kho
      navigate('/seller/contracts', { state: { justRegistered: true, storeName: payload.tenKho } });
    } catch (err) {
      setErrorMsg(err.response?.data || err.message || 'Lỗi đăng ký gian hàng. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="seller-register-page">
      <div className="container">
        {/* Banner tiêu đề */}
        <div className="register-hero-header">
          <div className="hero-badge-wrap">
            <span className="hero-pill">✨ MÔ HÌNH CHUỖI CUNG ỨNG B2B2C</span>
            <h2>Đăng Ký Mở Gian Hàng & Khởi Tạo Kho Riêng</h2>
            <p>
              Gia nhập Hệ sinh thái Sàn TMĐT Tập Trung CTUT Gear. Sau khi đăng ký, bạn sẽ sở hữu một Kho Cửa Hàng 
              riêng biệt, có thể ký hợp đồng cung ứng với Kho Tổng để nhập hàng về bán.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="register-error-alert">
            {errorMsg}
          </div>
        )}

        {/* Form Đăng Ký */}
        <form onSubmit={handleSubmit} className="register-main-card">
          {/* Phần 1: Thông tin chủ sở hữu */}
          <div className="form-section-block">
            <div className="section-title-line">
              <span className="step-num">1</span>
              <div>
                <h3>Thông Tin Chủ Cửa Hàng / Người Đại Diện</h3>
                <p>Thông tin pháp lý của chủ sở hữu hoặc người chịu trách nhiệm gian hàng</p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field-seller">
                <label>Họ và tên người đại diện *</label>
                <div className="input-with-icon">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={formData.hoTen}
                    onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field-seller">
                <label>Số điện thoại liên hệ / Zalo *</label>
                <div className="input-with-icon">
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0912345678"
                    value={formData.soDienThoai}
                    onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field-seller">
                <label>Địa chỉ Email nhận thông báo *</label>
                <div className="input-with-icon">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    required
                    placeholder="an.nguyen@ctut.edu.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field-seller">
                <label>Số CCCD / Mã số thuế kinh doanh *</label>
                <div className="input-with-icon">
                  <FiShield className="input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="092098001234"
                    value={formData.soCccd}
                    onChange={(e) => setFormData({ ...formData, soCccd: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Phần 2: Thiết lập Kho Cửa Hàng Riêng */}
          <div className="form-section-block">
            <div className="section-title-line">
              <span className="step-num">2</span>
              <div>
                <h3>Thiết Lập Kho Cửa Hàng Riêng (Store Warehouse)</h3>
                <p>Khởi tạo kho vật lý của shop để tiếp nhận hàng nhập từ Kho Tổng và xuất hàng cho bưu tá</p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field-seller">
                <label>Tên Gian Hàng / Cửa Hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Samsung Official CTUT, MyGear Gaming..."
                  value={formData.tenKho}
                  onChange={handleTenKhoChange}
                />
              </div>

              <div className="form-field-seller">
                <label>Mã Kho Cửa Hàng (Unique Code) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: STORE-SAMSUNG, STORE-MYGEAR"
                  value={formData.maKho}
                  onChange={(e) => setFormData({ ...formData, maKho: e.target.value.toUpperCase() })}
                />
                <small className="field-hint">Mã định danh duy nhất cho kho hàng của shop trong hệ thống WMS.</small>
              </div>
            </div>

            <div className="form-field-seller">
              <label>Địa Chỉ Kho Hàng / Điểm Giao Nhận Bưu Tá *</label>
              <div className="input-with-icon">
                <FiMapPin className="input-icon" />
                <input
                  type="text"
                  required
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, TP. Cần Thơ..."
                  value={formData.diaChi}
                  onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field-seller">
                <label>Sức Chứa Tối Đa Của Kho (Sản phẩm)</label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={formData.sucChuaToiDa}
                  onChange={(e) => setFormData({ ...formData, sucChuaToiDa: e.target.value })}
                />
              </div>

              <div className="form-field-seller">
                <label>Đường dẫn Logo / Ảnh Đại Diện Shop (URL)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.anhDaiDienShop}
                  onChange={(e) => setFormData({ ...formData, anhDaiDienShop: e.target.value })}
                />
              </div>
            </div>

            <div className="form-field-seller">
              <label>Mô Tả & Giới Thiệu Gian Hàng</label>
              <textarea
                rows="3"
                placeholder="Giới thiệu về các mặt hàng chủ đạo, cam kết bảo hành, chất lượng phục vụ..."
                value={formData.moTaGianHang}
                onChange={(e) => setFormData({ ...formData, moTaGianHang: e.target.value })}
              />
            </div>
          </div>

          {/* Phần 3: Cam kết chính sách B2B2C */}
          <div className="form-section-block">
            <div className="policy-commitment-box">
              <label className="checkbox-agreement">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <div>
                  <strong>Tôi cam kết tuân thủ Quy Chế Hoạt Động Sàn TMĐT & Chuỗi Cung Ứng Kho Vận 2 Tầng</strong>
                  <p>
                    Đồng ý rằng sau khi khởi tạo Kho riêng, tôi sẽ thực hiện <strong>Ký Hợp Đồng Cung Ứng</strong> với Kho Tổng Trung Tâm 
                    để nhập các sản phẩm chính hãng về kho trước khi kích hoạt đăng bán lên sàn.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="register-actions-footer">
            <Link to="/seller" className="btn-back-seller">
              Đã có gian hàng? Vào Kênh Người Bán
            </Link>
            <button
              type="submit"
              className="btn-complete-register"
              disabled={isSubmitting}
            >
              <FiBox />
              {isSubmitting ? 'Đang Khởi Tạo Kho...' : 'Hoàn Tất Đăng Ký & Tạo Kho Riêng'}
              <FiArrowRight />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerRegister;

