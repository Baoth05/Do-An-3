import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiHome } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import '../Product/ProductForm.css';

const WarehouseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    maKho: '',
    tenKho: '',
    diaChi: '',
    sucChuaToiDa: 50000,
    trangThai: 'HOAT_DONG',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchDetail();
    } else {
      setFormData(prev => ({
        ...prev,
        maKho: 'KHO-' + Math.floor(100 + Math.random() * 900),
      }));
    }
  }, [id, isEditMode]);

  const fetchDetail = async () => {
    try {
      setIsLoading(true);
      const w = await wmsCoreService.getWarehouseById(id);
      if (w) {
        setFormData({
          maKho: w.maKho || '',
          tenKho: w.tenKho || '',
          diaChi: w.diaChi || '',
          sucChuaToiDa: w.sucChuaToiDa || 50000,
          trangThai: w.trangThai || 'HOAT_DONG',
        });
      }
    } catch (e) {
      console.warn('Lỗi lấy thông tin kho:', e.message);
      setErrorMsg('Không thể nạp thông tin kho!');
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

    if (!formData.maKho.trim() || !formData.tenKho.trim()) {
      alert('Vui lòng nhập đầy đủ Mã kho và Tên kho!');
      return;
    }

    const payload = {
      ...formData,
      sucChuaToiDa: formData.sucChuaToiDa ? Number(formData.sucChuaToiDa) : 50000,
    };

    try {
      setIsSubmitting(true);
      if (isEditMode) {
        await wmsCoreService.updateWarehouse(id, payload);
        alert('Cập nhật kho bãi thành công!');
      } else {
        await wmsCoreService.createWarehouse(payload);
        alert('Thêm mới kho bãi thành công!');
      }
      navigate('/warehouses');
    } catch (err) {
      const msg = err.response?.data || err.message || 'Lỗi khi lưu kho hàng';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="product-form-container">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate('/warehouses')}>
          <FiArrowLeft size={18} /> Quay lại
        </button>
        <h2>{isEditMode ? 'Chỉnh Sửa Kho Hàng' : 'Thêm Mới Kho Hàng Vào Hệ Thống'}</h2>
      </div>

      {errorMsg && (
        <div style={{ background: '#fff5f5', color: '#c53030', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Đang nạp thông tin...</div>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
          <div className="form-card">
            <h3><FiHome /> Thông Tin Kho Hàng</h3>
            
            <div className="form-group">
              <label>Mã Kho (*):</label>
              <input 
                type="text" 
                name="maKho" 
                value={formData.maKho} 
                onChange={handleChange} 
                required 
                placeholder="VD: KHO-HCM" 
              />
            </div>

            <div className="form-group">
              <label>Tên Kho Bãi (*):</label>
              <input 
                type="text" 
                name="tenKho" 
                value={formData.tenKho} 
                onChange={handleChange} 
                required 
                placeholder="VD: Kho Tổng Trung Tâm (KHO-HCM)" 
              />
            </div>

            <div className="form-group">
              <label>Địa Chỉ:</label>
              <input 
                type="text" 
                name="diaChi" 
                value={formData.diaChi} 
                onChange={handleChange} 
                placeholder="VD: Lô A2 KCN Tân Bình, TP.HCM" 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Sức Chứa Tối Đa (món):</label>
                <input 
                  type="number" 
                  name="sucChuaToiDa" 
                  value={formData.sucChuaToiDa} 
                  onChange={handleChange} 
                  placeholder="VD: 50000" 
                />
              </div>

              <div className="form-group">
                <label>Trạng Thái:</label>
                <select name="trangThai" value={formData.trangThai} onChange={handleChange}>
                  <option value="HOAT_DONG">Đang hoạt động</option>
                  <option value="TAM_DUNG">Tạm dừng</option>
                </select>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <FiSave size={16} /> {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Cập Nhật' : 'Tạo Kho Bãi')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default WarehouseForm;

