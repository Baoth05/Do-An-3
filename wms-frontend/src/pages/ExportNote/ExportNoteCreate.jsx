import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiPlus, FiTrash2, 
  FiFileText, FiCheckCircle, FiPackage 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import { orderService } from '../../services/orderService';
import './ExportNoteCreate.css'; 

const ExportNoteCreate = () => {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [headerData, setHeaderData] = useState({
    // Đổi tiền tố thành YCX (Yêu Cầu Xuất) cho hợp logic
    maPhieu: 'YCX-' + Math.floor(1000 + Math.random() * 9000), 
    donHangId: '',
    khoHangId: '',
    donViVanChuyenId: '',
    nguoiTao: 'Nhân viên kinh doanh', // Có thể đổi default role tùy ý
    ngayXuat: new Date().toISOString().split('T')[0],
    ghiChu: '',
  });

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
        if (whRes.value.length > 0) setHeaderData(prev => ({ ...prev, khoHangId: whRes.value[0].id }));
      }
      if (shipRes.status === 'fulfilled' && Array.isArray(shipRes.value)) {
        setShippers(shipRes.value);
        if (shipRes.value.length > 0) setHeaderData(prev => ({ ...prev, donViVanChuyenId: shipRes.value[0].id }));
      }
      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
        setProducts(prodRes.value);
        if (prodRes.value.length > 0) setItems([{ sanPhamId: prodRes.value[0].id, soLuong: 1 }]);
      }
      if (orderRes.status === 'fulfilled' && Array.isArray(orderRes.value)) {
        setOrders(orderRes.value);
        if (orderRes.value.length > 0) setHeaderData(prev => ({ ...prev, donHangId: orderRes.value[0].maDonHang || `ORD-${orderRes.value[0].id}` }));
      }
    } catch (e) {
      console.warn('Lỗi nạp danh mục:', e.message);
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
    if (items.length === 1) return alert('Yêu cầu xuất kho phải có ít nhất một mặt hàng!');
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const calculateTotalQuantity = () => items.reduce((sum, item) => sum + Number(item.soLuong || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!headerData.khoHangId || !headerData.donViVanChuyenId) {
      return alert('Vui lòng chọn đầy đủ Kho xuất và Đơn vị vận chuyển!');
    }

    const payload = {
      khoHangId: Number(headerData.khoHangId),
      donViVanChuyenId: Number(headerData.donViVanChuyenId),
      donHangId: headerData.donHangId ? headerData.donHangId.trim() : null,
      nguoiTao: headerData.nguoiTao,
      // Có thể thêm trường trạng thái mặc định gửi về backend
      trangThai: 'CHỜ XỬ LÝ', 
      danhSachHangHoa: items.map(it => ({
        sanPhamId: Number(it.sanPhamId),
        soLuong: Number(it.soLuong),
      })),
    };

    try {
      setIsSubmitting(true);
      await wmsCoreService.createExportNote(payload);
      alert('Tạo yêu cầu xuất kho thành công!');
      navigate('/export-notes');
    } catch (err) {
      alert('Lỗi khi tạo yêu cầu: ' + (err.response?.data || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="export-create-container"><p>Đang tải...</p></div>;

  return (
    <div className="export-create-container">
      <div className="form-header">
        <div className="form-header-title">
          <button type="button" className="btn-back" onClick={() => navigate('/export-notes')}>
            <FiArrowLeft size={18} />
          </button>
          <div>
            {/* Đổi Title */}
            <h2>Lập Yêu Cầu Xuất Kho (Create Export Request)</h2>
            <p>Tạo yêu cầu xuất hàng hóa, chờ bộ phận kho xử lý và bàn giao</p>
          </div>
        </div>
        <div className="form-header-actions">
          <button className="btn-cancel" onClick={() => navigate('/export-notes')}>Hủy Bỏ</button>
          <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
            <FiSave size={16} /> Gửi Yêu Cầu
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="form-card">
          <div className="form-card-title"><FiFileText size={18} /> Thông Tin Đơn Hàng & Vận Chuyển</div>
          <div className="form-grid-3">
            <div className="form-group">
              {/* Đổi label */}
              <label>Mã Yêu Cầu Xuất Kho</label>
              <input type="text" name="maPhieu" value={headerData.maPhieu} disabled style={{ backgroundColor: '#f1f5f9' }} />
            </div>
            <div className="form-group">
              <label>Mã Đơn Hàng Tham Chiếu</label>
              <input type="text" name="donHangId" value={headerData.donHangId} onChange={handleHeaderChange} list="orders-list" />
            </div>
            <div className="form-group">
              <label>Kho Xuất Hàng *</label>
              <select name="khoHangId" value={headerData.khoHangId} onChange={handleHeaderChange} required>
                <option value="">-- Chọn Kho --</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.tenKho}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Đơn Vị Vận Chuyển *</label>
              <select name="donViVanChuyenId" value={headerData.donViVanChuyenId} onChange={handleHeaderChange} required>
                <option value="">-- Chọn Đối Tác --</option>
                {shippers.map(s => <option key={s.id} value={s.id}>{s.tenDonVi}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Người Tạo Yêu Cầu</label>
              <input type="text" name="nguoiTao" value={headerData.nguoiTao} onChange={handleHeaderChange} />
            </div>
            <div className="form-group">
              <label>Ngày Yêu Cầu</label>
              <input type="date" name="ngayXuat" value={headerData.ngayXuat} onChange={handleHeaderChange} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-title"><FiPackage size={18} /> Danh Sách Hàng Hóa Yêu Cầu</div>
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>STT</th>
                <th>Hàng Hóa Cần Xuất</th>
                <th style={{ width: '150px' }}>Số Lượng</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td>
                    <select value={item.sanPhamId} onChange={(e) => handleItemChange(idx, 'sanPhamId', e.target.value)}>
                      {products.map(p => <option key={p.id} value={p.id}>{p.tenSanPham || p.tenHangHoa}</option>)}
                    </select>
                  </td>
                  <td>
                    <input type="number" min="1" value={item.soLuong} onChange={(e) => handleItemChange(idx, 'soLuong', e.target.value)} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" className="btn-icon text-red" onClick={() => handleRemoveItem(idx)}><FiTrash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="btn-add-row" onClick={handleAddItem}><FiPlus size={16} /> Thêm Dòng</button>
          
          <div className="total-summary-card">
            TỔNG SỐ LƯỢNG: <strong>{calculateTotalQuantity()} kiện</strong>
          </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            <FiCheckCircle size={16} /> Tạo Yêu Cầu Xuất Kho
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExportNoteCreate;