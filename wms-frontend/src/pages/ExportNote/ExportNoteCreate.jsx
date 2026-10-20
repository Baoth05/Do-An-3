import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiPlus, FiTrash2, 
  FiFileText, FiTruck, FiMapPin, FiCheckCircle, FiPackage 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import { orderService } from '../../services/orderService';
import './ExportNoteForm.css';

const ExportNoteCreate = () => {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [headerData, setHeaderData] = useState({
    maPhieu: 'PX-' + Math.floor(1000 + Math.random() * 9000),
    donHangId: '',
    khoHangId: '',
    donViVanChuyenId: '',
    nguoiTao: 'Thủ kho xuất',
    ngayXuat: new Date().toISOString().split('T')[0],
    ghiChu: '',
  });

  // Danh sách sản phẩm xuất
  const [items, setItems] = useState([
    { sanPhamId: 1, soLuong: 1 },
  ]);

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    try {
      setIsLoading(true);
      const [whRes, shipRes, prodRes, orderRes] = await Promise.allSettled([
        wmsCoreService.getWarehouses(),
        wmsCoreService.getShippers(),
        wmsCoreService.getProducts(),
        orderService.getAllOrders(),
      ]);

      if (whRes.status === 'fulfilled' && Array.isArray(whRes.value)) {
        setWarehouses(whRes.value);
        if (whRes.value.length > 0) {
          setHeaderData(prev => ({ ...prev, khoHangId: whRes.value[0].id }));
        }
      }
      if (shipRes.status === 'fulfilled' && Array.isArray(shipRes.value)) {
        setShippers(shipRes.value);
        if (shipRes.value.length > 0) {
          setHeaderData(prev => ({ ...prev, donViVanChuyenId: shipRes.value[0].id }));
        }
      }
      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
        setProducts(prodRes.value);
        if (prodRes.value.length > 0) {
          setItems([{ sanPhamId: prodRes.value[0].id, soLuong: 1 }]);
        }
      }
      if (orderRes.status === 'fulfilled' && Array.isArray(orderRes.value)) {
        setOrders(orderRes.value);
        if (orderRes.value.length > 0) {
          setHeaderData(prev => ({ ...prev, donHangId: orderRes.value[0].maDonHang || `ORD-${orderRes.value[0].id}` }));
        }
      }
    } catch (e) {
      console.warn('Lỗi nạp danh mục tạo phiếu xuất:', e.message);
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
    setItems(prev => [...prev, { sanPhamId: defaultProdId, soLuong: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      alert('Phiếu xuất phải có ít nhất một mặt hàng!');
      return;
    }
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const calculateTotalQuantity = () => {
    return items.reduce((sum, item) => sum + Number(item.soLuong || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!headerData.khoHangId || !headerData.donViVanChuyenId) {
      alert('Vui lòng chọn đầy đủ Kho xuất và Đơn vị vận chuyển!');
      return;
    }

    const payload = {
      khoHangId: Number(headerData.khoHangId),
      donViVanChuyenId: Number(headerData.donViVanChuyenId),
      donHangId: headerData.donHangId ? headerData.donHangId.trim() : null,
      nguoiTao: headerData.nguoiTao,
      danhSachHangHoa: items.map(it => ({
        sanPhamId: Number(it.sanPhamId),
        soLuong: Number(it.soLuong),
      })),
    };

    try {
      setIsSubmitting(true);
      await wmsCoreService.createExportNote(payload);
      alert('Tạo phiếu xuất kho thành công! Hàng hóa đã được trừ khỏi tồn kho thực tế và sẵn sàng bàn giao cho bưu tá.');
      navigate('/export-notes');
    } catch (err) {
      alert('Lỗi khi xuất kho: ' + (err.response?.data || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="export-form-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Đang chuẩn bị dữ liệu xuất kho...</p>
      </div>
    );
  }

  return (
    <div className="export-form-container">
      {/* Tiêu đề & Breadcrumb */}
      <div className="form-header">
        <div className="form-header-title">
          <button 
            type="button" 
            className="btn-back" 
            onClick={() => navigate('/export-notes')}
            title="Quay lại danh sách"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2>Lập Phiếu Xuất Kho & Đóng Gói (Goods Issue Note)</h2>
            <p>Trừ tồn kho khả dụng, gom hàng và bàn giao cho đơn vị chuyển phát</p>
          </div>
        </div>

        <div className="form-header-actions">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={() => navigate('/export-notes')}
          >
            Hủy Bỏ
          </button>
          <button 
            type="button" 
            className="btn-submit" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            <FiSave size={16} /> {isSubmitting ? 'Đang xuất kho...' : 'Xác Nhận Xuất Kho'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Phần 1: Thông tin điều phối xuất kho */}
        <div className="form-card">
          <div className="form-card-title">
            <FiFileText size={18} />
            <span>Thông Tin Đơn Hàng & Tuyến Vận Chuyển</span>
          </div>

          <div className="export-form-container form-grid-3">
            <div className="form-group">
              <label>Mã Phiếu Xuất Kho</label>
              <input 
                type="text" 
                name="maPhieu"
                value={headerData.maPhieu}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', fontWeight: 'bold' }}
              />
            </div>

            <div className="form-group">
              <label>Mã Đơn Hàng Tham Chiếu (E-commerce)</label>
              <input 
                type="text" 
                name="donHangId"
                value={headerData.donHangId}
                onChange={handleHeaderChange}
                placeholder="VD: ORD-9082 hoặc để trống nếu xuất nội bộ"
                list="orders-list"
              />
              <datalist id="orders-list">
                {orders.map(o => (
                  <option key={o.id} value={o.maDonHang || `ORD-${o.id}`} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label>Kho Xuất Hàng <span style={{ color: '#dc2626' }}>*</span></label>
              <select 
                name="khoHangId"
                value={headerData.khoHangId}
                onChange={handleHeaderChange}
                required
              >
                <option value="">-- Chọn Kho Hàng --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.tenKho} ({w.maKho})</option>
                ))}
                {warehouses.length === 0 && (
                  <option value={1}>Kho Tổng Trung Tâm (KHO-01)</option>
                )}
              </select>
            </div>
          </div>

          <div className="export-form-container form-grid-3" style={{ marginTop: '14px' }}>
            <div className="form-group">
              <label>Đơn Vị Vận Chuyển / Bưu Tá Tiếp Nhận <span style={{ color: '#dc2626' }}>*</span></label>
              <select 
                name="donViVanChuyenId"
                value={headerData.donViVanChuyenId}
                onChange={handleHeaderChange}
                required
              >
                <option value="">-- Chọn Đối Tác Giao Hàng --</option>
                {shippers.map(s => (
                  <option key={s.id} value={s.id}>{s.tenDonVi}</option>
                ))}
                {shippers.length === 0 && (
                  <>
                    <option value={1}>Giao Hàng Tiết Kiệm (GHTK)</option>
                    <option value={2}>Viettel Post</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Người Tạo Phiếu / Thủ Kho</label>
              <input 
                type="text" 
                name="nguoiTao"
                value={headerData.nguoiTao}
                onChange={handleHeaderChange}
              />
            </div>

            <div className="form-group">
              <label>Ngày Thực Hiện Xuất Kho</label>
              <input 
                type="date" 
                name="ngayXuat"
                value={headerData.ngayXuat}
                onChange={handleHeaderChange}
              />
            </div>
          </div>
        </div>

        {/* Phần 2: Bảng gom hàng và xuất kho */}
        <div className="form-card">
          <div className="form-card-title">
            <FiPackage size={18} />
            <span>Danh Sách Hàng Hóa Xuất Khỏi Kệ</span>
          </div>

          <div className="items-table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>STT</th>
                  <th>Hàng Hóa Xuất Kho (Mã SKU)</th>
                  <th style={{ width: '180px' }}>Số Lượng Xuất</th>
                  <th style={{ width: '60px' }}>Xóa</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
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
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        type="button" 
                        className="btn-icon text-red"
                        onClick={() => handleRemoveItem(idx)}
                        title="Xóa mặt hàng này"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
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

          {/* Tổng kết số lượng */}
          <div className="total-summary-card">
            <div className="total-summary-item">
              <span>TỔNG SỐ LƯỢNG MẶT HÀNG XUẤT</span>
              <strong>{calculateTotalQuantity()} kiện hàng</strong>
            </div>
          </div>
        </div>

        {/* Nút submit chân trang */}
        <div className="form-footer">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={() => navigate('/export-notes')}
          >
            Hủy Bỏ
          </button>
          <button 
            type="submit" 
            className="btn-submit" 
            disabled={isSubmitting}
          >
            <FiCheckCircle size={16} /> {isSubmitting ? 'Đang trừ kho...' : 'Xác Nhận Xuất Kho & Bàn Giao'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExportNoteCreate;
