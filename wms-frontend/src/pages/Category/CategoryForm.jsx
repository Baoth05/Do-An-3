import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiLayers } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import '../Product/ProductForm.css';

const CategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    tenDanhMuc: '',
    moTa: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchDetail();
    }
  }, [id, isEditMode]);

  const fetchDetail = async () => {
    try {
      setIsLoading(true);
      const cat = await wmsCoreService.getCategoryById(id);
      if (cat) {
        setFormData({
          tenDanhMuc: cat.tenDanhMuc || '',
          moTa: cat.moTa || '',
        });
      }
    } catch (e) {
      console.warn('Lỗi lấy thông tin danh mục:', e.message);
      setErrorMsg('Không thể nạp thông tin danh mục!');
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

    if (!formData.tenDanhMuc.trim()) {
      alert('Vui lòng nhập Tên danh mục!');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode) {
        await wmsCoreService.updateCategory(id, formData);
        alert('Cập nhật danh mục thành công!');
      } else {
        await wmsCoreService.createCategory(formData);
        alert('Thêm mới danh mục thành công!');
      }
      navigate('/categories');
    } catch (err) {
      const msg = err.response?.data || err.message || 'Lỗi khi lưu danh mục';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="product-form-container">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate('/categories')}>
          <FiArrowLeft size={18} /> Quay lại
        </button>
        <h2>{isEditMode ? 'Chỉnh Sửa Danh Mục' : 'Thêm Mới Danh Mục Hàng Hóa'}</h2>
      </div>

      {errorMsg && (
        <div style={{ background: '#fff5f5', color: '#c53030', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Đang nạp thông tin...</div>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
          <div className="form-card">
            <h3><FiLayers /> Chi Tiết Danh Mục</h3>
            
            <div className="form-group">
              <label>Tên Danh Mục (*):</label>
              <input 
                type="text" 
                name="tenDanhMuc" 
                value={formData.tenDanhMuc} 
                onChange={handleChange} 
                required 
                placeholder="VD: Điện Thoại & Tablet" 
              />
            </div>

            <div className="form-group">
              <label>Mô Tả:</label>
              <textarea 
                name="moTa" 
                rows="4" 
                value={formData.moTa} 
                onChange={handleChange} 
                placeholder="Mô tả ngành hàng, phân loại..." 
              />
            </div>

            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <FiSave size={16} /> {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Cập Nhật' : 'Tạo Danh Mục')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default CategoryForm;

