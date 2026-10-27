import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiBriefcase, FiPhone, 
  FiMail, FiMapPin, FiUserCheck, FiCheckCircle 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './SupplierForm.css';

const SupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    maNhaCungCap: '',
    tenNhaCungCap: '',
    nguoiLienHe: '',
    soDienThoai: '',
    email: '',
    diaChi: '',
    trangThai: 'HOAT_DONG',
  });

  useEffect(() => {
    if (isEditMode) {
      fetchSupplierDetail();
    } else {
      setFormData(prev => ({
        ...prev,
        maNhaCungCap: 'NCC-' + Math.floor(100 + Math.random() * 900),
      }));
    }
  }, [id, isEditMode]);

  const fetchSupplierDetail = async () => {
    try {
      setIsLoading(true);
      const supplier = await wmsCoreService.getSupplierById(id);
      if (supplier) {
        setFormData({
          maNhaCungCap: supplier.maNhaCungCap || '',
          tenNhaCungCap: supplier.tenNhaCungCap || '',
          nguoiLienHe: supplier.nguoiLienHe || '',
          soDienThoai: supplier.soDienThoai || '',
          email: supplier.email || '',
          diaChi: supplier.diaChi || '',
          trangThai: supplier.trangThai || 'HOAT_DONG',
        });
      }
    } catch (e) {
      console.warn('Lỗi lấy chi tiết nhà cung cấp:', e.message);
      setErrorMsg('Không thể nạp thông tin nhà cung cấp!');
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

    if (!formData.maNhaCungCap.trim() || !formData.tenNhaCungCap.trim()) {
      alert('Vui lòng điền đầy đủ Mã và Tên nhà cung cấp!');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode) {
        await wmsCoreService.updateSupplier(id, formData);
        alert('Cập nhật nhà cung cấp thành công!');
      } else {
        await wmsCoreService.createSupplier(formData);
        alert('Thêm mới nhà cung cấp thành công!');
      }
      navigate('/suppliers');
    } catch (err) {
      const msg = err.response?.data || err.message || 'Lỗi lưu thông tin';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="supplier-form-container">
      <div className="form-header">
        <button 
          type="button" 
          className="btn-back" 
          onClick={() => navigate('/suppliers')}
        >
          <FiArrowLeft size={18} /> Quay lại
        </button>
        <h2>{isEditMode ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}</h2>
      </div>

      {errorMsg && (
        <div style={{ background: '#fff5f5', color: '#c53030', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Đang nạp dữ liệu đối tác...</div>
      ) : (
        <form onSubmit={handleSubmit} className="supplier-form-grid">
          <div className="form-card">
            <h3><FiBriefcase /> Hồ Sơ Doanh Nghiệp</h3>
            
            <div className="form-group">
              <label>Mã Nhà Cung Cấp (*):</label>
              <input 
                type="text" 
                name="maNhaCungCap" 
                value={formData.maNhaCungCap} 
                onChange={handleChange} 
                required 
                placeholder="VD: NCC-001" 
              />
            </div>

            <div className="form-group">
              <label>Tên Doanh Nghiệp / Công Ty (*):</label>
              <input 
                type="text" 
                name="tenNhaCungCap" 
                value={formData.tenNhaCungCap} 
                onChange={handleChange} 
                required 
                placeholder="VD: Công ty TNHH Apple Việt Nam" 
              />
            </div>

            <div className="form-group">
              <label>Địa Chỉ Trụ Sở:</label>
              <input 
                type="text" 
                name="diaChi" 
                value={formData.diaChi} 
                onChange={handleChange} 
                placeholder="VD: Tòa nhà Bitexco, Q.1, TP.HCM" 
              />
            </div>
          </div>

          <div className="form-card">
            <h3><FiPhone /> Thông Tin Liên Lạc</h3>

            <div className="form-group">
              <label>Người Đại Diện Liên Hệ:</label>
              <input 
                type="text" 
                name="nguoiLienHe" 
                value={formData.nguoiLienHe} 
                onChange={handleChange} 
                placeholder="VD: Trần Minh Quân" 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Số Điện Thoại:</label>
                <input 
                  type="text" 
                  name="soDienThoai" 
                  value={formData.soDienThoai} 
                  onChange={handleChange} 
                  placeholder="VD: 0901234567" 
                />
              </div>

              <div className="form-group">
                <label>Email Hợp Tác:</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="VD: b2b@apple.vn" 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Trạng Thái Hợp Tác:</label>
              <select name="trangThai" value={formData.trangThai} onChange={handleChange}>
                <option value="HOAT_DONG">Đang hợp tác</option>
                <option value="TAM_DUNG">Tạm dừng giao dịch</option>
              </select>
            </div>

            <div className="form-actions" style={{ marginTop: '24px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <FiSave size={16} /> {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Cập Nhật' : 'Lưu Nhà Cung Cấp')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default SupplierForm;
