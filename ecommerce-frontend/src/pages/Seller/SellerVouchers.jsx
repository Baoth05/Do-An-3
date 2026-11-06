// src/pages/Seller/SellerVouchers.jsx
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { FiTag, FiPlus, FiCheckCircle, FiCopy, FiCalendar } from 'react-icons/fi';
import './SellerVouchers.css';

const SellerVouchers = () => {
  const { storeId, currentStore } = useOutletContext();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alertNotice, setAlertNotice] = useState('');

  const [form, setForm] = useState({
    maVoucher: '',
    phanTramGiam: 10,
    giamToiDa: 50000,
    donHangToiThieu: 200000,
    soLuongConLai: 50,
    moTa: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const data = await marketplaceService.getStoreVouchers(storeId);
      setVouchers(data);
    } catch (err) {
      console.error('Lỗi tải voucher shop:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchVouchers();
    }
  }, [storeId]);

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        cuaHangId: Number(storeId),
        maVoucher: form.maVoucher.trim().toUpperCase(),
        phanTramGiam: Number(form.phanTramGiam),
        giamToiDa: Number(form.giamToiDa),
        donHangToiThieu: Number(form.donHangToiThieu),
        soLuongConLai: Number(form.soLuongConLai),
      };

      await marketplaceService.createStoreVoucher(payload);
      setAlertNotice(`Tạo voucher "${payload.maVoucher}" thành công!`);
      setShowCreateModal(false);
      setForm({
        maVoucher: '',
        phanTramGiam: 10,
        giamToiDa: 50000,
        donHangToiThieu: 200000,
        soLuongConLai: 50,
        moTa: '',
      });
      setTimeout(() => setAlertNotice(''), 3000);
      await fetchVouchers();
    } catch (err) {
      alert('Lỗi tạo voucher: ' + (err.response?.data || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="seller-vouchers-page">
      {alertNotice && (
        <div className="seller-toast-alert">
          <FiCheckCircle size={18} /> {alertNotice}
        </div>
      )}

      <div className="seller-page-header-flex">
        <div>
          <h2>Mã Giảm Giá Độc Quyền Của Gian Hàng</h2>
          <p>Tạo các mã khuyến mãi dành riêng cho khách hàng ghé thăm gian hàng <strong>{currentStore?.tenKho}</strong></p>
        </div>
        <button className="btn-add-voucher" onClick={() => setShowCreateModal(true)}>
          <FiPlus /> Tạo Mã Khuyến Mãi Mới
        </button>
      </div>

      {loading ? (
        <div className="seller-loading-state">
          <div className="spinner"></div>
          <p>Đang tải danh sách voucher của shop...</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="seller-empty-state">
          <FiTag size={48} className="empty-icon" />
          <h3>Gian hàng chưa có mã giảm giá nào</h3>
          <p>Hãy tạo mã giảm giá để kích thích khách hàng mua sắm tại gian hàng của bạn!</p>
          <button className="btn-add-voucher" onClick={() => setShowCreateModal(true)}>
            <FiPlus /> Tạo Mã Đầu Tiên
          </button>
        </div>
      ) : (
        <div className="seller-vouchers-grid">
          {vouchers.map((v) => (
            <div key={v.id} className="seller-voucher-card">
              <div className="v-card-top">
                <span className="v-code-tag">{v.maVoucher}</span>
                <span className="v-discount-badge">Giảm {v.phanTramGiam}%</span>
              </div>
              <p className="v-desc">{v.moTa || `Đơn hàng tối thiểu ${Number(v.donHangToiThieu).toLocaleString('vi-VN')} đ`}</p>
              <div className="v-meta-grid">
                <div>
                  <small>Giảm Tối Đa:</small>
                  <strong>{Number(v.giamToiDa).toLocaleString('vi-VN')} đ</strong>
                </div>
                <div>
                  <small>Còn Lại:</small>
                  <strong>{v.soLuongConLai} lượt</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tạo Voucher */}
      {showCreateModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="publish-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏷️ Tạo Voucher Mới Cho Gian Hàng</h3>
              <span className="btn-close-modal" onClick={() => setShowCreateModal(false)}>✕</span>
            </div>

            <form onSubmit={handleCreateVoucher}>
              <div className="form-group-seller">
                <label>Mã Khuyến Mãi (Code viết hoa) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: APPLE50K, GEARSALE10..."
                  value={form.maVoucher}
                  onChange={(e) => setForm({ ...form, maVoucher: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group-seller">
                  <label>% Giảm Giá *</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    required
                    value={form.phanTramGiam}
                    onChange={(e) => setForm({ ...form, phanTramGiam: e.target.value })}
                  />
                </div>
                <div className="form-group-seller">
                  <label>Mức Giảm Tối Đa (VNĐ) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={form.giamToiDa}
                    onChange={(e) => setForm({ ...form, giamToiDa: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group-seller">
                  <label>Đơn Hàng Tối Thiểu (VNĐ) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={form.donHangToiThieu}
                    onChange={(e) => setForm({ ...form, donHangToiThieu: e.target.value })}
                  />
                </div>
                <div className="form-group-seller">
                  <label>Số Lượng Lượt Dùng *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.soLuongConLai}
                    onChange={(e) => setForm({ ...form, soLuongConLai: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-seller">
                <label>Mô Tả Hiển Thị Cho Khách</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giảm 10% tối đa 50K cho đơn từ 200K tại Shop..."
                  value={form.moTa}
                  onChange={(e) => setForm({ ...form, moTa: e.target.value })}
                />
              </div>

              <div className="modal-actions-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>Hủy</button>
                <button type="submit" className="btn-save-publish" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang Tạo...' : 'Phát Hành Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerVouchers;

