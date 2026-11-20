/**
 * ==============================================================================
 * Module: WarehouseManagement.jsx
 * Phân hệ: Quản Lý Danh Sách Cửa Hàng (Store Management)
 * Mô tả: Giao diện quản lý các chi nhánh cửa hàng kết nối Backend WMS Core.
 * ==============================================================================
 */
import { useState, useEffect } from 'react';
import { 
  FiSearch, FiRefreshCw, 
  FiMapPin, FiShoppingBag, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './WarehouseManagement.css';

const WarehouseManagement = () => {
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Hàm nạp danh sách và lọc chỉ lấy CỬA HÀNG
  const fetchStores = async () => {
    try {
      setIsLoading(true);
      const data = await wmsCoreService.getWarehouses();
      
      if (Array.isArray(data)) {
        const onlyStores = data.filter(w => {
          const code = (w.maKho || '').toUpperCase();
          const name = (w.tenKho || '').toUpperCase();
          
          // 1. Loại bỏ Kho Tổng: ẩn nếu mã chứa chữ "MAIN" hoặc tên chứa chữ "KHO TỔNG"
          if (code.includes('MAIN') || name.includes('KHO TỔNG') || name.includes('KHO TONG')) {
            return false;
          }
          
          // 2. Điều kiện cũ: loại bỏ các kho nội bộ (mã KHO-) nếu không phải là SHOP/STORE
          if (code.startsWith('KHO-') && !name.includes('SHOP') && !name.includes('STORE')) {
            return false;
          }
          
          // Giữ lại các cửa hàng hợp lệ
          return true;
        });
        // THÊM DÒNG NÀY ĐỂ KIỂM TRA DỮ LIỆU TỪ BACKEND
        console.log("Dữ liệu cửa hàng sau khi lọc:", onlyStores);

        setStores(onlyStores);
        setIsBackendConnected(true);
      } else {
        setStores([]);
      }
    } catch (e) {
      console.warn('Lỗi lấy danh sách cửa hàng từ Backend:', e.message);
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Lọc danh sách theo từ khóa tìm kiếm
  const filteredStores = stores.filter(s => {
    const code = s.maKho || '';
    const name = s.tenKho || '';
    const addr = s.diaChi || '';
    return code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           addr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Tính toán số liệu thống kê
  const activeCount = stores.filter(s => s.trangThai === 'HOAT_DONG').length;
  const inactiveCount = stores.length - activeCount;

  return (
    <div className="store-container">
      {/* Header Chuyên Nghiệp */}
      <div className="store-header">
        <div>
          <h2>Quản Lý Danh Sách Cửa Hàng</h2>
          <p>Mạng lưới các chi nhánh cửa hàng bán hàng trực thuộc hệ thống</p>
        </div>
        
        <div className="store-actions-top">
          <button className="btn-secondary-live" onClick={fetchStores} disabled={isLoading}>
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} size={15} /> 
            {isBackendConnected ? 'Đã kết nối Backend' : 'Đồng bộ'}
          </button>
        </div>
      </div>

      {/* Thẻ Thống Kê Tổng Quan UI Nâng Cấp */}
      <div className="store-stats-grid">
        <div className="store-stat-card primary-gradient">
          <div className="stat-content">
            <span className="stat-label">Tổng số cửa hàng</span>
            <div className="stat-value">{stores.length}</div>
          </div>
          <div className="stat-icon-bg white-translucent"><FiShoppingBag size={24} /></div>
        </div>

        <div className="store-stat-card success-gradient">
          <div className="stat-content">
            <span className="stat-label">Đang hoạt động</span>
            <div className="stat-value">{activeCount}</div>
          </div>
          <div className="stat-icon-bg white-translucent"><FiCheckCircle size={24} /></div>
        </div>

        <div className="store-stat-card warning-gradient">
          <div className="stat-content">
            <span className="stat-label">Tạm dừng</span>
            <div className="stat-value">{inactiveCount}</div>
          </div>
          <div className="stat-icon-bg white-translucent"><FiAlertCircle size={24} /></div>
        </div>
      </div>

      {/* Thanh Tìm Kiếm */}
      <div className="store-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" size={16} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo mã, tên hoặc địa chỉ cửa hàng..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bảng Hiển Thị Dữ Liệu Nâng Cấp UI */}
      <div className="table-card-wrapper">
        <table className="store-table">
          <thead>
            <tr>
              <th style={{ width: '160px' }}>MÃ CỬA HÀNG</th>
              <th>TÊN CỬA HÀNG</th>
              <th>ĐỊA CHỈ</th>
              <th style={{ textAlign: 'center', width: '150px' }}>TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <FiRefreshCw className="spin-icon" size={28} style={{ color: '#3b82f6', marginBottom: '12px' }} />
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Đang đồng bộ dữ liệu cửa hàng...</p>
                </td>
              </tr>
            ) : filteredStores.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <FiShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: '15px' }}>Không tìm thấy cửa hàng nào phù hợp.</p>
                </td>
              </tr>
            ) : (
              filteredStores.map((s) => {
                const isActive = s.trangThai === 'HOAT_DONG';
                return (
                  <tr key={s.id}>
                    <td>
                      <span className="store-code-badge">{s.maKho}</span>
                    </td>
                    <td>
                      <strong className="store-name-text">{s.tenKho}</strong>
                    </td>
                    <td>
                      <span className="store-address-flex">
                        <FiMapPin size={15} style={{ color: '#ef4444', flexShrink: 0 }} /> 
                        {s.diaChi || 'Chưa cập nhật địa chỉ'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-badge-pill ${isActive ? 'active' : 'inactive'}`}>
                        <span className={`status-dot ${isActive ? 'green' : 'gray'}`}></span>
                        {isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="store-footer">
        <span>Hiển thị <strong>{filteredStores.length}</strong> cửa hàng</span>
      </div>
    </div>
  );
};

export default WarehouseManagement;