import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiBox, FiDollarSign, 
  FiFileText, FiCheckCircle, FiLayers 
} from 'react-icons/fi';
import { productService } from '../../services/productService';
import './ProductForm.css';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    sku: '',
    tenSanPham: '',
    donViTinh: 'Cái',
    danhMucId: '',
    giaBan: '',
    giaNhap: '',
    khoiLuong: '',
    trangThai: 'DANG_KINH_DOANH',
    hinhAnh: '',
    moTa: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, [id, isEditMode]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const catData = await productService.getCategories();
      if (Array.isArray(catData)) {
        setCategories(catData);
      }

      if (isEditMode) {
        const prod = await productService.getProductById(id);
        if (prod) {
          setFormData({
            sku: prod.sku || '',
            tenSanPham: prod.tenSanPham || prod.tenHangHoa || '',
            donViTinh: prod.donViTinh || 'Cái',
            danhMucId: prod.danhMucId || (catData?.find(c => c.tenDanhMuc === prod.tenDanhMuc)?.id) || '',
            giaBan: prod.giaBan || '',
            giaNhap: prod.giaNhap || '',
            khoiLuong: prod.khoiLuong || '',
            trangThai: prod.trangThai || 'DANG_KINH_DOANH',
            hinhAnh: prod.hinhAnh || '',
            moTa: prod.moTa || '',
          });
        }
      } else {
        setFormData(prev => ({
          ...prev,
          sku: 'SP' + Math.floor(100 + Math.random() * 900),
          danhMucId: catData?.[0]?.id || '',
        }));
      }
    } catch (e) {
      console.warn('Lỗi tải dữ liệu sản phẩm:', e.message);
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

    if (!formData.sku.trim() || !formData.tenSanPham.trim()) {
      alert('Vui lòng điền đầy đủ Mã SKU và Tên sản phẩm!');
      return;
    }

    const payload = {
      ...formData,
      danhMucId: formData.danhMucId ? Number(formData.danhMucId) : null,
      giaBan: formData.giaBan ? Number(formData.giaBan) : 0,
      giaNhap: formData.giaNhap ? Number(formData.giaNhap) : 0,
      khoiLuong: formData.khoiLuong ? Number(formData.khoiLuong) : 0,
    };

    try {
      setIsSubmitting(true);
      if (isEditMode) {
        await productService.updateProduct(id, payload);
        alert('Cập nhật hàng hóa thành công!');
      } else {
        await productService.createProduct(payload);
        alert('Thêm mới hàng hóa thành công!');
      }
      navigate('/products');
    } catch (err) {
      const msg = err.response?.data || err.message || 'Lỗi khi lưu sản phẩm';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="product-form-container">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate('/products')}>
          <FiArrowLeft size={18} /> Quay lại
        </button>
        <h2>{isEditMode ? 'Chỉnh Sửa Hàng Hóa' : 'Thêm Mới Hàng Hóa Vào Kho'}</h2>
      </div>

      {errorMsg && (
        <div style={{ background: '#fff5f5', color: '#c53030', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Đang nạp thông tin...</div>
      ) : (
        <form onSubmit={handleSubmit} className="product-form-grid">
          <div className="form-card">
            <h3><FiBox /> Thông Tin Cơ Bản</h3>
            <div className="form-group">
              <label>Mã SKU (*):</label>
              <input 
                type="text" 
                name="sku" 
                value={formData.sku} 
                onChange={handleChange} 
                required 
                placeholder="VD: SP001" 
              />
            </div>

            <div className="form-group">
              <label>Tên Sản Phẩm (*):</label>
              <input 
                type="text" 
                name="tenSanPham" 
                value={formData.tenSanPham} 
                onChange={handleChange} 
                required 
                placeholder="VD: iPhone 15 Pro Max 256GB" 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Đơn Vị Tính:</label>
                <select name="donViTinh" value={formData.donViTinh} onChange={handleChange}>
                  <option value="Cái">Cái</option>
                  <option value="Hộp">Hộp</option>
                  <option value="Bộ">Bộ</option>
                  <option value="Chiếc">Chiếc</option>
                  <option value="Kiện">Kiện</option>
                </select>
              </div>

              <div className="form-group">
                <label>Danh Mục Hàng Hóa:</label>
                <select name="danhMucId" value={formData.danhMucId} onChange={handleChange}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.tenDanhMuc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Khối Lượng (kg):</label>
              <input 
                type="number" 
                step="0.01" 
                name="khoiLuong" 
                value={formData.khoiLuong} 
                onChange={handleChange} 
                placeholder="VD: 0.25" 
              />
            </div>

            <div className="form-group">
              <label>Mô Tả Sản Phẩm:</label>
              <textarea 
                name="moTa" 
                rows="4" 
                value={formData.moTa} 
                onChange={handleChange} 
                placeholder="Mô tả thông số hoặc quy cách đóng gói..." 
              />
            </div>
          </div>

          <div className="form-card">
            <h3><FiDollarSign /> Giá Cả & Trạng Thái</h3>
            <div className="form-group">
              <label>Giá Bán Niêm Yết (VNĐ):</label>
              <input 
                type="number" 
                name="giaBan" 
                value={formData.giaBan} 
                onChange={handleChange} 
                placeholder="VD: 29990000" 
              />
            </div>

            <div className="form-group">
              <label>Giá Nhập Tham Khảo (VNĐ):</label>
              <input 
                type="number" 
                name="giaNhap" 
                value={formData.giaNhap} 
                onChange={handleChange} 
                placeholder="VD: 25000000" 
              />
            </div>

            <div className="form-group">
              <label>Trạng Thái Kinh Doanh:</label>
              <select name="trangThai" value={formData.trangThai} onChange={handleChange}>
                <option value="DANG_KINH_DOANH">Đang kinh doanh</option>
                <option value="NGUNG_KINH_DOANH">Ngừng kinh doanh</option>
              </select>
            </div>

            <div className="form-actions" style={{ marginTop: '24px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <FiSave size={16} /> {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Cập Nhật' : 'Tạo Hàng Hóa')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProductForm;
