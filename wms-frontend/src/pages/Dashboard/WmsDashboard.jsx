/**
 * ==============================================================================
 * Module: WmsDashboard.jsx
 * Mô tả: Màn hình Thống kê Tổng quan Vận hành Kho Bãi (WMS Dashboard).
 * Chức năng: Thống kê số lượng SKU, tồn kho thực tế, số phiếu nhập/xuất và nhật ký hoạt động gần đây.
 * ==============================================================================
 */
import { useState, useEffect } from 'react';
import { 
  FiBox, FiArrowDownLeft, FiArrowUpRight, FiLayers, 
  FiRefreshCw
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './WmsDashboard.css';

const WmsDashboard = () => {
  const [stats, setStats] = useState({
    productsCount: 0,
    totalStockCount: 0,
    importNotesCount: 0,
    exportNotesCount: 0,
    warehousesCount: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      const [prodsRes, invRes, importRes, exportRes, whRes] = await Promise.allSettled([
        wmsCoreService.getProducts(),
        wmsCoreService.getAllInventory(),
        wmsCoreService.getImportNotes(),
        wmsCoreService.getExportNotes(),
        wmsCoreService.getWarehouses(),
      ]);

      const prods = prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value) ? prodsRes.value : [];
      const invs = invRes.status === 'fulfilled' && Array.isArray(invRes.value) ? invRes.value : [];
      const imports = importRes.status === 'fulfilled' && Array.isArray(importRes.value) ? importRes.value : [];
      const exports = exportRes.status === 'fulfilled' && Array.isArray(exportRes.value) ? exportRes.value : [];
      const whs = whRes.status === 'fulfilled' && Array.isArray(whRes.value) ? whRes.value : [];

      setIsBackendConnected(true);

      const totalQty = invs.reduce((sum, item) => sum + (Number(item.soLuongThucTe) || 0), 0);

      setStats({
        productsCount: prods.length,
        totalStockCount: totalQty,
        importNotesCount: imports.length,
        exportNotesCount: exports.length,
        warehousesCount: whs.length,
      });

      // Tạo nhật ký biến động kết hợp từ các phiếu nhập và xuất gần nhất
      const activities = [];
      imports.slice(0, 4).forEach(n => {
        activities.push({
          id: 'PN-' + n.id,
          type: 'IMPORT',
          code: n.maPhieuNhap || `PN-${n.id}`,
          desc: `Nhập kho từ ${n.tenNhaCungCap || 'NCC'}`,
          time: n.ngayNhap ? new Date(n.ngayNhap).toLocaleString('vi-VN') : 'Mới đây',
          status: n.trangThai || 'ĐÃ NHẬP KHO',
        });
      });

      exports.slice(0, 4).forEach(n => {
        activities.push({
          id: 'PX-' + n.id,
          type: 'EXPORT',
          code: n.maPhieuXuat || `PX-${n.id}`,
          desc: `Xuất kho giao cho ${n.tenDonViVanChuyen || 'ĐVVC'}`,
          time: n.ngayXuat ? new Date(n.ngayXuat).toLocaleString('vi-VN') : 'Mới đây',
          status: n.trangThai || 'HOÀN THÀNH',
        });
      });

      setRecentActivities(activities);
    } catch (e) {
      console.warn('Lỗi lấy dữ liệu Dashboard từ Backend:', e.message);
      setIsBackendConnected(false);
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
          <h2>Trung Tâm Điều Hành Kho Bãi & Master Data</h2>
          <p>Giám sát tổng quan tình trạng xuất - nhập, lượng tồn kệ và dữ liệu vật lý toàn chuỗi</p>
        </div>
        <button className="btn-secondary" onClick={fetchDashboardData} disabled={isLoading} title="Làm mới">
          <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
        </button>
      </div>

      {/* Grid thống kê chính */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <FiLayers size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Hàng Hóa (Master SKU)</span>
            <h3 className="stat-value">{stats.productsCount}</h3>
            <span className="stat-meta">Mã mặt hàng trong CSDL</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <FiBox size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Tổng Tồn Kho Kệ</span>
            <h3 className="stat-value">{stats.totalStockCount}</h3>
            <span className="stat-meta">Số lượng vật lý trên các kệ</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <FiArrowDownLeft size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Phiếu Nhập Kho</span>
            <h3 className="stat-value">{stats.importNotesCount}</h3>
            <span className="stat-meta">Chứng từ nhập hàng NCC</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <FiArrowUpRight size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Phiếu Xuất Kho</span>
            <h3 className="stat-value">{stats.exportNotesCount}</h3>
            <span className="stat-meta">Chứng từ bàn giao bưu tá</span>
          </div>
        </div>
      </div>

      {/* Hoạt động gần đây */}
      <div className="dashboard-section" style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Chứng Từ Giao Dịch Gần Đây</h3>
        <div className="table-responsive">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Loại Chứng Từ</th>
                <th>Mã Chứng Từ</th>
                <th>Nghiệp Vụ</th>
                <th>Thời Gian</th>
                <th style={{ textAlign: 'center' }}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Chưa có giao dịch xuất nhập kho nào được tạo.
                  </td>
                </tr>
              ) : (
                recentActivities.map((act) => (
                  <tr key={act.id}>
                    <td>
                      <span className={`stock-badge ${act.type === 'IMPORT' ? 'success' : 'warning'}`}>
                        {act.type === 'IMPORT' ? 'Nhập Kho' : 'Xuất Kho'}
                      </span>
                    </td>
                    <td><strong>{act.code}</strong></td>
                    <td>{act.desc}</td>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>{act.time}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="status-tag active">{act.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WmsDashboard;
