import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiTruck, FiPhoneCall, 
  FiGlobe, FiMapPin, FiFileText, FiCheckCircle 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ShippingForm.css';

const ShippingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    maDonVi: '',
    tenDonVi: '',
    thongTinLienHe: '',
    email: '',
    website: '',
    diaChi: '',
    trangThai: 'HOAT_DONG',
    ghiChu: '',
  });

  useEffect(() => {
    if (isEditMode) {
      loadShipperDetails(id);
    } else {
      setFormData(prev => ({
        ...prev,
        maDonVi: 'DV-' + Math.floor(100 + Math.random() * 900),
      }));
    }
  }, [id, isEditMode]);

  const loadShipperDetails = async (shipperId) => {
    try {
      setIsLoading(true);
      const data = await wmsCoreService.getShipperById(shipperId);
      if (data) {
        setFormData({
          maDonVi: data.maDonVi || data.maDV || `DV-00${data.id}`,
          tenDonVi: data.tenDonVi || data.tenDV || '',
          thongTinLienHe: data.thongTinLienHe || data.hotline || '',
          email: data.email || '',
          website: data.website || '',
          diaChi: data.diaChi || '',
          trangThai: data.trangThai || 'HOAT_DONG',
          ghiChu: data.ghiChu || '',
        });
      }
    } catch (e) {
      console.warn('Lỗi nạp chi tiết đơn vị vận chuyển:', e.message);
      // Fallback mock
      setFormData(prev => ({
        ...prev,
        tenDonVi: 'Đơn vị vận chuyển #' + shipperId,
        thongTinLienHe: 'Hotline: 1900 1234',
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
    if (!formData.tenDonVi.trim()) {
      alert('Vui lòng nhập tên đơn vị vận chuyển!');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode) {
        await wmsCoreService.updateShipper(id, formData);
        alert('Cập nhật đơn vị vận chuyển thành công!');
      } else {
        await wmsCoreService.createShipper(formData);
        alert('Thêm mới đối tác vận chuyển thành công!');
      }
      navigate('/shipping');
    } catch (err) {
      alert('Không thể lưu thông tin: ' + (err.response?.data || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="shipping-form-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Đang tải thông tin đối tác vận chuyển...</p>
      </div>
    );
  }

  return (
    <div className="shipping-form-container">
      {/* Tiêu đề & Breadcrumb */}
      <div className="form-header">
        <div className="form-header-title">
          <button 
            type="button" 
            className="btn-back" 
            onClick={() => navigate('/shipping')}
            title="Quay lại danh sách"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2>{isEditMode ? 'Chỉnh Sửa Đơn Vị Vận Chuyển' : 'Thêm Mới Đơn Vị Vận Chuyển'}</h2>
            <p>Tích hợp đối tác giao vận và điều phối bưu tá</p>
          </div>
        </div>

        <div className="form-header-actions">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={() => navigate('/shipping')}
          >
            Hủy Bỏ
          </button>
          <button 
            type="button" 
            className="btn-submit" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            <FiSave size={16} /> {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Cập Nhật' : 'Lưu Đối Tác')}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Phần 1: Thông tin pháp nhân */}
        <div className="form-card">
          <div className="form-card-title">
            <FiTruck size={18} />
            <span>Thông Tin Đơn Vị Giao Nhận</span>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Mã Đơn Vị <span className="required">*</span></label>
              <input 
                type="text" 
                name="maDonVi"
                value={formData.maDonVi}
                onChange={handleChange}
                placeholder="VD: DV-GHTK"
                required
              />
            </div>

            <div className="form-group">
              <label>Tên Đơn Vị Vận Chuyển <span className="required">*</span></label>
              <input 
                type="text" 
                name="tenDonVi"
                value={formData.tenDonVi}
                onChange={handleChange}
                placeholder="VD: Giao Hàng Tiết Kiệm (GHTK)"
                required
              />
            </div>

            <div className="form-group">
              <label>Trạng Thái Hợp Tác</label>
              <select 
                name="trangThai"
                value={formData.trangThai}
                onChange={handleChange}
              >
                <option value="HOAT_DONG">Đang Hợp Tác / Sẵn Sàng Giao</option>
                <option value="TAM_NGUNG">Tạm Ngưng Điều Phối</option>
                <option value="NGUNG_HOP_TAC">Ngưng Hợp Tác</option>
              </select>
            </div>
          </div>
        </div>

        {/* Phần 2: Kênh liên lạc & Tra cứu */}
        <div className="form-card">
          <div className="form-card-title">
            <FiPhoneCall size={18} />
            <span>Kênh Tra Cứu Vận Đơn & Hỗ Trợ</span>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Hotline / SĐT Điều Phối <span className="required">*</span></label>
              <input 
                type="text" 
                name="thongTinLienHe"
                value={formData.thongTinLienHe}
                onChange={handleChange}
                placeholder="VD: 1900 6092"
                required
              />
            </div>

            <div className="form-group">
              <label>Email Hỗ Trợ CSKH / Bưu Cục</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="VD: support@ghtk.vn"
              />
            </div>

            <div className="form-group">
              <label>Website / Cổng API Tra Cứu</label>
              <input 
                type="url" 
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://i.ghtk.vn"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label>Địa Chỉ Bưu Cục Tiếp Nhận Hàng Hoặc Kho Trung Chuyển</label>
            <input 
              type="text" 
              name="diaChi"
              value={formData.diaChi}
              onChange={handleChange}
              placeholder="VD: Hub Miền Nam, Khu công nghiệp Tân Bình, TP.HCM"
            />
          </div>
        </div>

        {/* Phần 3: Ghi chú vận hành */}
        <div className="form-card">
          <div className="form-card-title">
            <FiFileText size={18} />
            <span>Chính Sách Giao Nhận & Ghi Chú</span>
          </div>

          <div className="form-group">
            <label>Ghi Chú Vận Hành Kho (Thời gian lấy hàng, chính sách bồi thường...)</label>
            <textarea 
              name="ghiChu"
              value={formData.ghiChu}
              onChange={handleChange}
              rows="4"
              placeholder="VD: Bưu tá gom hàng cố định vào 10:00 sáng và 16:30 chiều hàng ngày. Hỗ trợ giao hỏa tốc nội thành 2h..."
            />
          </div>
        </div>

        {/* Nút lưu cuối trang */}
        <div className="form-footer">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={() => navigate('/shipping')}
          >
            Hủy Bỏ
          </button>
          <button 
            type="submit" 
            className="btn-submit" 
            disabled={isSubmitting}
          >
            <FiCheckCircle size={16} /> {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Cập Nhật Đối Tác' : 'Xác Nhận Thêm ĐVVC')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShippingForm;
