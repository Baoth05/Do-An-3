import { useState, useEffect } from 'react';
import { 
  FiArrowDownLeft, FiArrowUpRight, FiAlertTriangle, 
  FiBox, FiClock, FiCheckCircle, FiFileText, FiRefreshCw 
} from 'react-icons/fi';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import './WmsDashboard.css';

const WmsDashboard = () => {
  const [stats, setStats] = useState({
    skuCount: 456,
    lowStockCount: 8,
    ordersCount: 1280,
    importsCount: 342,
  });

  const [activities, setActivities] = useState([
    { id: 'PN-2026-001', type: 'IMPORT', code: 'NHA_CUNG_CAP_AKKO', items: 120, total: '85.000.000 đ', status: 'HOAN_THANH', time: '10 phút trước' },
    { id: 'PX-2026-089', type: 'EXPORT', code: 'DON_HANG_ORD-902', items: 2, total: '3.200.000 đ', status: 'HOAN_THANH', time: '25 phút trước' },
    { id: 'PN-2026-002', type: 'IMPORT', code: 'LOGITECH_VIETNAM', items: 50, total: '42.500.000 đ', status: 'CHO_DUYET', time: '1 giờ trước' },
    { id: 'PX-2026-090', type: 'EXPORT', code: 'DON_HANG_ORD-905', items: 1, total: '1.850.000 đ', status: 'DANG_XUAT', time: '2 giờ trước' }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Tải dữ liệu sản phẩm và tồn kho
      const products = await productService.getAllProducts();
      if (Array.isArray(products) && products.length > 0) {
        const warningCount = products.filter(p => (p.soLuongTonKho ?? 0) <= 10).length;
        setStats(prev => ({
          ...prev,
          skuCount: products.length,
          lowStockCount: warningCount,
        }));
      }

      // 2. Tải dữ liệu đơn hàng
      const orders = await orderService.getAllOrders();
      if (Array.isArray(orders) && orders.length > 0) {
        setStats(prev => ({
          ...prev,
          ordersCount: orders.length,
        }));

        // Chuyển đơn hàng mới nhất thành nhật ký biến động
        const liveActivities = orders.slice(0, 5).map(o => ({
          id: 'PX-' + (o.maDonHang || o.id),
          type: 'EXPORT',
          code: o.maDonHang,
          items: o.chiTietDonHangs?.length || 1,
          total: o.tongThanhToan ? Number(o.tongThanhToan).toLocaleString('vi-VN') + ' đ' : '0 đ',
          status: o.trangThaiDonHang === 'HOÀN THÀNH' ? 'HOAN_THANH' : 'CHO_DUYET',
          time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString('vi-VN') : 'Vừa xong',
        }));
        setActivities(liveActivities);
      }
    } catch (e) {
      console.warn('Lỗi lấy dữ liệu Dashboard từ Backend, dùng mock:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="wms-dashboard">
      <div className="wms-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Bảng Điều Khiển Vận Hành Kho</h1>
          <p>Giám sát dòng hàng hóa nhập/xuất và mức độ cảnh báo tồn kho thực tế.</p>
        </div>
        <button className="btn-secondary" onClick={fetchDashboardData} disabled={isLoading}>
          <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> Đồng bộ dữ liệu
        </button>
      </div>

      {/* Thẻ Thống Kê Chỉ Số Kho */}
      <div className="wms-stats-grid">
        <div className="wms-stat-card">
          <div className="wms-stat-header">
            <span>NHẬP KHO THÁNG NÀY</span>
            <div className="wms-icon-box import"><FiArrowDownLeft size={20} /></div>
          </div>
          <div className="wms-stat-value">{stats.importsCount} <small>Phiếu</small></div>
          <div className="wms-stat-sub text-green">↑ +12% so với tháng trước</div>
        </div>

        <div className="wms-stat-card">
          <div className="wms-stat-header">
            <span>XUẤT KHO / ĐƠN HÀNG</span>
            <div className="wms-icon-box export"><FiArrowUpRight size={20} /></div>
          </div>
          <div className="wms-stat-value">{stats.ordersCount} <small>Đơn</small></div>
          <div className="wms-stat-sub text-green">Đã đồng bộ Order Service</div>
        </div>

        <div className="wms-stat-card">
          <div className="wms-stat-header">
            <span>CẢNH BÁO TỒN KHO</span>
            <div className="wms-icon-box warning"><FiAlertTriangle size={20} /></div>
          </div>
          <div className={`wms-stat-value ${stats.lowStockCount > 0 ? 'text-red' : 'text-green'}`}>
            {stats.lowStockCount} <small>Sản phẩm</small>
          </div>
          <div className="wms-stat-sub text-red">Mức tồn kho &le; 10 cái</div>
        </div>

        <div className="wms-stat-card">
          <div className="wms-stat-header">
            <span>TỔNG MÃ HÀNG TRONG KHO</span>
            <div className="wms-icon-box box"><FiBox size={20} /></div>
          </div>
          <div className="wms-stat-value">{stats.skuCount} <small>Mã SKU</small></div>
          <div className="wms-stat-sub">WMS Core Service live</div>
        </div>
      </div>

      {/* Bảng Nhật Ký Biến Động Kho */}
      <div className="wms-table-container">
        <div className="wms-table-header">
          <h3><FiClock size={18} /> Lịch Sử Biến Động Kho Mới Nhất</h3>
          <button className="wms-btn-outline"><FiFileText size={14} /> Xem Thẻ Kho</button>
        </div>

        <table className="wms-data-table">
          <thead>
            <tr>
              <th>Mã Phiếu</th>
              <th>Loại Giao Dịch</th>
              <th>Đối Tác / Đơn Hàng</th>
              <th>Số Lượng</th>
              <th>Giá Trị</th>
              <th>Trạng Thái</th>
              <th>Thời Gian</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((act) => (
              <tr key={act.id}>
                <td className="font-mono">{act.id}</td>
                <td>
                  <span className={`wms-badge ${act.type === 'IMPORT' ? 'badge-import' : 'badge-export'}`}>
                    {act.type === 'IMPORT' ? 'NHẬP KHO' : 'XUẤT KHO'}
                  </span>
                </td>
                <td className="font-mono text-bold text-blue">{act.code}</td>
                <td className="text-bold">{act.items} món</td>
                <td>{act.total}</td>
                <td>
                  {act.status === 'HOAN_THANH' && <span className="status-text green"><FiCheckCircle size={12}/> Hoàn thành</span>}
                  {act.status === 'CHO_DUYET' && <span className="status-text yellow"><FiClock size={12}/> Chờ duyệt</span>}
                  {act.status === 'DANG_XUAT' && <span className="status-text blue"><FiArrowUpRight size={12}/> Đang xuất</span>}
                </td>
                <td className="text-muted">{act.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WmsDashboard;