import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiPlus, FiTrash2, 
  FiFileText, FiTruck, FiMapPin, FiCheckCircle 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ImportNoteForm.css';

const ImportNoteCreate = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [headerData, setHeaderData] = useState({
    maPhieu: 'PN-' + Math.floor(1000 + Math.random() * 9000),
    nhaCungCapId: '',
    khoHangId: '',
    nguoiTao: 'Thủ kho trưởng',
    ngayNhap: new Date().toISOString().split('T')[0],
    ghiChu: '',
  });

  // Chi tiết các mặt hàng nhập
  const [items, setItems] = useState([
    { sanPhamId: 1, soLuong: 10, giaNhap: 1500000 },
  ]);

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    try {
      setIsLoading(true);
      const [suppRes, whRes, prodRes] = await Promise.allSettled([
        wmsCoreService.getSuppliers(),
        wmsCoreService.getWarehouses(),
        wmsCoreService.getProducts(),
      ]);

      if (suppRes.status === 'fulfilled' && Array.isArray(suppRes.value)) {
        setSuppliers(suppRes.value);
        if (suppRes.value.length > 0) {
          setHeaderData(prev => ({ ...prev, nhaCungCapId: suppRes.value[0].id }));
        }
      }
      if (whRes.status === 'fulfilled' && Array.isArray(whRes.value)) {
        setWarehouses(whRes.value);
        if (whRes.value.length > 0) {
          setHeaderData(prev => ({ ...prev, khoHangId: whRes.value[0].id }));
        }
      }
      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
        setProducts(prodRes.value);
        if (prodRes.value.length > 0) {
          setItems([{ sanPhamId: prodRes.value[0].id, soLuong: 10, giaNhap: 1500000 }]);
        }
      }
    } catch (e) {
      console.warn('Lỗi nạp danh mục tạo phiếu nhập:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeaderData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: Number(value) };
      return updated;
    });
  };

  const handleAddItem = () => {
    const defaultProdId = products[0]?.id || 1;
    setItems(prev => [...prev, { sanPhamId: defaultProdId, soLuong: 1, giaNhap: 1000000 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      alert('Phiếu nhập phải có ít nhất một mặt hàng!');
      return;
    }
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.soLuong * item.giaNhap), 0);
  };

  const calculateTotalQuantity = () => {
    return items.reduce((sum, item) => sum + Number(item.soLuong || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!headerData.nhaCungCapId || !headerData.khoHangId) {
      alert('Vui lòng chọn đầy đủ Nhà cung cấp và Kho hàng!');
      return;
    }

    const payload = {
      nhaCungCapId: Number(headerData.nhaCungCapId),
      khoHangId: Number(headerData.khoHangId),
      nguoiTao: headerData.nguoiTao,
      danhSachHangHoa: items.map(it => ({
        sanPhamId: Number(it.sanPhamId),
        soLuong: Number(it.soLuong),
        giaNhap: Number(it.giaNhap),
      })),
    };

    try {
      setIsSubmitting(true);
      await wmsCoreService.createImportNote(payload);
      alert('Tạo phiếu nhập kho thành công! Số lượng hàng hóa đã được cộng dồn vào kệ kho.');
      navigate('/import-notes');
    } catch (err) {
      alert('Lỗi khi tạo phiếu nhập kho: ' + (err.response?.data || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="import-form-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Đang tải danh mục kho bãi và nhà cung cấp...</p>
      </div>
    );
  }

  return (
    <div className="import-form-container">
      {/* Tiêu đề & Breadcrumb */}
      <div className="form-header">
        <div className="form-header-title">
          <button 
            type="button" 
            className="btn-back" 
            onClick={() => navigate('/import-notes')}
            title="Quay lại danh sách"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2>Lập Chứng Từ Nhập Kho Mới (Goods Receipt Note)</h2>
            <p>Quy trình kiểm đếm, ghi nhận hàng hóa từ đối tác và tăng tồn kho thực tế</p>
          </div>
        </div>

        <div className="form-header-actions">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={() => navigate('/import-notes')}
          >
            Hủy Bỏ
          </button>
          <button 
            type="button" 
            className="btn-submit" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            <FiSave size={16} /> {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Nhập Kho'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Phần 1: Thông tin chung chứng từ */}
        <div className="form-card">
          <div className="form-card-title">
            <FiFileText size={18} />
            <span>Thông Tin Chứng Từ Nhập Kho</span>
          </div>

          <div className="import-form-container form-grid-3">
            <div className="form-group">
              <label>Mã Phiếu Nhập Kho</label>
              <input 
                type="text" 
                name="maPhieu"
                value={headerData.maPhieu}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', fontWeight: 'bold' }}
              />
            </div>

            <div className="form-group">
              <label>Nhà Cung Cấp Giao Hàng <span style={{ color: '#dc2626' }}>*</span></label>
              <select 
                name="nhaCungCapId"
                value={headerData.nhaCungCapId}
                onChange={handleHeaderChange}
                required
              >
                <option value="">-- Chọn Nhà Cung Cấp --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.tenNhaCungCap || s.tenNCC}</option>
                ))}
                {suppliers.length === 0 && (
                  <>
                    <option value={1}>Công ty TNHH Logitech VN</option>
                    <option value={2}>Đại lý phân phối AKKO</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Kho Tiếp Nhận & Lưu Trữ <span style={{ color: '#dc2626' }}>*</span></label>
              <select 
                name="khoHangId"
                value={headerData.khoHangId}
                onChange={handleHeaderChange}
                required
              >
                <option value="">-- Chọn Kho Tiếp Nhận --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.tenKho} ({w.maKho})</option>
                ))}
                {warehouses.length === 0 && (
                  <option value={1}>Kho Tổng Trung Tâm (KHO-01)</option>
                )}
              </select>
            </div>
          </div>

          <div className="import-form-container form-grid-3" style={{ marginTop: '14px' }}>
            <div className="form-group">
              <label>Người Lập Phiếu / Thủ Kho</label>
              <input 
                type="text" 
                name="nguoiTao"
                value={headerData.nguoiTao}
                onChange={handleHeaderChange}
              />
            </div>

            <div className="form-group">
              <label>Ngày Thực Hiện Nhập Kho</label>
              <input 
                type="date" 
                name="ngayNhap"
                value={headerData.ngayNhap}
                onChange={handleHeaderChange}
              />
            </div>

            <div className="form-group">
              <label>Ghi Chú Chứng Từ (Biên bản giao nhận, số hóa đơn đỏ...)</label>
              <input 
                type="text" 
                name="ghiChu"
                value={headerData.ghiChu}
                onChange={handleHeaderChange}
                placeholder="VD: Hóa đơn GTGT số 008912"
              />
            </div>
          </div>
        </div>

        {/* Phần 2: Bảng danh sách hàng hóa kiểm đếm */}
        <div className="form-card">
          <div className="form-card-title">
            <FiTruck size={18} />
            <span>Danh Sách Mặt Hàng Kiểm Đếm & Nhập Kho</span>
          </div>

          <div className="items-table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>STT</th>
                  <th>Hàng Hóa / Sản Phẩm (Mã SKU)</th>
                  <th style={{ width: '150px' }}>Số Lượng Nhập</th>
                  <th style={{ width: '180px' }}>Đơn Giá Nhập (VNĐ)</th>
                  <th style={{ width: '180px' }}>Thành Tiền (VNĐ)</th>
                  <th style={{ width: '60px' }}>Xóa</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const subtotal = item.soLuong * item.giaNhap;

                  return (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                      <td>
                        <select 
                          value={item.sanPhamId}
                          onChange={(e) => handleItemChange(idx, 'sanPhamId', e.target.value)}
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.tenSanPham || p.tenHangHoa} ({p.sku || `SP00${p.id}`})
                            </option>
                          ))}
                          {products.length === 0 && (
                            <>
                              <option value={1}>iPhone 15 Pro Max 256GB (SP001)</option>
                              <option value={2}>MacBook Pro 14 M3 (SP002)</option>
                            </>
                          )}
                        </select>
                      </td>
                      <td>
                        <input 
                          type="number"
                          min="1"
                          value={item.soLuong}
                          onChange={(e) => handleItemChange(idx, 'soLuong', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="number"
                          min="0"
                          step="1000"
                          value={item.giaNhap}
                          onChange={(e) => handleItemChange(idx, 'giaNhap', e.target.value)}
                        />
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#1d4ed8' }}>
                        {Number(subtotal).toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          type="button" 
                          className="btn-icon text-red"
                          onClick={() => handleRemoveItem(idx)}
                          title="Xóa dòng này"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button 
            type="button" 
            className="btn-add-row"
            onClick={handleAddItem}
          >
            <FiPlus size={16} /> Thêm Dòng Mặt Hàng
          </button>

          {/* Tổng kết tiền */}
          <div className="total-summary-card">
            <div className="total-summary-item">
              <span>TỔNG SỐ LƯỢNG HÀNG</span>
              <strong>{calculateTotalQuantity()} món</strong>
            </div>
            <div className="total-summary-item">
              <span>TỔNG GIÁ TRỊ NHẬP KHO</span>
              <strong style={{ fontSize: '22px' }}>{calculateTotal().toLocaleString('vi-VN')} đ</strong>
            </div>
          </div>
        </div>

        {/* Nút submit chân trang */}
        <div className="form-footer">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={() => navigate('/import-notes')}
          >
            Hủy Bỏ
          </button>
          <button 
            type="submit" 
            className="btn-submit" 
            disabled={isSubmitting}
          >
            <FiCheckCircle size={16} /> {isSubmitting ? 'Đang ghi sổ kho...' : 'Xác Nhận Nhập Kho & Tăng Tồn Kho'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ImportNoteCreate;
