import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiBriefcase, FiPhone, FiRefreshCw, FiBox, FiTrash2, FiPlus, FiInfo } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './SupplierEdit.css';

const SupplierEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cập nhật State cho khớp với Supplier.java
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

  const [products, setProducts] = useState([
    { sku: '', tenSanPham: '', giaNhap: '', giaBan: '', donViTinh: '' }
  ]);

  useEffect(() => {
    fetchSupplierDetail();
  }, [id]);

  const fetchSupplierDetail = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      let supplier = null;

      try {
        const res = await wmsCoreService.getSupplierById(id);
        supplier = res.data || res;
      } catch (apiError) {
        console.warn('Fallback tìm từ danh sách tổng...', apiError.message);
        const allSuppliersRes = await wmsCoreService.getSuppliers();
        const allSuppliers = Array.isArray(allSuppliersRes) ? allSuppliersRes : (allSuppliersRes?.data || []);
        supplier = allSuppliers.find(s => String(s.id) === String(id));
        if (!supplier) throw new Error('Không tìm thấy nhà cung cấp này trong hệ thống.');
      }
      
      if (supplier) {
        setFormData({
          maNhaCungCap: supplier.maNhaCungCap || '',
          tenNhaCungCap: supplier.tenNhaCungCap || '',
          nguoiLienHe: supplier.nguoiLienHe || '',
          chucVuNguoiLienHe: supplier.chucVuNguoiLienHe || '',
          soDienThoai: supplier.soDienThoai || '',
          email: supplier.email || '',
          diaChi: supplier.diaChi || '',
          maSoThue: supplier.maSoThue || '',
          ghiChu: supplier.ghiChu || '',
          trangThai: supplier.trangThai || 'HOAT_DONG',
        });

        const embeddedProducts = supplier.danhSachSanPham || supplier.sanPhamCungCap || supplier.products;
        if (Array.isArray(embeddedProducts) && embeddedProducts.length > 0) {
          const mappedProducts = embeddedProducts.map(p => ({
            sku: p.sku || p.maSanPham || '',
            tenSanPham: p.tenSanPham || '',
            donViTinh: p.donViTinh || '',
            giaNhap: p.giaNhap || '',
            giaBan: p.giaBan || ''
          }));
          setProducts(mappedProducts);
        }
      }
    } catch (e) {
      console.error('Lỗi nạp dữ liệu nhà cung cấp:', e.message);
      setErrorMsg('Không thể nạp thông tin nhà cung cấp! Vui lòng kiểm tra lại dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = () => setProducts([...products, { sku: '', tenSanPham: '', giaNhap: '', giaBan: '', donViTinh: '' }]);
  const handleRemoveProduct = (index) => setProducts(products.filter((_, i) => i !== index));
  const handleProductChange = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.maNhaCungCap.trim() || !formData.tenNhaCungCap.trim()) {
      alert('Vui lòng điền đầy đủ Mã và Tên nhà cung cấp!');
      return;
    }

    // 1. Lọc và chuẩn hóa dữ liệu sản phẩm
    const validProducts = products
      .filter(p => p.sku.trim() !== '' || p.tenSanPham.trim() !== '')
      .map(p => ({
        sku: p.sku.trim(),
        tenSanPham: p.tenSanPham.trim(),
        // Nếu người dùng không nhập donViTinh, tự động gán là "Cái"
        donViTinh: p.donViTinh && p.donViTinh.trim() !== '' ? p.donViTinh.trim() : 'Cái', 
        giaNhap: p.giaNhap !== '' ? Number(p.giaNhap) : null,
        giaBan: p.giaBan !== '' ? Number(p.giaBan) : null
      }));

    // 2. Đóng gói Payload theo đúng định dạng Supplier.java
    const payload = {
      maNhaCungCap: formData.maNhaCungCap.trim(),
      tenNhaCungCap: formData.tenNhaCungCap.trim(),
      nguoiLienHe: formData.nguoiLienHe.trim() || null,
      chucVuNguoiLienHe: formData.chucVuNguoiLienHe.trim() || null,
      soDienThoai: formData.soDienThoai.trim() || null,
      email: formData.email.trim() || null,
      diaChi: formData.diaChi.trim() || null,
      maSoThue: formData.maSoThue.trim() || null,
      ghiChu: formData.ghiChu.trim() || null,
      trangThai: formData.trangThai || 'HOAT_DONG',
      danhSachSanPham: validProducts // Gắn mảng đã được chuẩn hóa vào
    };

    try {
      setIsSubmitting(true);
      awaitwmsCoreService.updateSupplier(id, payload); // Đối với Edit thì gọi updateSupplier(id, payload)
      alert('Lưu thông tin nhà cung cấp thành công!');
      navigate('/suppliers');
    } catch (err) {
      console.error('Lỗi API 400 Detail:', err.response?.data);
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Lỗi lưu thông tin';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="supplier-edit-container">
      <div className="se-header">
        <button type="button" className="se-btn-back" onClick={() => navigate('/suppliers')}>
          <FiArrowLeft size={18} /> Quay lại
        </button>
        <div className="se-header-title">
          <h2>Chỉnh Sửa Thông Tin Nhà Cung Cấp</h2>
          <p>Cập nhật lại hồ sơ đối tác và danh sách sản phẩm cung cấp</p>
        </div>
      </div>

      {errorMsg && <div className="se-alert-error">{errorMsg}</div>}

      {isLoading ? (
        <div className="se-loading-state">
          <FiRefreshCw className="spin-icon" size={32} />
          <p>Đang nạp dữ liệu nhà cung cấp...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="se-form-layout">
          <div className="se-card">
            <div className="se-card-header">
              <FiBriefcase className="se-icon" /> 
              <h3>Hồ Sơ Doanh Nghiệp</h3>
            </div>
            <div className="se-card-body">
              <div className="se-form-row">
                  <div className="se-form-group">
                    <label>Mã Nhà Cung Cấp <span className="se-required">*</span></label>
                    <input type="text" name="maNhaCungCap" value={formData.maNhaCungCap} onChange={handleChange} required />
                  </div>
                  <div className="se-form-group">
                    <label>Mã Số Thuế</label>
                    <input type="text" name="maSoThue" value={formData.maSoThue} onChange={handleChange} />
                  </div>
              </div>
              <div className="se-form-group">
                <label>Tên Doanh Nghiệp / Công Ty <span className="se-required">*</span></label>
                <input type="text" name="tenNhaCungCap" value={formData.tenNhaCungCap} onChange={handleChange} required />
              </div>
              <div className="se-form-group">
                <label>Địa Chỉ Trụ Sở</label>
                <textarea name="diaChi" value={formData.diaChi} onChange={handleChange} rows="2" />
              </div>
            </div>
          </div>

          <div className="se-card">
            <div className="se-card-header">
              <FiPhone className="se-icon" /> 
              <h3>Thông Tin Liên Lạc</h3>
            </div>
            <div className="se-card-body">
              <div className="se-form-row">
                  <div className="se-form-group">
                    <label>Người Đại Diện</label>
                    <input type="text" name="nguoiLienHe" value={formData.nguoiLienHe} onChange={handleChange} />
                  </div>
                  <div className="se-form-group">
                    <label>Chức Vụ</label>
                    <input type="text" name="chucVuNguoiLienHe" value={formData.chucVuNguoiLienHe} onChange={handleChange} />
                  </div>
              </div>
              <div className="se-form-row">
                <div className="se-form-group">
                  <label>Số Điện Thoại</label>
                  <input type="text" name="soDienThoai" value={formData.soDienThoai} onChange={handleChange} />
                </div>
                <div className="se-form-group">
                  <label>Email Hợp Tác</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          <div className="se-card se-full-width">
            <div className="se-card-header">
              <FiInfo className="se-icon" /> 
              <h3>Trạng Thái & Ghi Chú</h3>
            </div>
            <div className="se-card-body">
               <div className="se-form-group">
                <label>Ghi Chú</label>
                <textarea name="ghiChu" value={formData.ghiChu} onChange={handleChange} rows="2" />
              </div>
              <div className="se-form-group" style={{maxWidth: '300px'}}>
                <label>Trạng Thái Hợp Tác</label>
                <select name="trangThai" value={formData.trangThai} onChange={handleChange} className="se-select">
                  <option value="HOAT_DONG">Đang hợp tác</option>
                  <option value="TAM_DUNG">Tạm dừng giao dịch</option>
                </select>
              </div>
            </div>
          </div>

          <div className="se-card se-full-width">
            <div className="se-card-header se-flex-between">
              <div className="se-header-left">
                <FiBox className="se-icon" /> 
                <h3>Danh Sách Sản Phẩm Cung Cấp</h3>
              </div>
              <button type="button" className="se-btn-add-line" onClick={handleAddProduct}>
                <FiPlus size={16} /> Thêm Sản Phẩm
              </button>
            </div>
            <div className="se-card-body se-no-padding">
              <div className="se-table-responsive">
                <table className="se-product-table">
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
                        <td><input type="text" placeholder="Mã SKU..." value={product.sku} onChange={(e) => handleProductChange(index, 'sku', e.target.value)} /></td>
                        <td><input type="text" placeholder="Tên sản phẩm..." value={product.tenSanPham} onChange={(e) => handleProductChange(index, 'tenSanPham', e.target.value)} /></td>
                        <td><input type="text" placeholder="ĐVT..." value={product.donViTinh} onChange={(e) => handleProductChange(index, 'donViTinh', e.target.value)} /></td>
                        <td><input type="number" placeholder="0" value={product.giaNhap} onChange={(e) => handleProductChange(index, 'giaNhap', e.target.value)} /></td>
                        <td><input type="number" placeholder="0" value={product.giaBan} onChange={(e) => handleProductChange(index, 'giaBan', e.target.value)} /></td>
                        <td className="text-center">
                          <button type="button" className="se-btn-delete" onClick={() => handleRemoveProduct(index)} disabled={products.length === 1}><FiTrash2 size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="se-form-actions-main">
                <button type="submit" className="se-btn-submit se-btn-large" disabled={isSubmitting}>
                  <FiSave size={20} /> {isSubmitting ? 'Đang cập nhật...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default SupplierEdit;