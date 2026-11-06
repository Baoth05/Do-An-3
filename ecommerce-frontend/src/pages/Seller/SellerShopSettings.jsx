// src/pages/Seller/SellerShopSettings.jsx
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { FiShoppingBag, FiCheckCircle, FiSave, FiMapPin, FiPhone, FiInfo } from 'react-icons/fi';
import './SellerShopSettings.css';

const SellerShopSettings = () => {
  const { storeId, currentStore } = useOutletContext();
  const [formData, setFormData] = useState({
    tenKho: '',
    diaChi: '',
    soDienThoai: '',
    moTaGianHang: '',
    anhDaiDienShop: '',
  });
  const [loading, setLoading] = useState(false);
  const [alertNotice, setAlertNotice] = useState('');

  useEffect(() => {
    if (currentStore) {
      setFormData({
        tenKho: currentStore.tenKho || '',
        diaChi: currentStore.diaChi || '',
        soDienThoai: currentStore.soDienThoai || '',
        moTaGianHang: currentStore.moTaGianHang || '',
        anhDaiDienShop: currentStore.anhDaiDienShop || '',
      });
    }
  }, [currentStore]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await marketplaceService.updateStoreProfile(storeId, formData);
      setAlertNotice('Đã cập nhật hồ sơ gian hàng thành công!');
      setTimeout(() => setAlertNotice(''), 3000);
    } catch (err) {
      alert('Lỗi cập nhật: ' + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-settings-page">
      {alertNotice && (
        <div className="seller-toast-alert">
          <FiCheckCircle size={18} /> {alertNotice}
        </div>
      )}

      <div className="seller-page-header">
        <div>
          <h2>Hồ Sơ & Thiết Lập Gian Hàng</h2>
          <p>Tùy chỉnh thông tin hiển thị của Shop đến khách hàng trên Sàn Thương Mại Điện Tử</p>
        </div>
      </div>

      <div className="settings-card">
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="shop-preview-avatar-wrap">
            <img 
              src={formData.anhDaiDienShop || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150'} 
              alt="Logo Shop" 
              className="shop-avatar-large" 
            />
            <div className="avatar-input-group">
              <label>Đường Dẫn Ảnh Đại Diện Shop (URL):</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={formData.anhDaiDienShop}
                onChange={(e) => setFormData({ ...formData, anhDaiDienShop: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group-seller">
            <label>Tên Gian Hàng Hiển Thị *</label>
            <input
              type="text"
              required
              value={formData.tenKho}
              onChange={(e) => setFormData({ ...formData, tenKho: e.target.value })}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group-seller">
              <label>Địa Chỉ Kho Hàng Của Shop *</label>
              <input
                type="text"
                required
                value={formData.diaChi}
                onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
              />
            </div>

            <div className="form-group-seller">
              <label>Số Điện Thoại Hotline / Zalo</label>
              <input
                type="tel"
                value={formData.soDienThoai}
                onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group-seller">
            <label>Mô Tả & Giới Thiệu Về Gian Hàng</label>
            <textarea
              rows="4"
              value={formData.moTaGianHang}
              onChange={(e) => setFormData({ ...formData, moTaGianHang: e.target.value })}
              placeholder="Giới thiệu về chính sách bảo hành, nguồn gốc sản phẩm của shop..."
            />
          </div>

          <div className="form-actions-bar">
            <button type="submit" className="btn-save-settings" disabled={loading}>
              <FiSave /> {loading ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerShopSettings;
