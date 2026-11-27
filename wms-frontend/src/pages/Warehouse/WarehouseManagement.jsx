/**
 * ==============================================================================
 * Module: WarehouseManagement.jsx
 * Phân hệ: Quản Lý Danh Sách Cửa Hàng (Store Management)
 * Mô tả: Đồng bộ 1-1 danh sách cửa hàng từ tài khoản bán hàng (userService),
 *        có dự phòng qua wmsCoreService và chuẩn hóa hiển thị trạng thái.
 * ==============================================================================
 */
import { useState, useEffect } from 'react';
import {
  FiSearch,
  FiRefreshCw,
  FiMapPin,
  FiShoppingBag,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import { userService } from '../../services/userService';
import './WarehouseManagement.css';

// Hàm kiểm tra trạng thái hoạt động linh hoạt cho mọi kiểu dữ liệu Backend trả về
const isStoreActive = (store) => {
  const status = store.trangThai ?? store.status ?? store.isActive;

  // Nếu dữ liệu không có trường trạng thái (null/undefined), mặc định là Hoạt động
  if (status === undefined || status === null) return true;

  if (typeof status === 'boolean') return status;
  if (typeof status === 'number') return status === 1;

  const normalized = String(status).trim().toUpperCase();
  return [
    'HOAT_DONG',
    'HOẠT ĐỘNG',
    'DANG_HOAT_DONG',
    'ACTIVE',
    '1',
    'TRUE',
    'OPEN',
  ].includes(normalized);
};

const WarehouseManagement = () => {
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Hàm nạp danh sách cửa hàng
  const fetchStores = async () => {
    try {
      setIsLoading(true);

      // CÁCH 1 (Ưu tiên): Lấy trực tiếp từ tài khoản bán hàng giống màn hình Admin
      const salesUsers = await userService.getSalesUsers();

      if (Array.isArray(salesUsers) && salesUsers.length > 0) {
        const mappedStores = salesUsers.map((user) => ({
          id: user.id,
          // Tự sinh mã SHOP-01, SHOP-02... nếu tài khoản chưa có trường maKho
          maKho: user.maKho || `SHOP-${String(user.id).padStart(2, '0')}`,
          tenKho: user.hoTen || user.tenCuaHang || user.taiKhoan || 'Cửa hàng chưa đặt tên',
          diaChi:
            user.diaChi ||
            [user.soDienThoai && `SĐT: ${user.soDienThoai}`, user.email]
              .filter(Boolean)
              .join(' • ') ||
            'Chưa cập nhật địa chỉ',
          trangThai: user.trangThai,
        }));

        console.log('[WarehouseManagement] Đã đồng bộ cửa hàng từ tài khoản bán hàng:', mappedStores);
        setStores(mappedStores);
        setIsBackendConnected(true);
        return;
      }

      // CÁCH 2 (Dự phòng): Nếu Cách 1 trả về rỗng, lấy từ bảng Kho của WMS Core
      console.warn('[WarehouseManagement] Không có dữ liệu từ /auth/stores, chuyển sang wmsCoreService...');
      const data = await wmsCoreService.getWarehouses();

      if (Array.isArray(data)) {
        const onlyStores = data.filter((w) => {
          const code = (w.maKho || '').toUpperCase();
          const name = (w.tenKho || '').toUpperCase();

          // Loại bỏ Kho Tổng
          if (code.includes('MAIN') || name.includes('KHO TỔNG') || name.includes('KHO TONG')) {
            return false;
          }
          // Loại bỏ các kho nội bộ không phải cửa hàng
          if (code.startsWith('KHO-') && !name.includes('SHOP') && !name.includes('STORE')) {
            return false;
          }
          return true;
        });

        setStores(onlyStores);
        setIsBackendConnected(true);
      } else {
        setStores([]);
      }
    } catch (e) {
      console.error('[WarehouseManagement] Lỗi lấy danh sách cửa hàng:', e.message);
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Lọc danh sách theo ô tìm kiếm
  const filteredStores = stores.filter((s) => {
    const code = s.maKho || '';
    const name = s.tenKho || '';
    const addr = s.diaChi || '';
    const keyword = searchTerm.toLowerCase();
    return (
      code.toLowerCase().includes(keyword) ||
      name.toLowerCase().includes(keyword) ||
      addr.toLowerCase().includes(keyword)
    );
  });

  // Đếm số lượng cho 3 thẻ thống kê trên cùng
  const activeCount = stores.filter((s) => isStoreActive(s)).length;
  const inactiveCount = stores.length - activeCount;

  return (
    <div className="store-container">
      {/* Header */}
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

      {/* Thẻ Thống Kê Tổng Quan */}
      <div className="store-stats-grid">
        <div className="store-stat-card primary-gradient">
          <div className="stat-content">
            <span className="stat-label">Tổng số cửa hàng</span>
            <div className="stat-value">{stores.length}</div>
          </div>
          <div className="stat-icon-bg white-translucent">
            <FiShoppingBag size={24} />
          </div>
        </div>

        <div className="store-stat-card success-gradient">
          <div className="stat-content">
            <span className="stat-label">Đang hoạt động</span>
            <div className="stat-value">{activeCount}</div>
          </div>
          <div className="stat-icon-bg white-translucent">
            <FiCheckCircle size={24} />
          </div>
        </div>

        <div className="store-stat-card warning-gradient">
          <div className="stat-content">
            <span className="stat-label">Tạm dừng</span>
            <div className="stat-value">{inactiveCount}</div>
          </div>
          <div className="stat-icon-bg white-translucent">
            <FiAlertCircle size={24} />
          </div>
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

      {/* Bảng Hiển Thị Dữ Liệu */}
      <div className="table-card-wrapper">
        <table className="store-table">
          <thead>
            <tr>
              <th style={{ width: '160px' }}>MÃ CỬA HÀNG</th>
              <th>TÊN CỬA HÀNG</th>
              <th>ĐỊA CHỈ / LIÊN HỆ</th>
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
                const isActive = isStoreActive(s);
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
        <span>
          Hiển thị <strong>{filteredStores.length}</strong> cửa hàng
        </span>
      </div>
    </div>
  );
};

export default WarehouseManagement;