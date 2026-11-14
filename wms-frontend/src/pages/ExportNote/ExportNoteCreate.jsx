/**
 * ==============================================================================
 * Module: ExportNoteCreate.jsx
 * Phân hệ: Lập Yêu Cầu Xuất Kho (Create Export Request)
 * Mô tả: Sửa triệt để lỗi trùng Key trong React và khắc phục cảnh báo Console.
 * ==============================================================================
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiPlus, FiTrash2, 
  FiFileText, FiPackage, FiShoppingBag, FiTruck, FiCalendar, FiUser
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import { orderService } from '../../services/orderService';
import './ExportNoteCreate.css'; 

const ExportNoteCreate = () => {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [stores, setStores] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [headerData, setHeaderData] = useState({
    maPhieu: 'YCX-' + Math.floor(1000 + Math.random() * 9000), 
    donHangId: '',
    khoHangId: '',       
    cuaHangNhanId: '',   
    donViVanChuyenId: '',
    nguoiTao: 'Nhân viên kinh doanh',
    ngayXuat: new Date().toISOString().split('T')[0],
    ghiChu: '',
  });

  const [items, setItems] = useState([
    { sanPhamId: '', soLuong: 1 },
  ]);

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    try {
      setIsLoading(true);

      const [whRes, shipRes, invRes, orderRes] = await Promise.allSettled([
        wmsCoreService.getWarehouses(),
        wmsCoreService.getShippers(),
        wmsCoreService.getAllInventory(),
        orderService.getAllOrders(),
      ]);

      // 1. Kho xuất & Cửa hàng nhận
      if (whRes.status === 'fulfilled' && Array.isArray(whRes.value)) {
        const rawList = whRes.value;
        setWarehouses(rawList);

        const onlyStores = rawList.filter(w => {
          const code = (w.maKho || '').toUpperCase();
          const name = (w.tenKho || '').toUpperCase();
          return !code.startsWith('KHO-') || name.includes('SHOP') || name.includes('STORE');
        });
        setStores(onlyStores);

        if (rawList.length > 0) {
          setHeaderData(prev => ({ 
            ...prev, 
            khoHangId: rawList[0]?.id,
            cuaHangNhanId: onlyStores[0]?.id || rawList[0]?.id
          }));
        }
      }

      // 2. Đơn vị Vận Chuyển
      if (shipRes.status === 'fulfilled' && Array.isArray(shipRes.value)) {
        setShippers(shipRes.value);
        if (shipRes.value.length > 0) setHeaderData(prev => ({ ...prev, donViVanChuyenId: shipRes.value[0].id }));
      }

      // 3. Đơn hàng tham chiếu (Có phòng ngừa lỗi 403 Forbidden)
      if (orderRes.status === 'fulfilled' && Array.isArray(orderRes.value)) {
        setOrders(orderRes.value);
        if (orderRes.value.length > 0) {
          setHeaderData(prev => ({ ...prev, donHangId: orderRes.value[0].maDonHang || `ORD-${orderRes.value[0].id}` }));
        }
      }

      // 4. Đồng bộ 100% dữ liệu Tồn Kho
      if (invRes.status === 'fulfilled' && Array.isArray(invRes.value)) {
        const availableProducts = invRes.value.map((inv, index) => ({
          uniqueKey: `${inv.sanPhamId || inv.id}-${index}`, // Key duy nhất tránh trùng lặp React DOM
          sanPhamId: inv.sanPhamId || inv.sanPham?.id || inv.id,
          sku: inv.sku || inv.sanPham?.sku || `SP${inv.id}`,
          tenHangHoa: inv.tenSanPham || inv.sanPham?.tenSanPham || 'Sản phẩm ' + inv.id,
          soLuongThucTe: inv.soLuongThucTe ?? 0,
          soLuongKhaDung: inv.soLuongKhaDung ?? inv.soLuongThucTe ?? 0,
        }));

        setProducts(availableProducts);

        if (availableProducts.length > 0) {
          setItems([{ sanPhamId: availableProducts[0].sanPhamId, soLuong: 1 }]);
        }
      }
    } catch (e) {
      console.warn('Lỗi nạp dữ liệu:', e.message);
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
    const defaultProdId = products[0]?.sanPhamId || 1;
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
      cuaHangNhanId: headerData.cuaHangNhanId ? Number(headerData.cuaHangNhanId) : null,
      donViVanChuyenId: Number(headerData.donViVanChuyenId),
      donHangId: headerData.donHangId ? headerData.donHangId.trim() : null,
      nguoiTao: headerData.nguoiTao,
      trangThai: 'CHỜ DUYỆT', // SỬA Ở ĐÂY: Chuyển từ 'CHỜ XỬ LÝ' sang 'CHỜ DUYỆT'
      danhSachHangHoa: items.map(it => ({
        sanPhamId: Number(it.sanPhamId),
        soLuong: Number(it.soLuong),
      })),
    };

    // ... phần code bên dưới giữ nguyên

    try {
      setIsSubmitting(true);
      await wmsCoreService.createExportNote(payload);
      
      alert('Tạo yêu cầu xuất kho thành công! Đang chuyển đến trang phê duyệt...');
      navigate('/export-approve');
    } catch (err) {
      alert('Lỗi khi tạo yêu cầu xuất kho: ' + (err.response?.data || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="export-create-container" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: '#64748b' }}>Đang nạp danh sách tồn kho từ Backend...</p>
      </div>
    );
  }

  return (
    <div className="export-create-container">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-title">
          <button type="button" className="btn-back" onClick={() => navigate('/export-notes')}>
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2>Lập Yêu Cầu Xuất Kho</h2>
            <p>Tạo yêu cầu xuất hàng hóa, chờ bộ phận kho xử lý và bàn giao</p>
          </div>
        </div>
        
        <div className="form-header-actions">
          <button type="button" className="btn-cancel-custom" onClick={() => navigate('/export-notes')}>
            Hủy Bỏ
          </button>
          <button type="button" className="btn-submit-custom" onClick={handleSubmit} disabled={isSubmitting}>
            <FiSave size={16} /> {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Thông Tin Đơn Hàng */}
        <div className="form-card">
          <div className="form-card-title">
            <FiFileText size={18} /> Thông Tin Đơn Hàng & Vận Chuyển
          </div>
          
          <div className="form-grid-3">
            <div className="form-group">
              <label>Mã Yêu Cầu Xuất Kho</label>
              <input type="text" name="maPhieu" value={headerData.maPhieu} disabled className="input-disabled" />
            </div>

            <div className="form-group">
              <label>Mã Đơn Hàng Tham Chiếu</label>
              <input 
                type="text" 
                name="donHangId" 
                placeholder="VD: ORD-8892 hoặc chọn danh sách" 
                value={headerData.donHangId} 
                onChange={handleHeaderChange} 
                list="orders-list" 
              />
              <datalist id="orders-list">
                {orders.map((o, idx) => (
                  <option key={`ord-${o.id || idx}`} value={o.maDonHang || `ORD-${o.id}`} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label>Kho Xuất Hàng *</label>
              <select name="khoHangId" value={headerData.khoHangId} onChange={handleHeaderChange} required>
                <option value="">-- Chọn Kho Xuất --</option>
                {warehouses.map((w, idx) => (
                  <option key={`wh-${w.id || idx}`} value={w.id}>{w.tenKho} ({w.maKho})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiShoppingBag style={{ color: '#2563eb' }} /> Nơi Nhận Hàng (Cửa Hàng) *
              </label>
              <select name="cuaHangNhanId" value={headerData.cuaHangNhanId} onChange={handleHeaderChange} required>
                <option value="">-- Chọn Cửa Hàng Đích --</option>
                {stores.map((s, idx) => (
                  <option key={`store-${s.id || idx}`} value={s.id}>{s.tenKho} ({s.maKho})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiTruck style={{ color: '#2563eb' }} /> Đơn Vị Vận Chuyển *
              </label>
              <select name="donViVanChuyenId" value={headerData.donViVanChuyenId} onChange={handleHeaderChange} required>
                <option value="">-- Chọn Đối Tác Vận Chuyển --</option>
                {shippers.map((s, idx) => (
                  <option key={`ship-${s.id || idx}`} value={s.id}>{s.tenDonVi}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiUser style={{ color: '#64748b' }} /> Người Tạo Yêu Cầu
              </label>
              <input type="text" name="nguoiTao" value={headerData.nguoiTao} onChange={handleHeaderChange} />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiCalendar style={{ color: '#64748b' }} /> Ngày Yêu Cầu
              </label>
              <input type="date" name="ngayXuat" value={headerData.ngayXuat} onChange={handleHeaderChange} />
            </div>
          </div>
        </div>

        {/* Danh Sách Hàng Hóa Yêu Cầu */}
        <div className="form-card">
          <div className="form-card-title">
            <FiPackage size={18} /> Danh Sách Hàng Hóa Yêu Cầu
          </div>
          
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                <th>HÀNG HÓA CẦN XUẤT (TỒN KHO THỰC TẾ)</th>
                <th style={{ width: '180px' }}>SỐ LƯỢNG</th>
                <th style={{ width: '80px', textAlign: 'center' }}>XÓA</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={`item-row-${idx}`}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <select 
                      value={item.sanPhamId} 
                      onChange={(e) => handleItemChange(idx, 'sanPhamId', e.target.value)}
                      className="select-item-product"
                    >
                      {products.map((p, pIdx) => (
                        <option key={`opt-${p.uniqueKey || pIdx}`} value={p.sanPhamId}>
                          {p.tenHangHoa} (Tồn khả dụng: {p.soLuongKhaDung})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input 
                      type="number" 
                      min="1" 
                      value={item.soLuong} 
                      onChange={(e) => handleItemChange(idx, 'soLuong', e.target.value)} 
                      className="input-quantity"
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      type="button" 
                      className="btn-delete-row" 
                      onClick={() => handleRemoveItem(idx)}
                      title="Xóa dòng"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button type="button" className="btn-add-row-custom" onClick={handleAddItem}>
            <FiPlus size={16} /> Thêm Hàng Hóa
          </button>
          
          <div className="total-summary-card">
            <span>TỔNG SỐ LƯỢNG:</span>
            <strong className="summary-number">{calculateTotalQuantity()} kiện</strong>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ExportNoteCreate;