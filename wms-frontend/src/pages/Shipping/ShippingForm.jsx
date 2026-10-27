import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiTruck, FiPhone, 
  FiGlobe, FiCheckCircle 
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
      <div className="form-header">
        <button 
          type="button" 
          className="btn-back" 
          onClick={() => navigate('/shipping')}
        >
          <FiArrowLeft size={18} /> Quay lại
        </button>
        <h2>{isEditMode ? 'Chỉnh Sửa Hãng Vận Chuyển' : 'Thêm Mới Hãng Vận Chuyển'}</h2>
      </div>

      {errorMsg && (
        <div style={{ background: '#fff5f5', color: '#c53030', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Đang nạp dữ liệu hãng giao vận...</div>
      ) : (
        <form onSubmit={handleSubmit} className="shipping-form-grid" style={{ maxWidth: '640px' }}>
          <div className="form-card">
            <h3><FiTruck /> Thông Tin Đơn Vị Giao Vận</h3>
            
            <div className="form-group">
              <label>Mã Đơn Vị (*):</label>
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
              <label>Tên Đơn Vị Giao Vận (*):</label>
              <input 
                type="text" 
                name="tenDonVi" 
                value={formData.tenDonVi} 
                onChange={handleChange} 
                required 
                placeholder="VD: Giao Hàng Tiết Kiệm (GHTK)" 
              />
            </div>

            <div className="form-group">
              <label>Hotline / Điện Thoại Liên Hệ:</label>
              <input 
                type="text" 
                name="thongTinLienHe" 
                value={formData.thongTinLienHe} 
                onChange={handleChange} 
                placeholder="VD: 1900 6092" 
              />
            </div>

            <div className="form-group">
              <label>Trang Web / Tra Cứu Vận Đơn (URL):</label>
              <input 
                type="text" 
                name="website" 
                value={formData.website} 
                onChange={handleChange} 
                placeholder="VD: https://ghtk.vn" 
              />
            </div>

            <div className="form-group">
              <label>Trạng Thái Kết Nối:</label>
              <select name="trangThai" value={formData.trangThai} onChange={handleChange}>
                <option value="HOAT_DONG">Đang hoạt động / Kết nối</option>
                <option value="TAM_DUNG">Tạm dừng kết nối</option>
              </select>
            </div>

            <div className="form-actions" style={{ marginTop: '24px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <FiSave size={16} /> {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Cập Nhật' : 'Lưu Đơn Vị Giao Vận')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ShippingForm;
