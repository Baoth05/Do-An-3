import React from 'react';
import { 
  FiArrowDownLeft, FiArrowUpRight, FiAlertTriangle, 
  FiBox, FiClock, FiCheckCircle, FiFileText 
} from 'react-icons/fi';
import './WmsDashboard.css';

const WmsDashboard = () => {
  // Dữ liệu mô phỏng theo chuẩn ERD wms_core_db
  const recentActivities = [
    { id: 'PN-2026-001', type: 'IMPORT', code: 'NHA_CUNG_CAP_AKKO', items: 120, total: '85.000.000 đ', status: 'HOAN_THANH', time: '10 phút trước' },
    { id: 'PX-2026-089', type: 'EXPORT', code: 'DON_HANG_ORD-902', items: 2, total: '3.200.000 đ', status: 'HOAN_THANH', time: '25 phút trước' },
    { id: 'PN-2026-002', type: 'IMPORT', code: 'LOGITECH_VIETNAM', items: 50, total: '42.500.000 đ', status: 'CHO_DUYET', time: '1 giờ trước' },
    { id: 'PX-2026-090', type: 'EXPORT', code: 'DON_HANG_ORD-905', items: 1, total: '1.850.000 đ', status: 'DANG_XUAT', time: '2 giờ trước' }
  ];

  return (
    <div className="wms-dashboard">
      <div className="wms-dashboard-header">
        <div>
          <h1>Bảng Điều Khiển Vận Hành Kho</h1>
          <p>Giám sát dòng hàng hóa nhập/xuất và mức độ cảnh báo tồn kho thực tế.</p>
        </div>
      </div>

      {/* Thẻ Thống Kê Chỉ Số Kho */}
      <div className="wms-stats-grid">
        <div className="wms-stat-card">
          <div className="wms-stat-header">
            <span>NHẬP KHO THÁNG NÀY</span>
            <div className="wms-icon-box import"><FiArrowDownLeft size={20} /></div>
          </div>
          <div className="wms-stat-value">342 <small>Phiếu</small></div>
          <div className="wms-stat-sub text-green">↑ +12% so với tháng trước</div>
        </div>

        <div className="wms-stat-card">
          <div className="wms-stat-header">
            <span>XUẤT KHO THÁNG NÀY</span>
            <div className="wms-icon-box export"><FiArrowUpRight size={20} /></div>
          </div>
          <div className="wms-stat-value">1,280 <small>Phiếu</small></div>
          <div className="wms-stat-sub text-green">↑ +18% tăng trưởng đơn hàng</div>
        </div>

        <div className="wms-stat-card">
          <div className="wms-stat-header">
            <span>CẢNH BÁO TỒN KHO</span>
            <div className="wms-icon-box warning"><FiAlertTriangle size={20} /></div>
          </div>
          <div className="wms-stat-value text-red">8 <small>Sản phẩm</small></div>
          <div className="wms-stat-sub text-red">Cần tạo phiếu nhập bổ sung</div>
        </div>

        <div className="wms-stat-card">
          <div className="wms-stat-header">
            <span>TỔNG MÃ HÀNG TRONG KHO</span>
            <div className="wms-icon-box box"><FiBox size={20} /></div>
          </div>
          <div className="wms-stat-value">456 <small>Mã SKU</small></div>
          <div className="wms-stat-sub">Đã đồng bộ Redis Cache</div>
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
            {recentActivities.map((act) => (
              <tr key={act.id}>
                <td className="font-mono">{act.id}</td>
                <td>
                  <span className={`wms-badge ${act.type === 'IMPORT' ? 'badge-import' : 'badge-export'}`}>
                    {act.type === 'IMPORT' ? 'NHẬP KHO' : 'XUẤT KHO'}
                  </span>
                </td>
                <td>{act.code}</td>
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