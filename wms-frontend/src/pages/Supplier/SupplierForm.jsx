import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiBriefcase, FiUser, 
  FiMapPin, FiFileText, FiCheckCircle 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './SupplierForm.css';

const SupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    maNhaCungCap: '',
    tenNhaCungCap: '',
    maSoThue: '',
    trangThai: 'HOAT_DONG',
    nguoiLienHe: '',
    chucVuNguoiLienHe: '',
    soDienThoai: '',
    email: '',
    diaChi: '',
    ghiChu: '',
  });

  useEffect(() => {
    if (isEditMode) {
      loadSupplierDetails(id);
    } else {
      // Tự động sinh mã NCC gợi ý khi thêm mới
      setFormData(prev => ({
        ...prev,
        maNhaCungCap: 'NCC-' + Math.floor(100 + Math.random() * 900),
      }));
    }
  }, [id, isEditMode]);

  const loadSupplierDetails = async (supplierId) => {
    try {
      setIsLoading(true);
      const data = await wmsCoreService.getSupplierById(supplierId);
      if (data) {
        setFormData({
          maNhaCungCap: data.maNhaCungCap || data.maNCC || `NCC-00${data.id}`,
          tenNhaCungCap: data.tenNhaCungCap || data.tenNCC || '',
          maSoThue: data.maSoThue || '',
          trangThai: data.trangThai || 'HOAT_DONG',
          nguoiLienHe: data.nguoiLienHe || '',
          chucVuNguoiLienHe: data.chucVuNguoiLienHe || '',
          soDienThoai: data.soDienThoai || data.sdt || '',
          email: data.email || '',
          diaChi: data.diaChi || '',
          ghiChu: data.ghiChu || '',
        });
      }
    } catch (e) {
      console.warn('Không thể nạp chi tiết từ backend, kiểm tra mock:', e.message);
      // Dữ liệu mô phỏng fallback khi chưa kết nối backend
      setFormData(prev => ({
        ...prev,
        tenNhaCungCap: 'Công ty Cổ phần Nhà Cung Cấp #' + supplierId,
        soDienThoai: '0901234567',
        email: `contact@ncc${supplierId}.com`,
        diaChi: 'Hà Nội / TP.HCM',
      }));
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
    if (!formData.tenNhaCungCap.trim()) {
      alert('Vui lòng nhập Tên Nhà Cung Cấp!');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode) {
        await wmsCoreService.updateSupplier(id, formData);
        alert('Cập nhật thông tin Nhà Cung Cấp thành công!');
      } else {
        await wmsCoreService.createSupplier(formData);
        alert('Thêm mới Nhà Cung Cấp thành công!');
      }
      navigate('/suppliers');
    } catch (err) {
      alert('Lỗi khi lưu dữ liệu: ' + (err.response?.data || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="supplier-form-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Đang tải dữ liệu nhà cung cấp...</p>
      </div>
    );
  }

  return (
    <div className="supplier-form-container">
      {/* Tiêu đề & Breadcrumb */}
      <div className="form-header">
        <div className="form-header-title">
          <button 
            type="button" 
            className="btn-back" 
            onClick={() => navigate('/suppliers')}
            title="Quay lại danh sách"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2>{isEditMode ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Mới Nhà Cung Cấp'}</h2>
            <p>Phân hệ đối tác chuỗi cung ứng WMS Core</p>
          </div>
        </div>

        <div className="form-header-actions">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={() => navigate('/suppliers')}
          >
            Hủy Bỏ
          </button>
          <button 
            type="button" 
            className="btn-submit" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            <FiSave size={16} /> {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Cập Nhật' : 'Lưu Nhà Cung Cấp')}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Phần 1: Định danh doanh nghiệp */}
        <div className="form-card">
          <div className="form-card-title">
            <FiBriefcase size={18} />
            <span>Thông Tin Pháp Nhân & Định Danh</span>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Mã Nhà Cung Cấp <span className="required">*</span></label>
              <input 
                type="text" 
                name="maNhaCungCap"
                value={formData.maNhaCungCap}
                onChange={handleChange}
                placeholder="VD: NCC-001"
                required
              />
              <span className="form-help-text">Mã định danh duy nhất trên hệ thống</span>
            </div>

            <div className="form-group">
              <label>Mã Số Thuế (MST)</label>
              <input 
                type="text" 
                name="maSoThue"
                value={formData.maSoThue}
                onChange={handleChange}
                placeholder="VD: 0312345678"
              />
            </div>

            <div className="form-group">
              <label>Trạng Thái Hợp Tác</label>
              <select 
                name="trangThai"
                value={formData.trangThai}
                onChange={handleChange}
              >
                <option value="HOAT_DONG">Đang Hợp Tác / Hoạt Động</option>
                <option value="TAM_NGUNG">Tạm Ngưng Hợp Tác</option>
                <option value="NGUNG_CUNG_CAP">Ngưng Cung Cấp</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label>Tên Doanh Nghiệp / Tên Nhà Cung Cấp <span className="required">*</span></label>
            <input 
              type="text" 
              name="tenNhaCungCap"
              value={formData.tenNhaCungCap}
              onChange={handleChange}
              placeholder="VD: Công ty TNHH Logitech Việt Nam"
              required
            />
          </div>
        </div>

        {/* Phần 2: Người đại diện & Liên hệ */}
        <div className="form-card">
          <div className="form-card-title">
            <FiUser size={18} />
            <span>Đại Diện Kinh Doanh & Liên Lạc</span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Họ Tên Người Đại Diện</label>
              <input 
                type="text" 
                name="nguoiLienHe"
                value={formData.nguoiLienHe}
                onChange={handleChange}
                placeholder="VD: Nguyễn Văn Đại Diện"
              />
            </div>

            <div className="form-group">
              <label>Chức Vụ / Phòng Ban</label>
              <input 
                type="text" 
                name="chucVuNguoiLienHe"
                value={formData.chucVuNguoiLienHe}
                onChange={handleChange}
                placeholder="VD: Giám đốc kinh doanh / Quản lý kênh phân phối"
              />
            </div>
          </div>

          <div className="form-grid-2" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <label>Số Điện Thoại / Hotline Giao Dịch <span className="required">*</span></label>
              <input 
                type="tel" 
                name="soDienThoai"
                value={formData.soDienThoai}
                onChange={handleChange}
                placeholder="VD: 0901234567 hoặc 1900 1234"
                required
              />
            </div>

            <div className="form-group">
              <label>Email Nhận Báo Giá & Đơn Đặt Hàng</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="VD: b2b@logitech.vn"
              />
            </div>
          </div>
        </div>

        {/* Phần 3: Địa chỉ & Kho bãi */}
        <div className="form-card">
          <div className="form-card-title">
            <FiMapPin size={18} />
            <span>Địa Chỉ Trụ Sở & Kho Xuất Hàng</span>
          </div>

          <div className="form-group">
            <label>Địa Chỉ Chi Tiết (Số nhà, Đường, Quận/Huyện, Tỉnh/TP) <span className="required">*</span></label>
            <input 
              type="text" 
              name="diaChi"
              value={formData.diaChi}
              onChange={handleChange}
              placeholder="VD: Tầng 12, Tòa nhà Bitexco, Số 2 Hải Triều, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh"
              required
            />
          </div>
        </div>

        {/* Phần 4: Điều khoản hợp tác & Ghi chú */}
        <div className="form-card">
          <div className="form-card-title">
            <FiFileText size={18} />
            <span>Chính Sách Thanh Toán & Ghi Chú Hợp Tác</span>
          </div>

          <div className="form-group">
            <label>Ghi Chú Hợp Đồng / Điều Khoản Thanh Toán</label>
            <textarea 
              name="ghiChu"
              value={formData.ghiChu}
              onChange={handleChange}
              rows="4"
              placeholder="VD: Hạn thanh toán công nợ 30 ngày kể từ khi xuất phiếu nhập kho. Chiết khấu 5% cho đơn hàng trên 500 triệu..."
            />
          </div>
        </div>

        {/* Nút lưu cuối trang */}
        <div className="form-footer">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={() => navigate('/suppliers')}
          >
            Hủy Bỏ
          </button>
          <button 
            type="submit" 
            className="btn-submit" 
            disabled={isSubmitting}
          >
            <FiCheckCircle size={16} /> {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Cập Nhật Thay Đổi' : 'Xác Nhận Thêm Nhà Cung Cấp')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
