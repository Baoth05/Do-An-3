import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlusCircle, FiBriefcase, FiPhone, FiBox, FiTrash2, FiPlus, FiInfo } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './SupplierCreate.css';

const SupplierCreate = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. State thông tin Nhà Cung Cấp
  const [formData, setFormData] = useState({
    maNhaCungCap: '',
    tenNhaCungCap: '',
    nguoiLienHe: '',
    chucVuNguoiLienHe: '',
    soDienThoai: '',
    email: '',
    diaChi: '',
    maSoThue: '',
    ghiChu: '',
    trangThai: 'HOAT_DONG',
  });

  // 2. State danh sách Sản Phẩm (Đảm bảo donViTinh luôn khởi tạo là 'Cái')
 const [products, setProducts] = useState([
    { sku: '', tenSanPham: '', giaNhap: '', giaBan: '', donViTinh: 'CAI' }
  ]);

  // Tự động tạo mã nhà cung cấp ngẫu nhiên khi mở trang
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      maNhaCungCap: 'NCC-' + Math.floor(100 + Math.random() * 900),
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Hàm thêm dòng sản phẩm mới (Mặc định đơn vị tính là 'Cái')
  const handleAddProduct = () => {
    // 2. Đổi giá trị khi bấm thêm dòng mới thành 'CAI'
    setProducts([...products, { sku: '', tenSanPham: '', giaNhap: '', giaBan: '', donViTinh: 'CAI' }]);
  };

  // Hàm xóa một dòng sản phẩm
  const handleRemoveProduct = (index) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
  };

  // Hàm cập nhật giá trị khi người dùng nhập hoặc chọn dropdown
  const handleProductChange = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Kiểm tra thông tin bắt buộc của Nhà Cung Cấp
    if (!formData.maNhaCungCap.trim() || !formData.tenNhaCungCap.trim()) {
      alert('Vui lòng điền đầy đủ Mã và Tên nhà cung cấp!');
      return;
    }

    // Lọc và chuẩn hóa dữ liệu sản phẩm trước khi gửi
    const validProducts = products
      .filter(p => p.sku.trim() !== '' || p.tenSanPham.trim() !== '')
      .map(p => ({
        sku: p.sku.trim(),
        tenSanPham: p.tenSanPham.trim(),
        donViTinh: p.donViTinh && p.donViTinh.trim() !== '' ? p.donViTinh.trim() : 'CAI',
        giaNhap: p.giaNhap !== '' ? Number(p.giaNhap) : null,
        giaBan: p.giaBan !== '' ? Number(p.giaBan) : null
      }));

    // Đóng gói payload khớp cấu trúc Entity Supplier.java
    const payload = {
      maNhaCungCap: formData.maNhaCungCap.trim(),
      tenNhaCungCap: formData.tenNhaCungCap.trim(),
      nguoiLienHe: formData.nguoiLienHe?.trim() || null,
      chucVuNguoiLienHe: formData.chucVuNguoiLienHe?.trim() || null,
      soDienThoai: formData.soDienThoai?.trim() || null,
      email: formData.email?.trim() || null,
      diaChi: formData.diaChi?.trim() || null,
      maSoThue: formData.maSoThue?.trim() || null,
      ghiChu: formData.ghiChu?.trim() || null,
      trangThai: formData.trangThai || 'HOAT_DONG',
      danhSachSanPham: validProducts 
    };

    try {
      setIsSubmitting(true);
      await wmsCoreService.createSupplier(payload);
      alert('Lưu thông tin nhà cung cấp và danh sách sản phẩm thành công!');
      navigate('/suppliers');
    } catch (err) {
      console.error('Lỗi API Detail:', err.response?.data);
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Lỗi lưu thông tin';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="supplier-create-container">
      <div className="sc-header">
        <button type="button" className="sc-btn-back" onClick={() => navigate('/suppliers')}>
          <FiArrowLeft size={18} /> Quay lại
        </button>
        <div className="sc-header-title">
          <h2>Thêm Nhà Cung Cấp Mới</h2>
          <p>Điền thông tin chi tiết và danh sách sản phẩm cung cấp</p>
        </div>
      </div>

      {errorMsg && <div className="sc-alert-error">{errorMsg}</div>}

      <form onSubmit={handleSubmit} className="sc-form-layout">
        {/* Khối Hồ sơ doanh nghiệp */}
        <div className="sc-card">
          <div className="sc-card-header">
            <FiBriefcase className="sc-icon" /> 
            <h3>Hồ Sơ Doanh Nghiệp</h3>
          </div>
          <div className="sc-card-body">
            <div className="sc-form-row">
              <div className="sc-form-group">
                <label>Mã Nhà Cung Cấp <span className="sc-required">*</span></label>
                <input type="text" name="maNhaCungCap" value={formData.maNhaCungCap} onChange={handleChange} required />
              </div>
              <div className="sc-form-group">
                <label>Mã Số Thuế</label>
                <input type="text" name="maSoThue" value={formData.maSoThue} onChange={handleChange} placeholder="VD: 0312345678" />
              </div>
            </div>
            <div className="sc-form-group">
              <label>Tên Doanh Nghiệp / Công Ty <span className="sc-required">*</span></label>
              <input type="text" name="tenNhaCungCap" value={formData.tenNhaCungCap} onChange={handleChange} required placeholder="VD: Công ty TNHH Asus Việt Nam" />
            </div>
            <div className="sc-form-group">
              <label>Địa Chỉ Trụ Sở</label>
              <textarea name="diaChi" value={formData.diaChi} onChange={handleChange} rows="2" placeholder="Nhập địa chỉ..." />
            </div>
          </div>
        </div>

        {/* Khối Thông tin liên lạc */}
        <div className="sc-card">
          <div className="sc-card-header">
            <FiPhone className="sc-icon" /> 
            <h3>Thông Tin Liên Lạc</h3>
          </div>
          <div className="sc-card-body">
            <div className="sc-form-row">
              <div className="sc-form-group">
                <label>Người Đại Diện</label>
                <input type="text" name="nguoiLienHe" value={formData.nguoiLienHe} onChange={handleChange} placeholder="VD: Nguyễn Văn A" />
              </div>
              <div className="sc-form-group">
                <label>Chức Vụ</label>
                <input type="text" name="chucVuNguoiLienHe" value={formData.chucVuNguoiLienHe} onChange={handleChange} placeholder="VD: Quản lý kinh doanh" />
              </div>
            </div>
            <div className="sc-form-row">
              <div className="sc-form-group">
                <label>Số Điện Thoại</label>
                <input type="text" name="soDienThoai" value={formData.soDienThoai} onChange={handleChange} placeholder="VD: 0901234567" />
              </div>
              <div className="sc-form-group">
                <label>Email Hợp Tác</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="VD: contact@asus.com" />
              </div>
            </div>
          </div>
        </div>

        {/* Khối Ghi chú & Trạng thái */}
        <div className="sc-card sc-full-width">
          <div className="sc-card-header">
            <FiInfo className="sc-icon" /> 
            <h3>Trạng Thái & Ghi Chú</h3>
          </div>
          <div className="sc-card-body">
            <div className="sc-form-group">
              <label>Ghi Chú</label>
              <textarea name="ghiChu" value={formData.ghiChu} onChange={handleChange} rows="2" placeholder="Ghi chú bổ sung..." />
            </div>
            <div className="sc-form-group" style={{ maxWidth: '300px' }}>
              <label>Trạng Thái Hợp Tác</label>
              <select name="trangThai" value={formData.trangThai} onChange={handleChange} className="sc-select">
                <option value="HOAT_DONG">Đang hợp tác</option>
                <option value="TAM_DUNG">Tạm dừng giao dịch</option>
              </select>
            </div>
          </div>
        </div>

        {/* Khối Bảng Danh Sách Sản Phẩm */}
        <div className="sc-card sc-full-width">
          <div className="sc-card-header sc-flex-between">
            <div className="sc-header-left">
              <FiBox className="sc-icon" /> 
              <h3>Danh Sách Sản Phẩm Cung Cấp</h3>
            </div>
            <button type="button" className="sc-btn-add-line" onClick={handleAddProduct}>
              <FiPlus size={16} /> Thêm Sản Phẩm
            </button>
          </div>
          <div className="sc-card-body sc-no-padding">
            <div className="sc-table-responsive">
              <table className="sc-product-table">
                <thead>
                  <tr>
                    <th>Mã SP (SKU)</th>
                    <th>Tên Sản Phẩm</th>
                    <th>Đơn Vị Tính</th>
                    <th>Giá Nhập</th>
                    <th>Giá Bán</th>
                    <th className="text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={index}>
                      <td>
                        <input 
                          type="text" 
                          placeholder="Mã SKU..." 
                          value={product.sku} 
                          onChange={(e) => handleProductChange(index, 'sku', e.target.value)} 
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          placeholder="Tên sản phẩm..." 
                          value={product.tenSanPham} 
                          onChange={(e) => handleProductChange(index, 'tenSanPham', e.target.value)} 
                        />
                      </td>
                      <td>
                        <select 
                          value={product.donViTinh} 
                          onChange={(e) => handleProductChange(index, 'donViTinh', e.target.value)}
                        >
                          {/* value là giá trị gửi xuống Database, phần chữ trắng là phần hiển thị trên web */}
                          <option value="CAI">Cái</option>
                          <option value="CHIEC">Chiếc</option>
                          <option value="HOP">Hộp</option>
                          <option value="THUNG">Thùng</option>
                          <option value="BO">Bộ</option>
                          <option value="KG">Kg</option>
                        </select>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={product.giaNhap} 
                          onChange={(e) => handleProductChange(index, 'giaNhap', e.target.value)} 
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={product.giaBan} 
                          onChange={(e) => handleProductChange(index, 'giaBan', e.target.value)} 
                        />
                      </td>
                      <td className="text-center">
                        <button 
                          type="button" 
                          className="sc-btn-delete" 
                          onClick={() => handleRemoveProduct(index)} 
                          disabled={products.length === 1}
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="sc-form-actions-main">
              <button type="submit" className="sc-btn-submit sc-btn-large" disabled={isSubmitting}>
                <FiPlusCircle size={20} /> {isSubmitting ? 'Đang lưu dữ liệu...' : 'Lưu Nhà Cung Cấp & Sản Phẩm'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SupplierCreate;