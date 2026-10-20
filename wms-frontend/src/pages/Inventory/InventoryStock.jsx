import { useState, useEffect } from 'react';
import { 
  FiSearch, FiFilter, FiList, FiAlertCircle, FiRefreshCw, 
  FiPlus, FiBox, FiCheckCircle, FiMapPin, FiLayers 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import { productService } from '../../services/productService';
import Modal from '../../components/Common/Modal';
import './InventoryStock.css';

const InventoryStock = () => {
  const initialMockItems = [
    { 
      id: 1, 
      sanPhamId: 1,
      khoHangId: 1,
      sku: 'SP001', 
      tenHangHoa: 'iPhone 15 Pro Max 256GB', 
      tenKho: 'Kho Tổng Trung Tâm',
      donViTinh: 'Cái', 
      soLuongThucTe: 50, 
      soLuongKhaDung: 48, 
      soLuongCanhBao: 20 
    },
    { 
      id: 2, 
      sanPhamId: 2,
      khoHangId: 1,
      sku: 'SP002', 
      tenHangHoa: 'MacBook Pro 14 M3 Pro 18GB/512GB', 
      tenKho: 'Kho Tổng Trung Tâm',
      donViTinh: 'Cái', 
      soLuongThucTe: 8, 
      soLuongKhaDung: 6, 
      soLuongCanhBao: 15 
    },
    { 
      id: 3, 
      sanPhamId: 3,
      khoHangId: 1,
      sku: 'SP003', 
      tenHangHoa: 'Tai nghe Sony WH-1000XM5', 
      tenKho: 'Kho Tổng Trung Tâm',
      donViTinh: 'Cái', 
      soLuongThucTe: 100, 
      soLuongKhaDung: 95, 
      soLuongCanhBao: 30 
    },
    { 
      id: 4, 
      sanPhamId: 4,
      khoHangId: 1,
      sku: 'SP004', 
      tenHangHoa: 'Chuột không dây Logitech MX Master 3S', 
      tenKho: 'Kho Tổng Trung Tâm',
      donViTinh: 'Cái', 
      soLuongThucTe: 5, 
      soLuongKhaDung: 3, 
      soLuongCanhBao: 10 
    },
  ];

  const [inventoryList, setInventoryList] = useState(initialMockItems);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Modal States
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    sanPhamId: '',
    khoHangId: '',
    soLuong: 10,
  });

  const fetchStock = async () => {
    try {
      setIsLoading(true);
      const [invRes, prodRes, whRes] = await Promise.allSettled([
        wmsCoreService.getAllInventory(),
        productService.getAllProducts(),
        wmsCoreService.getWarehouses(),
      ]);

      let backendConnected = false;
      let rawProducts = [];
      let rawWarehouses = [];

      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
        rawProducts = prodRes.value;
        setProducts(rawProducts);
      }
      if (whRes.status === 'fulfilled' && Array.isArray(whRes.value)) {
        rawWarehouses = whRes.value;
        setWarehouses(rawWarehouses);
      }

      // Xử lý tồn kho từ WMS Core
      if (invRes.status === 'fulfilled' && Array.isArray(invRes.value) && invRes.value.length > 0) {
        backendConnected = true;
        const mapped = invRes.value.map(inv => ({
          id: inv.id,
          sanPhamId: inv.sanPham?.id,
          khoHangId: inv.khoHang?.id,
          sku: inv.sanPham?.sku || `SP${inv.sanPham?.id || inv.id}`,
          tenHangHoa: inv.sanPham?.tenSanPham || 'Sản phẩm ' + inv.id,
          tenKho: inv.khoHang?.tenKho || 'Kho Tổng',
          donViTinh: inv.sanPham?.donViTinh || 'Cái',
          soLuongThucTe: inv.soLuongThucTe ?? 0,
          soLuongKhaDung: inv.soLuongKhaDung ?? 0,
          soLuongCanhBao: inv.soLuongToiThieu || 10,
          soLuongToiDa: inv.soLuongToiDa || 1000,
        }));
        setInventoryList(mapped);
      } else if (rawProducts.length > 0) {
        backendConnected = true;
        // Nếu bảng tồn kho chưa có nhưng danh sách sản phẩm có
        const mappedFromProd = rawProducts.map(p => ({
          id: p.id,
          sanPhamId: p.id,
          khoHangId: 1,
          sku: p.sku || `SP00${p.id}`,
          tenHangHoa: p.tenSanPham || p.tenHangHoa,
          tenKho: 'Kho Tổng Trung Tâm',
          donViTinh: p.donViTinh || 'Cái',
          soLuongThucTe: p.soLuongTonKho ?? 25,
          soLuongKhaDung: p.soLuongTonKho ?? 25,
          soLuongCanhBao: p.soLuongCanhBao || 10,
          soLuongToiDa: 1000,
        }));
        setInventoryList(mappedFromProd);
      }

      setIsBackendConnected(backendConnected);
    } catch (e) {
      console.warn('Lỗi lấy dữ liệu tồn kho từ Backend:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  // Mở modal điều chỉnh / thêm tồn kho
  const handleOpenAdjust = (prefillItem = null) => {
    setFormData({
      sanPhamId: prefillItem?.sanPhamId || products[0]?.id || 1,
      khoHangId: prefillItem?.khoHangId || warehouses[0]?.id || 1,
      soLuong: 10,
    });
    setIsAdjustModalOpen(true);
  };

  // Submit điều chỉnh tồn kho
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      sanPhamId: Number(formData.sanPhamId),
      khoHangId: Number(formData.khoHangId),
      soLuong: Number(formData.soLuong),
    };

    try {
      await wmsCoreService.addStock(payload);
      alert('Cập nhật tồn kho thành công!');
      setIsAdjustModalOpen(false);
      fetchStock();
    } catch (err) {
      alert('Không thể cập nhật tồn kho: ' + (err.response?.data || err.message));
      // Fallback local UI
      setInventoryList(prev => prev.map(item => {
        if (item.sanPhamId === payload.sanPhamId) {
          const newActual = item.soLuongThucTe + payload.soLuong;
          const newAvail = item.soLuongKhaDung + payload.soLuong;
          return { ...item, soLuongThucTe: newActual, soLuongKhaDung: newAvail };
        }
        return item;
      }));
      setIsAdjustModalOpen(false);
    }
  };

  // Mở xem thẻ kho
  const handleViewCard = (item) => {
    setSelectedStock(item);
    setIsCardModalOpen(true);
  };

  // Lọc dữ liệu
  const filteredInventory = inventoryList.filter(item => {
    const code = item.sku || '';
    const name = item.tenHangHoa || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          code.toLowerCase().includes(searchTerm.toLowerCase());
    if (onlyLowStock) {
      return matchesSearch && item.soLuongThucTe <= item.soLuongCanhBao;
    }
    return matchesSearch;
  });

  return (
    <div className="inventory-stock-container">
      <div className="inventory-header">
        <div>
          <h2>Quản Lý Tồn Kho & Cảnh Báo</h2>
          <p>Theo dõi số lượng hàng hóa thực tế trên kệ, hàng khả dụng và định mức cảnh báo</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchStock} disabled={isLoading} title="Làm mới tồn kho">
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button className="btn-primary" onClick={() => handleOpenAdjust(null)}>
            <FiPlus size={16} /> Bổ Sung Tồn Kho
          </button>
        </div>
      </div>

      <div className="inventory-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo mã SKU hoặc tên hàng hóa..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className={`btn-filter ${onlyLowStock ? 'active-filter' : ''}`}
          onClick={() => setOnlyLowStock(!onlyLowStock)}
          style={{ backgroundColor: onlyLowStock ? '#fee2e2' : undefined, color: onlyLowStock ? '#b91c1c' : undefined }}
        >
          <FiFilter /> {onlyLowStock ? 'Đang lọc: Cần nhập thêm' : 'Lọc Cảnh Báo'}
        </button>
      </div>

      <div className="inventory-table-wrapper">
        <table className="wms-data-table">
          <thead>
            <tr>
              <th>Mã SKU</th>
              <th>Tên Hàng Hóa</th>
              <th>Kho Lưu Trữ</th>
              <th>ĐVT</th>
              <th>Tồn Thực Tế</th>
              <th>Khả Dụng</th>
              <th>Mức Tối Thiểu</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item) => {
              const isWarning = item.soLuongThucTe <= item.soLuongCanhBao;

              return (
                <tr key={item.id} className={isWarning ? 'row-warning' : ''}>
                  <td className="font-mono text-bold">
                    <FiBox style={{ marginRight: '6px', color: '#6366f1' }} />
                    {item.sku}
                  </td>
                  <td className="text-bold">{item.tenHangHoa}</td>
                  <td><FiMapPin className="text-muted"/> {item.tenKho || 'Kho Tổng'}</td>
                  <td>{item.donViTinh}</td>
                  <td className={`stock-level ${isWarning ? 'text-red text-bold' : 'text-green text-bold'}`}>
                    {item.soLuongThucTe}
                  </td>
                  <td className="text-bold text-blue">{item.soLuongKhaDung}</td>
                  <td className="text-muted">{item.soLuongCanhBao}</td>
                  <td>
                    {isWarning ? (
                      <span className="badge warning"><FiAlertCircle /> Cần nhập thêm</span>
                    ) : (
                      <span className="badge safe"><FiCheckCircle /> Đủ hàng</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className="btn-action" 
                        title="Bổ sung nhanh tồn kho"
                        onClick={() => handleOpenAdjust(item)}
                      >
                        <FiPlus size={13} /> Nhập
                      </button>
                      <button 
                        className="btn-action" 
                        title="Xem Thẻ Kho" 
                        onClick={() => handleViewCard(item)}
                      >
                        <FiList size={13} /> Thẻ Kho
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {filteredInventory.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center">Không tìm thấy hàng hóa nào phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Bổ Sung / Điều Chỉnh Tồn Kho */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Bổ Sung / Điều Chỉnh Tồn Kho"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <button className="btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>Hủy</button>
            <button className="btn-primary" onClick={handleAdjustSubmit}>Xác Nhận Nhập</button>
          </div>
        }
      >
        <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Chọn Mặt Hàng:</label>
            <select
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
              value={formData.sanPhamId}
              onChange={(e) => setFormData({ ...formData, sanPhamId: e.target.value })}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.tenSanPham || p.tenHangHoa} ({p.sku || p.maHangHoa})</option>
              ))}
              {products.length === 0 && (
                <>
                  <option value={1}>iPhone 15 Pro Max 256GB (SP001)</option>
                  <option value={2}>MacBook Pro 14 M3 Pro (SP002)</option>
                  <option value={3}>Tai nghe Sony WH-1000XM5 (SP003)</option>
                  <option value={4}>Chuột Logitech MX Master 3S (SP004)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Kho Lưu Trữ:</label>
            <select
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
              value={formData.khoHangId}
              onChange={(e) => setFormData({ ...formData, khoHangId: e.target.value })}
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.tenKho} ({w.maKho})</option>
              ))}
              {warehouses.length === 0 && (
                <option value={1}>Kho Tổng Trung Tâm (KHO-01)</option>
              )}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Số Lượng Nhập Bổ Sung:</label>
            <input 
              type="number"
              min="1"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
              value={formData.soLuong}
              onChange={(e) => setFormData({ ...formData, soLuong: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Modal Xem Thẻ Kho */}
      {selectedStock && (
        <Modal
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          title={`Thẻ Kho: ${selectedStock.tenHangHoa}`}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button className="btn-secondary" onClick={() => setIsCardModalOpen(false)}>Đóng</button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <p><strong><FiBox /> Mã Hàng (SKU):</strong> <span className="font-mono text-bold">{selectedStock.sku}</span></p>
              <p><strong><FiMapPin /> Vị Trí Kho:</strong> {selectedStock.tenKho}</p>
              <p><strong><FiLayers /> Đơn Vị Tính:</strong> {selectedStock.donViTinh}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '12px', color: '#065f46' }}>TỒN KHO THỰC TẾ</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#047857' }}>
                  {selectedStock.soLuongThucTe} <small style={{ fontSize: '12px' }}>{selectedStock.donViTinh}</small>
                </div>
                <div style={{ fontSize: '11px', color: '#059669' }}>Hàng đang có trên kệ</div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>TỒN KHO KHẢ DỤNG</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8' }}>
                  {selectedStock.soLuongKhaDung} <small style={{ fontSize: '12px' }}>{selectedStock.donViTinh}</small>
                </div>
                <div style={{ fontSize: '11px', color: '#2563eb' }}>Sẵn sàng bán và xuất giao</div>
              </div>
            </div>

            <div style={{ padding: '10px 14px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <p style={{ margin: 0, color: '#92400e', fontSize: '13px' }}>
                <strong>Ngưỡng cảnh báo:</strong> Dưới {selectedStock.soLuongCanhBao} {selectedStock.donViTinh} hệ thống sẽ tự động kích hoạt cảnh báo bổ sung hàng.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InventoryStock;