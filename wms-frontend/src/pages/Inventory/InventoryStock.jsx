import { useState, useEffect, useMemo } from 'react';
import { 
  FiSearch, FiRefreshCw, FiPlus, FiBox, FiCheckCircle, 
  FiMapPin, FiLayers, FiAlertTriangle, FiList, FiX, FiCheck, FiArrowDownRight, FiArrowUpRight
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import { productService } from '../../services/productService';
import Modal from '../../components/Common/Modal';
import './InventoryStock.css';

const InventoryStock = () => {
  const [inventoryList, setInventoryList] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'LOW' | 'OUT' | 'SAFE'
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Modal States
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockCards, setStockCards] = useState([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

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

      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
        setProducts(prodRes.value);
      }
      if (whRes.status === 'fulfilled' && Array.isArray(whRes.value)) {
        setWarehouses(whRes.value);
      }

      if (invRes.status === 'fulfilled' && Array.isArray(invRes.value)) {
        setIsBackendConnected(true);
        const mapped = invRes.value.map(inv => ({
          id: inv.id,
          sanPhamId: inv.sanPhamId || inv.sanPham?.id,
          khoHangId: inv.khoHangId || inv.khoHang?.id,
          sku: inv.sku || inv.sanPham?.sku || `SP${inv.id}`,
          tenHangHoa: inv.tenSanPham || inv.sanPham?.tenSanPham || 'Sản phẩm ' + inv.id,
          tenKho: inv.tenKho || inv.khoHang?.tenKho || 'Kho Tổng Trung Tâm',
          donViTinh: inv.donViTinh || inv.sanPham?.donViTinh || 'Cái',
          soLuongThucTe: inv.soLuongThucTe ?? 0,
          soLuongKhaDung: inv.soLuongKhaDung ?? 0,
          soLuongCanhBao: inv.soLuongToiThieu ?? 10,
          soLuongToiDa: inv.soLuongToiDa ?? 1000,
          giaBanHienTai: inv.giaBanHienTai || 0,
        }));
        setInventoryList(mapped);
      } else {
        setInventoryList([]);
      }
    } catch (e) {
      console.warn('Lỗi lấy dữ liệu tồn kho:', e.message);
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  // KPIs
  const stats = useMemo(() => {
    const totalSKUs = inventoryList.length;
    const totalItems = inventoryList.reduce((acc, i) => acc + (i.soLuongThucTe || 0), 0);
    const lowStockCount = inventoryList.filter(i => i.soLuongThucTe > 0 && i.soLuongThucTe <= i.soLuongCanhBao).length;
    const outOfStockCount = inventoryList.filter(i => i.soLuongThucTe <= 0).length;
    const safeStockCount = inventoryList.filter(i => i.soLuongThucTe > i.soLuongCanhBao).length;

    return { totalSKUs, totalItems, lowStockCount, outOfStockCount, safeStockCount };
  }, [inventoryList]);

  // Lọc dữ liệu
  const filteredItems = useMemo(() => {
    return inventoryList.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchSearch = 
        (item.tenHangHoa || '').toLowerCase().includes(q) ||
        (item.sku || '').toLowerCase().includes(q) ||
        (item.tenKho || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Lọc theo kho
      if (selectedWarehouse !== 'ALL' && String(item.khoHangId) !== String(selectedWarehouse)) {
        return false;
      }

      // Lọc theo trạng thái
      if (filterStatus === 'LOW') {
        return item.soLuongThucTe > 0 && item.soLuongThucTe <= item.soLuongCanhBao;
      }
      if (filterStatus === 'OUT') {
        return item.soLuongThucTe <= 0;
      }
      if (filterStatus === 'SAFE') {
        return item.soLuongThucTe > item.soLuongCanhBao;
      }

      return true;
    });
  }, [inventoryList, searchTerm, selectedWarehouse, filterStatus]);

  const handleOpenAdjust = (stock) => {
    setSelectedStock(stock);
    setFormData({
      sanPhamId: stock.sanPhamId || products[0]?.id || '',
      khoHangId: stock.khoHangId || warehouses[0]?.id || '',
      soLuong: 10,
    });
    setIsAdjustModalOpen(true);
  };

  const handleOpenNewStock = () => {
    setSelectedStock(null);
    setFormData({
      sanPhamId: products[0]?.id || '',
      khoHangId: warehouses[0]?.id || '',
      soLuong: 10,
    });
    setIsAdjustModalOpen(true);
  };

  const handleOpenCard = async (stock) => {
    setSelectedStock(stock);
    setIsCardModalOpen(true);
    setStockCards([]);
    if (stock.sanPhamId) {
      try {
        setIsLoadingCards(true);
        const res = await wmsCoreService.getStockCards({ 
          sanPhamId: stock.sanPhamId,
          khoHangId: stock.khoHangId 
        });
        if (Array.isArray(res)) {
          setStockCards(res);
        }
      } catch (err) {
        console.warn('Lỗi tải thẻ kho:', err.message);
      } finally {
        setIsLoadingCards(false);
      }
    }
  };

  const handleSubmitAdjust = async (e) => {
    e.preventDefault();
    if (!formData.sanPhamId || !formData.khoHangId) {
      alert('Vui lòng chọn sản phẩm và kho hàng!');
      return;
    }

    try {
      const payload = {
        sanPhamId: Number(formData.sanPhamId),
        khoHangId: Number(formData.khoHangId),
        soLuong: Number(formData.soLuong),
      };

      await wmsCoreService.addStock(payload);
      alert('Cập nhật tồn kho thành công!');
      setIsAdjustModalOpen(false);
      fetchStock();
    } catch (err) {
      alert('Lỗi khi cập nhật tồn kho: ' + (err.response?.data || err.message));
    }
  };

  return (
    <div className="inv-page">
      {/* 1. Header tinh gọn */}
      <div className="inv-top-bar">
        <div>
          <h1 className="inv-title">Quản Lý Tồn Kho & Thẻ Kho</h1>
          <p className="inv-subtitle">
            Theo dõi thời gian thực số lượng tồn thực tế, khả dụng và biến động thẻ kho
          </p>
        </div>
        <div className="inv-top-actions">
          <button 
            className="btn-secondary" 
            onClick={fetchStock} 
            disabled={isLoading}
            title="Đồng bộ dữ liệu"
          >
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} size={14} /> 
            <span>{isBackendConnected ? 'Đã Kết Nối (8081)' : 'Đồng Bộ'}</span>
          </button>
          <button className="btn-primary" onClick={handleOpenNewStock}>
            <FiPlus size={16} /> 
            <span>Nhập Thêm Tồn Kho</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards gọn gàng, hiệu suất cao */}
      <div className="inv-kpi-grid">
        <div className="inv-kpi-card">
          <div className="inv-kpi-info">
            <span className="inv-kpi-label">Tổng Mặt Hàng (SKU)</span>
            <div className="inv-kpi-val">{stats.totalSKUs}</div>
          </div>
          <div className="inv-kpi-icon icon-box">
            <FiBox size={18} />
          </div>
        </div>

        <div className="inv-kpi-card">
          <div className="inv-kpi-info">
            <span className="inv-kpi-label">Tổng Sản Lượng Tồn</span>
            <div className="inv-kpi-val">{stats.totalItems.toLocaleString('vi-VN')}</div>
          </div>
          <div className="inv-kpi-icon icon-layers">
            <FiLayers size={18} />
          </div>
        </div>

        <div className="inv-kpi-card">
          <div className="inv-kpi-info">
            <span className="inv-kpi-label">Tồn Kho Đủ Định Mức</span>
            <div className="inv-kpi-val text-success">{stats.safeStockCount}</div>
          </div>
          <div className="inv-kpi-icon icon-check">
            <FiCheckCircle size={18} />
          </div>
        </div>

        <div className="inv-kpi-card">
          <div className="inv-kpi-info">
            <span className="inv-kpi-label">Cần Bổ Sung Gấp</span>
            <div className={`inv-kpi-val ${stats.lowStockCount > 0 ? 'text-danger' : 'text-muted'}`}>
              {stats.lowStockCount + stats.outOfStockCount}
            </div>
          </div>
          <div className={`inv-kpi-icon ${stats.lowStockCount > 0 ? 'icon-alert' : 'icon-muted'}`}>
            <FiAlertTriangle size={18} />
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Tìm kiếm + Lọc trạng thái + Lọc kho */}
      <div className="inv-toolbar">
        <div className="inv-search-wrap">
          <FiSearch className="search-icon" size={15} />
          <input 
            type="text" 
            placeholder="Tìm theo SKU, tên sản phẩm hoặc kho..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              <FiX size={14} />
            </button>
          )}
        </div>

        <div className="inv-filter-pills">
          <button 
            className={`pill-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterStatus('ALL')}
          >
            Tất Cả ({inventoryList.length})
          </button>
          <button 
            className={`pill-btn ${filterStatus === 'SAFE' ? 'active' : ''}`}
            onClick={() => setFilterStatus('SAFE')}
          >
            An Toàn ({stats.safeStockCount})
          </button>
          <button 
            className={`pill-btn warn ${filterStatus === 'LOW' ? 'active' : ''}`}
            onClick={() => setFilterStatus('LOW')}
          >
            Dưới Ngưỡng ({stats.lowStockCount})
          </button>
          <button 
            className={`pill-btn danger ${filterStatus === 'OUT' ? 'active' : ''}`}
            onClick={() => setFilterStatus('OUT')}
          >
            Hết Hàng ({stats.outOfStockCount})
          </button>
        </div>

        <div className="inv-warehouse-select">
          <select 
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
          >
            <option value="ALL">Tất cả kho bãi ({warehouses.length})</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.tenKho}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Bảng Dữ Liệu Tồn Kho Tinh Gọn */}
      <div className="inv-table-card">
        <table className="inv-data-table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>Mã SKU</th>
              <th>Tên Hàng Hóa & ĐVT</th>
              <th>Vị Trí Kho Lưu Trữ</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Tồn Thực Tế</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Khả Dụng</th>
              <th style={{ textAlign: 'center', width: '110px' }}>Ngưỡng T.Thiểu</th>
              <th style={{ textAlign: 'center', width: '140px' }}>Trạng Thái Kệ</th>
              <th style={{ textAlign: 'right', width: '110px' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" className="empty-cell">
                  <FiRefreshCw className="spin-icon" size={20} />
                  <p>Đang tải dữ liệu tồn kho...</p>
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-cell">
                  <FiBox size={32} style={{ opacity: 0.4 }} />
                  <p>Không tìm thấy mặt hàng nào phù hợp với bộ lọc.</p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isOutOfStock = item.soLuongThucTe <= 0;
                const isUnderMin = !isOutOfStock && item.soLuongThucTe <= item.soLuongCanhBao;
                const isOverMax = item.soLuongThucTe >= item.soLuongToiDa;

                return (
                  <tr key={item.id} className={isOutOfStock ? 'row-out' : isUnderMin ? 'row-warn' : ''}>
                    <td>
                      <span className="sku-pill">{item.sku}</span>
                    </td>
                    <td>
                      <div className="product-info-cell">
                        <span className="product-name">{item.tenHangHoa}</span>
                        <span className="product-unit">ĐVT: {item.donViTinh}</span>
                      </div>
                    </td>
                    <td>
                      <div className="warehouse-cell">
                        <FiMapPin size={13} className="wh-icon" />
                        <span>{item.tenKho}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="stock-qty-actual">{item.soLuongThucTe}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="stock-qty-avail">{item.soLuongKhaDung}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="stock-qty-min">{item.soLuongCanhBao}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isOutOfStock ? (
                        <span className="status-badge badge-danger">Hết Hàng</span>
                      ) : isUnderMin ? (
                        <span className="status-badge badge-warning">Cạn Kho (Cần Nhập)</span>
                      ) : isOverMax ? (
                        <span className="status-badge badge-info">Quá Tải Kệ</span>
                      ) : (
                        <span className="status-badge badge-success">Đủ Hàng</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btns">
                        <button 
                          className="btn-icon" 
                          title="Cộng thêm số lượng vào kho này"
                          onClick={() => handleOpenAdjust(item)}
                        >
                          <FiPlus size={15} />
                        </button>
                        <button 
                          className="btn-icon" 
                          title="Xem lịch sử thẻ kho"
                          onClick={() => handleOpenCard(item)}
                        >
                          <FiList size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="inv-table-footer">
          <span>Đang hiển thị <strong>{filteredItems.length}</strong> trên tổng số <strong>{inventoryList.length}</strong> mặt hàng</span>
        </div>
      </div>

      {/* 5. Modal Cộng Thêm Tồn Kho */}
      <Modal 
        isOpen={isAdjustModalOpen} 
        onClose={() => setIsAdjustModalOpen(false)}
        title={selectedStock ? `Nhập Thêm Hàng: ${selectedStock.tenHangHoa}` : "Nhập Hàng Vào Kho"}
      >
        <form onSubmit={handleSubmitAdjust} className="inv-modal-form">
          <div className="form-item">
            <label>Sản Phẩm (*)</label>
            <select 
              value={formData.sanPhamId} 
              onChange={(e) => setFormData(prev => ({ ...prev, sanPhamId: e.target.value }))}
              required
              disabled={!!selectedStock}
            >
              <option value="">-- Chọn sản phẩm --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.tenSanPham || p.tenHangHoa} [{p.sku || `SP${p.id}`}]
                </option>
              ))}
            </select>
          </div>

          <div className="form-item">
            <label>Kho Hàng Lưu Trữ (*)</label>
            <select 
              value={formData.khoHangId} 
              onChange={(e) => setFormData(prev => ({ ...prev, khoHangId: e.target.value }))}
              required
              disabled={!!selectedStock}
            >
              <option value="">-- Chọn kho lưu trữ --</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.tenKho} ({w.maKho})</option>
              ))}
            </select>
          </div>

          <div className="form-item">
            <label>Số Lượng Bổ Sung (*)</label>
            <input 
              type="number" 
              min="1"
              value={formData.soLuong} 
              onChange={(e) => setFormData(prev => ({ ...prev, soLuong: e.target.value }))}
              required
              placeholder="Nhập số lượng..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>
              Hủy Bỏ
            </button>
            <button type="submit" className="btn-primary">
              <FiCheck size={16} /> Lưu Vào Kho
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. Modal Thẻ Kho Chi Tiết */}
      <Modal 
        isOpen={isCardModalOpen} 
        onClose={() => setIsCardModalOpen(false)}
        title={`Thẻ Kho Vật Lý - ${selectedStock?.sku}`}
      >
        <div className="stock-card-modal">
          <div className="stock-meta-box">
            <div>
              <span className="meta-label">Mặt Hàng</span>
              <strong className="meta-val">{selectedStock?.tenHangHoa}</strong>
            </div>
            <div>
              <span className="meta-label">Kho Lưu Trữ</span>
              <strong className="meta-val">{selectedStock?.tenKho}</strong>
            </div>
            <div>
              <span className="meta-label">Tồn Thực Tế</span>
              <span className="meta-val-badge">{selectedStock?.soLuongThucTe} {selectedStock?.donViTinh}</span>
            </div>
            <div>
              <span className="meta-label">Khả Dụng Bán</span>
              <span className="meta-val-badge green">{selectedStock?.soLuongKhaDung} {selectedStock?.donViTinh}</span>
            </div>
          </div>

          <div className="stock-logs-section">
            <h4>Lịch Sử Biến Động Thẻ Kho</h4>
            {isLoadingCards ? (
              <p className="loading-text"><FiRefreshCw className="spin-icon" size={14} /> Đang tải lịch sử thẻ kho...</p>
            ) : stockCards.length === 0 ? (
              <div className="empty-logs">
                <FiList size={22} />
                <p>Chưa có bản ghi biến động xuất/nhập/điều chuyển trực tiếp cho mặt hàng này tại kho.</p>
                <small>Hệ thống tự động ghi thẻ kho mỗi khi xác nhận Phiếu Nhập, Phiếu Xuất hoặc Điều Chuyển.</small>
              </div>
            ) : (
              <div className="logs-table-wrap">
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Thời Gian</th>
                      <th>Loại Giao Dịch</th>
                      <th>Chứng Từ</th>
                      <th style={{ textAlign: 'right' }}>Thay Đổi</th>
                      <th style={{ textAlign: 'right' }}>Tồn Sau</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockCards.map(c => (
                      <tr key={c.id}>
                        <td>{c.ngayTao ? new Date(c.ngayTao).toLocaleString('vi-VN') : '—'}</td>
                        <td>
                          <span className={`log-type ${c.loaiGiaoDich === 'NHAP_KHO' ? 'in' : 'out'}`}>
                            {c.loaiGiaoDich === 'NHAP_KHO' ? <FiArrowDownRight size={12} /> : <FiArrowUpRight size={12} />}
                            {c.loaiGiaoDich}
                          </span>
                        </td>
                        <td>{c.maChungTu || '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {c.loaiGiaoDich === 'NHAP_KHO' ? `+${c.soLuong}` : `-${c.soLuong}`}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{c.tonCuoiKy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryStock;
