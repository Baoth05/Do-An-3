import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiBox, FiDollarSign, 
  FiFileText, FiLayers, FiImage, FiRefreshCw 
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
      setErrorMsg('Không thể nạp thông tin sản phẩm từ Backend.');
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
      {/* 1. Header & Điều hướng Quay lại */}
      <div className="pf-header">
        <div className="pf-header-left">
          <button type="button" className="pf-btn-back" onClick={() => navigate('/products')}>
            <FiArrowLeft size={18} /> Quay lại
          </button>
          <div className="pf-header-title">
            <h2>{isEditMode ? 'Chỉnh Sửa Hàng Hóa (Master SKU)' : 'Thêm Hàng Hóa Mới'}</h2>
            <p>Cập nhật quy cách đóng gói, thông số và giá cả sản phẩm trong chuỗi kho</p>
          </div>
        </div>
      </div>

      {errorMsg && <div className="pf-alert-error">{errorMsg}</div>}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <FiRefreshCw className="spin-icon" size={32} style={{ color: '#2563eb', marginBottom: '12px' }} />
          <p>Đang tải dữ liệu sản phẩm...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="pf-form-layout">
          {/* CỘT TRÁI: Thông tin chính & Mô tả */}
          <div className="pf-main-column">
            {/* Card 1: Thông tin cơ bản */}
            <div className="pf-card">
              <div className="pf-card-header">
                <FiBox />
                <h3>Thông Tin Sản Phẩm</h3>
              </div>
              <div className="pf-card-body">
                <div className="pf-form-row">
                  <div className="pf-form-group">
                    <label>Mã SKU <span className="pf-required">*</span></label>
                    <input 
                      type="text" 
                      name="sku" 
                      value={formData.sku} 
                      onChange={handleChange} 
                      required 
                      placeholder="VD: SP001" 
                    />
                  </div>
                  <div className="pf-form-group">
                    <label>Khối Lượng (kg)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="khoiLuong" 
                      value={formData.khoiLuong} 
                      onChange={handleChange} 
                      placeholder="VD: 0.25" 
                    />
                  </div>
                </div>

                <div className="pf-form-group">
                  <label>Tên Sản Phẩm / Hàng Hóa <span className="pf-required">*</span></label>
                  <input 
                    type="text" 
                    name="tenSanPham" 
                    value={formData.tenSanPham} 
                    onChange={handleChange} 
                    required 
                    placeholder="VD: Laptop Asus TUF Gaming..." 
                  />
                </div>

                <div className="pf-form-row">
                  <div className="pf-form-group">
                    <label>Đơn Vị Tính</label>
                    <select name="donViTinh" value={formData.donViTinh} onChange={handleChange}>
                      <option value="Cái">Cái</option>
                      <option value="Chiếc">Chiếc</option>
                      <option value="Hộp">Hộp</option>
                      <option value="Thùng">Thùng</option>
                      <option value="Bộ">Bộ</option>
                      <option value="Kg">Kg</option>
                    </select>
                  </div>

                  <div className="pf-form-group">
                    <label>Danh Mục Ngành Hàng</label>
                    <select name="danhMucId" value={formData.danhMucId} onChange={handleChange}>
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.tenDanhMuc}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Mô tả chi tiết */}
            <div className="pf-card">
              <div className="pf-card-header">
                <FiFileText />
                <h3>Mô Tả & Quy Cách Đóng Gói</h3>
              </div>
              <div className="pf-card-body">
                <div className="pf-form-group">
                  <textarea 
                    name="moTa" 
                    rows="5" 
                    value={formData.moTa} 
                    onChange={handleChange} 
                    placeholder="Nhập thông số kỹ thuật chi tiết hoặc quy cách đóng gói hàng hóa..." 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Giá cả, Trạng thái & Hình ảnh */}
          <div className="pf-side-column">
            {/* Card 3: Giá cả & Kinh doanh */}
            <div className="pf-card">
              <div className="pf-card-header">
                <FiDollarSign />
                <h3>Thiết Lập Giá & Trạng Thái</h3>
              </div>
              <div className="pf-card-body">
                <div className="pf-form-group">
                  <label>Giá Bán Niêm Yết (VNĐ)</label>
                  <input 
                    type="number" 
                    name="giaBan" 
                    value={formData.giaBan} 
                    onChange={handleChange} 
                    placeholder="0" 
                  />
                </div>

                <div className="pf-form-group">
                  <label>Giá Nhập Tham Khảo (VNĐ)</label>
                  <input 
                    type="number" 
                    name="giaNhap" 
                    value={formData.giaNhap} 
                    onChange={handleChange} 
                    placeholder="0" 
                  />
                </div>

                <div className="pf-form-group">
                  <label>Trạng Thái Kinh Doanh</label>
                  <select name="trangThai" value={formData.trangThai} onChange={handleChange}>
                    <option value="DANG_KINH_DOANH">Đang kinh doanh</option>
                    <option value="NGUNG_KINH_DOANH">Ngừng kinh doanh</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card 4: Hình ảnh đại diện */}
            <div className="pf-card">
              <div className="pf-card-header">
                <FiImage />
                <h3>Hình Ảnh Sản Phẩm</h3>
              </div>
              <div className="pf-card-body">
                <div className="pf-form-group">
                  <label>Đường dẫn ảnh (URL)</label>
                  <input 
                    type="text" 
                    name="hinhAnh" 
                    value={formData.hinhAnh} 
                    onChange={handleChange} 
                    placeholder="https://example.com/image.png" 
                  />
                </div>

                <div className="pf-image-preview">
                  {formData.hinhAnh ? (
                    <img src={formData.hinhAnh} alt="Preview" onError={(e) => { e.target.style.display='none'; }} />
                  ) : (
                    <div className="pf-image-placeholder">
                      <FiImage size={32} />
                      <span>Chưa có hình ảnh</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Nút Submit chính */}
            <button type="submit" className="pf-btn-submit" disabled={isSubmitting}>
              <FiSave size={18} />
              {isSubmitting ? 'Đang lưu dữ liệu...' : (isEditMode ? 'Cập Nhật Hàng Hóa' : 'Tạo Hàng Hóa')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProductForm;