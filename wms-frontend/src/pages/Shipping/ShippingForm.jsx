import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiTruck, FiPhone, 
  FiGlobe, FiHash, FiActivity
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ShippingForm.css';

const ShippingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    maDonVi: '',
    tenDonVi: '',
    thongTinLienHe: '',
    website: '',
    trangThai: 'HOAT_DONG',
  });

  useEffect(() => {
    if (isEditMode) {
      fetchShipperDetail();
    } else {
      setFormData(prev => ({
        ...prev,
        maDonVi: 'DV-' + Math.floor(100 + Math.random() * 900),
      }));
    }
  }, [id, isEditMode]);

  const fetchShipperDetail = async () => {
    try {
      setIsLoading(true);
      const shipper = await wmsCoreService.getShipperById(id);
      if (shipper) {
        setFormData({
          maDonVi: shipper.maDonVi || '',
          tenDonVi: shipper.tenDonVi || '',
          thongTinLienHe: shipper.thongTinLienHe || '',
          website: shipper.website || '',
          trangThai: shipper.trangThai || 'HOAT_DONG',
        });
      }
    } catch (e) {
      console.warn('Lỗi lấy chi tiết hãng giao vận:', e.message);
      setErrorMsg('Không thể nạp thông tin đơn vị giao vận!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.maDonVi.trim() || !formData.tenDonVi.trim()) {
      alert('Vui lòng điền đầy đủ Mã và Tên đơn vị vận chuyển!');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode) {
        await wmsCoreService.updateShipper(id, formData);
        alert('Cập nhật đơn vị vận chuyển thành công!');
      } else {
        await wmsCoreService.createShipper(formData);
        alert('Thêm mới đơn vị vận chuyển thành công!');
      }
      navigate('/shipping');
    } catch (err) {
      const msg = err.response?.data || err.message || 'Lỗi khi lưu đơn vị vận chuyển';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="shipping-form-container">
      {/* Sửa lại cụm header cho thẳng hàng, không bị đẩy ra xa nữa */}
      <div className="form-header">
        <button type="button" className="btn-back" onClick={() => navigate('/shipping')} title="Quay lại">
          <FiArrowLeft size={20} />
        </button>
        <h2>{isEditMode ? 'Chỉnh Sửa Đối Tác Vận Chuyển' : 'Thêm Mới Đối Tác Vận Chuyển'}</h2>
      </div>

      {errorMsg && (
        <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '16px', borderRadius: '10px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong>Cảnh báo:</strong> {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Đang nạp dữ liệu hãng giao vận...</div>
      ) : (
        <form onSubmit={handleSubmit} className="form-card">
          <h3><FiTruck size={22} /> Thông Tin Hệ Thống Đối Tác</h3>
          
          <div className="shipping-form-grid">
            <div className="form-group">
              <label><FiHash size={14}/> Mã Đơn Vị <span className="required">*</span></label>
              <input 
                type="text" 
                name="maDonVi" 
                value={formData.maDonVi} 
                onChange={handleChange} 
                required 
                placeholder="VD: DV-GHTK" 
              />
            </div>

            <div className="form-group">
              <label><FiTruck size={14}/> Tên Đơn Vị Giao Vận <span className="required">*</span></label>
              <input 
                type="text" 
                name="tenDonVi" 
                value={formData.tenDonVi} 
                onChange={handleChange} 
                required 
                placeholder="VD: Giao Hàng Tiết Kiệm" 
              />
            </div>

            <div className="form-group full-width">
              <label><FiPhone size={14}/> Hotline / Điện Thoại Tổng Đài</label>
              <input 
                type="text" 
                name="thongTinLienHe" 
                value={formData.thongTinLienHe} 
                onChange={handleChange} 
                placeholder="VD: 1900 6092" 
              />
            </div>

            <div className="form-group full-width">
              <label><FiGlobe size={14}/> Website / Link Tra Cứu Vận Đơn</label>
              <input 
                type="url" 
                name="website" 
                value={formData.website} 
                onChange={handleChange} 
                placeholder="VD: https://ghtk.vn" 
              />
            </div>

            <div className="form-group full-width">
              <label><FiActivity size={14}/> Trạng Thái Tích Hợp API</label>
              <select name="trangThai" value={formData.trangThai} onChange={handleChange}>
                <option value="HOAT_DONG">Đang hoạt động / Kết nối</option>
                <option value="TAM_DUNG">Tạm dừng kết nối</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit-large" disabled={isSubmitting}>
                <FiSave size={18} /> {isSubmitting ? 'Đang xử lý...' : (isEditMode ? 'Lưu Thay Đổi' : 'Xác Nhận Thêm Mới')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ShippingForm;