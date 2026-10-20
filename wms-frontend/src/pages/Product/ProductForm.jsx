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
      // Nạp danh mục sản phẩm
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
            danhMucId: prod.danhMucId || catData?.find(c => c.tenDanhMuc === prod.tenDanhMuc)?.id || '',
            giaBan: prod.giaBan || '',
            giaNhap: prod.giaNhap || '',
            khoiLuong: prod.khoiLuong || '',
            trangThai: prod.trangThai || 'DANG_KINH_DOANH',
            hinhAnh: prod.hinhAnh || '',
            moTa: prod.moTa || '',
          });
        }
      } else {
        // Sinh mã SKU mẫu khi thêm mới
        setFormData(prev => ({
          ...prev,
          sku: 'SP' + Math.floor(100 + Math.random() * 900),
          danhMucId: catData?.[0]?.id || 1,
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
    if (!formData.sku.trim() || !formData.tenSanPham.trim()) {
      alert('Vui lòng điền đầy đủ Mã SKU và Tên sản phẩm!');
      return;
    }

    const payload = {
      ...formData,
      danhMucId: formData.danhMucId ? Number(formData.danhMucId) : null,
      giaBan: formData.giaBan ? Number(formData.giaBan) : null,
      giaNhap: formData.giaNhap ? Number(formData.giaNhap) : null,
      khoiLuong: formData.khoiLuong ? Number(formData.khoiLuong) : null,
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
      alert('Không thể lưu sản phẩm: ' + (err.response?.data || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="product-form-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="product-form-container">
      {/* Tiêu đề & Nút thao tác */}
      <div className="form-header">
        <div className="form-header-title">
          <button 
            type="button" 
            className="btn-back" 
            onClick={() => navigate('/products')}
            title="Quay lại danh sách"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2>{isEditMode ? 'Chỉnh Sửa Thông Tin Hàng Hóa' : 'Thêm Mới Hàng Hóa Vào Kho'}</h2>
            <p>Quản lý danh mục Master SKU trong hệ thống WMS</p>
          </div>
        </div>

        <div className="form-header-actions">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={() => navigate('/products')}
          >
            Hủy Bỏ
          </button>
          <button 
            type="button" 
            className="btn-submit" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            <FiSave size={16} /> {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Cập Nhật' : 'Lưu Hàng Hóa')}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Phần 1: Thông tin cơ bản */}
        <div className="form-card">
          <div className="form-card-title">
            <FiBox size={18} />
            <span>Thông Tin Cơ Bản Sản Phẩm</span>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Mã Hàng Hóa (SKU) <span className="required">*</span></label>
              <input 
                type="text" 
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="VD: SP001"
                required
              />
            </div>

            <div className="form-group">
              <label>Danh Mục Phân Loại <span className="required">*</span></label>
              <select 
                name="danhMucId"
                value={formData.danhMucId}
                onChange={handleChange}
                required
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.tenDanhMuc}</option>
                ))}
                {categories.length === 0 && (
                  <>
                    <option value={1}>Điện thoại & Tablet</option>
                    <option value={2}>Laptop & Máy tính</option>
                    <option value={3}>Phụ kiện công nghệ</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Đơn Vị Tính <span className="required">*</span></label>
              <select 
                name="donViTinh"
                value={formData.donViTinh}
                onChange={handleChange}
              >
                <option value="Cái">Cái</option>
                <option value="Chiếc">Chiếc</option>
                <option value="Hộp">Hộp</option>
                <option value="Thùng">Thùng</option>
                <option value="Bộ">Bộ</option>
                <option value="Kg">Kg</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label>Tên Sản Phẩm / Tên Hàng Hóa <span className="required">*</span></label>
            <input 
              type="text" 
              name="tenSanPham"
              value={formData.tenSanPham}
              onChange={handleChange}
              placeholder="VD: iPhone 15 Pro Max 256GB - Titan Tự Nhiên"
              required
            />
          </div>
        </div>

        {/* Phần 2: Giá & Thuộc tính vật lý */}
        <div className="form-card">
          <div className="form-card-title">
            <FiDollarSign size={18} />
            <span>Giá Cả & Thuộc Tính Vận Chuyển</span>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Giá Bán Niêm Yết (VNĐ)</label>
              <input 
                type="number" 
                name="giaBan"
                value={formData.giaBan}
                onChange={handleChange}
                placeholder="VD: 29990000"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Giá Nhập Dự Kiến (VNĐ)</label>
              <input 
                type="number" 
                name="giaNhap"
                value={formData.giaNhap}
                onChange={handleChange}
                placeholder="VD: 24500000"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Khối Lượng Đóng Gói (gram)</label>
              <input 
                type="number" 
                name="khoiLuong"
                value={formData.khoiLuong}
                onChange={handleChange}
                placeholder="VD: 500"
                min="0"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label>Trạng Thái Kinh Doanh</label>
            <select 
              name="trangThai"
              value={formData.trangThai}
              onChange={handleChange}
            >
              <option value="DANG_KINH_DOANH">Đang kinh doanh / Sẵn sàng nhập xuất</option>
              <option value="NGUNG_KINH_DOANH">Ngưng kinh doanh</option>
              <option value="HET_HANG">Hết hàng tạm thời</option>
            </select>
          </div>
        </div>

        {/* Phần 3: Hình ảnh & Mô tả */}
        <div className="form-card">
          <div className="form-card-title">
            <FiFileText size={18} />
            <span>Hình Ảnh & Mô Tả Chi Tiết</span>
          </div>

          <div className="form-group">
            <label>Đường Dẫn Hình Ảnh Sản Phẩm (URL)</label>
            <input 
              type="url" 
              name="hinhAnh"
              value={formData.hinhAnh}
              onChange={handleChange}
              placeholder="https://example.com/images/iphone-15.png"
            />
          </div>

          <div className="form-group">
            <label>Mô Tả Quy Cách & Đặc Tính Sản Phẩm</label>
            <textarea 
              name="moTa"
              value={formData.moTa}
              onChange={handleChange}
              rows="4"
              placeholder="Nhập thông số kỹ thuật, quy cách đóng gói, xuất xứ và điều kiện bảo quản tại kho..."
            />
          </div>
        </div>

        {/* Nút lưu cuối trang */}
        <div className="form-footer">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={() => navigate('/products')}
          >
            Hủy Bỏ
          </button>
          <button 
            type="submit" 
            className="btn-submit" 
            disabled={isSubmitting}
          >
            <FiCheckCircle size={16} /> {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Cập Nhật Hàng Hóa' : 'Xác Nhận Thêm Mới')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
