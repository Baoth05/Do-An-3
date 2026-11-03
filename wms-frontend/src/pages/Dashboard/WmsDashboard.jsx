/**
 * ==============================================================================
 * Module: WmsDashboard.jsx
 * Mô tả: Màn hình Thống Kê Xuất / Nhập & Trung Tâm Điều Hành Vận Hành Kho Bãi.
 * Chức năng: 
 *   - Báo cáo tổng hợp số lượng SKU, tồn kho thực tế, giá trị nhập kho và xuất kho.
 *   - Phân tích cân đối luân chuyển dòng hàng (Inflow vs Outflow).
 *   - Bộ lọc và bảng chứng từ giao dịch xuất / nhập thời gian thực.
 *   - Điều hướng nhanh đến chi tiết phiếu nhập / xuất.
 * ==============================================================================
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiBox, FiArrowDownLeft, FiArrowUpRight, FiLayers, 
  FiRefreshCw, FiPlus, FiEye, FiSearch, FiTruck, FiUsers, 
  FiActivity, FiCheckCircle, FiClock, FiFileText, FiTrendingUp
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './WmsDashboard.css';

const WmsDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    productsCount: 0,
    totalStockCount: 0,
    importNotesCount: 0,
    exportNotesCount: 0,
    totalImportValue: 0,
    warehousesCount: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'IMPORT' | 'EXPORT'
  const [searchTerm, setSearchTerm] = useState('');
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
      const totalImportVal = imports.reduce((sum, item) => sum + (Number(item.tongTienNhap) || 0), 0);

      setStats({
        productsCount: prods.length,
        totalStockCount: totalQty,
        importNotesCount: imports.length,
        exportNotesCount: exports.length,
        totalImportValue: totalImportVal,
        warehousesCount: whs.length,
      });

      // Tạo nhật ký biến động kết hợp từ các phiếu nhập và xuất gần nhất
      const activities = [];
      imports.forEach(n => {
        activities.push({
          id: 'import-' + n.id,
          rawId: n.id,
          type: 'IMPORT',
          code: n.maPhieuNhap || `PN-${n.id}`,
          partner: n.tenNhaCungCap || n.nhaCungCap?.tenNhaCungCap || 'Nhà Cung Cấp',
          warehouse: n.tenKhoHang || n.khoHang?.tenKho || 'Kho Hàng',
          value: n.tongTienNhap ? Number(n.tongTienNhap) : null,
          orderRef: null,
          rawDate: n.ngayNhap ? new Date(n.ngayNhap) : new Date(0),
          time: n.ngayNhap ? new Date(n.ngayNhap).toLocaleString('vi-VN') : 'Gần đây',
          status: n.trangThai || 'ĐÃ NHẬP KHO',
        });
      });

      exports.forEach(n => {
        activities.push({
          id: 'export-' + n.id,
          rawId: n.id,
          type: 'EXPORT',
          code: n.maPhieuXuat || `PX-${n.id}`,
          partner: n.tenDonViVanChuyen || n.donViVanChuyen?.tenDonVi || 'Giao Hàng Nhanh',
          warehouse: n.tenKhoHang || n.khoHang?.tenKho || 'Kho Hàng',
          value: null,
          orderRef: n.donHangId ? `Đơn hàng #${n.donHangId}` : 'Xuất bán lẻ sàn TMĐT',
          rawDate: n.ngayXuat ? new Date(n.ngayXuat) : new Date(0),
          time: n.ngayXuat ? new Date(n.ngayXuat).toLocaleString('vi-VN') : 'Gần đây',
          status: n.trangThai || 'HOÀN THÀNH',
        });
      });

      // Sắp xếp giảm dần theo thời gian (chứng từ mới nhất lên đầu)
      activities.sort((a, b) => b.rawDate - a.rawDate);

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

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return Number(amount).toLocaleString('vi-VN') + ' ₫';
  };

  // Tính toán tỷ lệ luân chuyển
  const totalNotes = stats.importNotesCount + stats.exportNotesCount;
  const importPercent = totalNotes > 0 ? Math.round((stats.importNotesCount / totalNotes) * 100) : 50;
  const exportPercent = totalNotes > 0 ? 100 - importPercent : 50;

  // Lọc hoạt động theo Tab và Từ khóa
  const filteredActivities = useMemo(() => {
    return recentActivities.filter(act => {
      const matchTab = activeTab === 'ALL' || act.type === activeTab;
      const search = searchTerm.toLowerCase();
      const matchSearch = 
        act.code.toLowerCase().includes(search) ||
        act.partner.toLowerCase().includes(search) ||
        act.warehouse.toLowerCase().includes(search) ||
        (act.orderRef && act.orderRef.toLowerCase().includes(search));
      return matchTab && matchSearch;
    });
  }, [recentActivities, activeTab, searchTerm]);

  return (
    <div className="wms-dashboard">
      {/* 1. Header Trang Thống Kê & Phím Tắt Nghiệp Vụ */}
      <div className="dashboard-header-bar">
        <div>
          <h1 className="dashboard-title">Thống Kê Xuất / Nhập Kho Bãi</h1>
          <p className="dashboard-subtitle">
            Giám sát thời gian thực lưu chuyển hàng hóa, giá trị nhập xuất và dữ liệu luân chuyển toàn chuỗi
          </p>
        </div>
        <div className="dashboard-actions">
          <button 
            className="btn-secondary" 
            onClick={fetchDashboardData} 
            disabled={isLoading}
            title="Đồng bộ lại số liệu"
          >
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} size={14} /> 
            <span>{isBackendConnected ? 'Backend Live' : 'Đồng bộ'}</span>
          </button>
          <button 
            className="btn-shortcut btn-inflow"
            onClick={() => navigate('/import-notes/create')}
          >
            <FiPlus size={15} /> 
            <span>Lập Phiếu Nhập</span>
          </button>
          <button 
            className="btn-shortcut btn-outflow"
            onClick={() => navigate('/export-notes/create')}
          >
            <FiPlus size={15} /> 
            <span>Lập Phiếu Xuất</span>
          </button>
        </div>
      </div>

      {/* 2. Grid 4 Thẻ KPI Chỉ Số Chính */}
      <div className="dashboard-stats-grid">
        {/* Card 1: Master SKU */}
        <div className="kpi-metric-card blue">
          <div className="metric-header">
            <span className="metric-label">Hàng Hóa (Master SKU)</span>
            <div className="metric-icon-box blue">
              <FiLayers size={20} />
            </div>
          </div>
          <div className="metric-value">{stats.productsCount}</div>
          <div className="metric-footer">
            <span className="footer-highlight">{stats.warehousesCount}</span> kho lưu trữ vật lý
          </div>
        </div>

        {/* Card 2: Tồn Kho Kệ */}
        <div className="kpi-metric-card orange">
          <div className="metric-header">
            <span className="metric-label">Tổng Tồn Kho Kệ</span>
            <div className="metric-icon-box orange">
              <FiBox size={20} />
            </div>
          </div>
          <div className="metric-value">{stats.totalStockCount.toLocaleString('vi-VN')}</div>
          <div className="metric-footer">
            <span className="footer-highlight">Sản phẩm</span> sẵn sàng xuất giao
          </div>
        </div>

        {/* Card 3: Phiếu Nhập Kho */}
        <div className="kpi-metric-card green">
          <div className="metric-header">
            <span className="metric-label">Tổng Nhập Kho (Inflow)</span>
            <div className="metric-icon-box green">
              <FiArrowDownLeft size={20} />
            </div>
          </div>
          <div className="metric-value">{stats.importNotesCount}</div>
          <div className="metric-footer">
            Tổng giá trị: <strong style={{ color: '#047857' }}>{formatCurrency(stats.totalImportValue)}</strong>
          </div>
        </div>

        {/* Card 4: Phiếu Xuất Kho */}
        <div className="kpi-metric-card purple">
          <div className="metric-header">
            <span className="metric-label">Tổng Xuất Kho (Outflow)</span>
            <div className="metric-icon-box purple">
              <FiArrowUpRight size={20} />
            </div>
          </div>
          <div className="metric-value">{stats.exportNotesCount}</div>
          <div className="metric-footer">
            Đã bàn giao các đối tác vận chuyển
          </div>
        </div>
      </div>

      {/* 3. Phân Tích Cân Đối Dòng Hàng Xuất - Nhập */}
      <div className="analytics-banner">
        <div className="banner-left">
          <div className="banner-icon-circle">
            <FiTrendingUp size={22} />
          </div>
          <div className="banner-text">
            <h3>Cân Đối Lưu Chuyển Xuất / Nhập</h3>
            <p>Tỷ lệ tương quan giữa nhập hàng bổ sung và xuất hàng bàn giao cho sàn TMĐT</p>
          </div>
        </div>

        <div className="banner-flow-bar-wrap">
          <div className="flow-legend">
            <span className="legend-item in">
              <span className="dot dot-in"></span> Nhập kho: <strong>{stats.importNotesCount} phiếu ({importPercent}%)</strong>
            </span>
            <span className="legend-item out">
              <span className="dot dot-out"></span> Xuất kho: <strong>{stats.exportNotesCount} phiếu ({exportPercent}%)</strong>
            </span>
          </div>
          <div className="flow-progress-bar">
            <div className="progress-fill in" style={{ width: `${importPercent}%` }}></div>
            <div className="progress-fill out" style={{ width: `${exportPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* 4. Danh Sách Chứng Từ Giao Dịch Xuất / Nhập Gần Đây */}
      <div className="dashboard-table-card">
        {/* Toolbar & Filter Tabs */}
        <div className="dashboard-table-toolbar">
          <div className="tab-pills-group">
            <button 
              className={`tab-pill-btn ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              Tất Cả Chứng Từ ({recentActivities.length})
            </button>
            <button 
              className={`tab-pill-btn tab-in ${activeTab === 'IMPORT' ? 'active' : ''}`}
              onClick={() => setActiveTab('IMPORT')}
            >
              <FiArrowDownLeft size={14} /> Phiếu Nhập ({stats.importNotesCount})
            </button>
            <button 
              className={`tab-pill-btn tab-out ${activeTab === 'EXPORT' ? 'active' : ''}`}
              onClick={() => setActiveTab('EXPORT')}
            >
              <FiArrowUpRight size={14} /> Phiếu Xuất ({stats.exportNotesCount})
            </button>
          </div>

          <div className="table-search-wrap">
            <FiSearch className="search-icon" size={15} />
            <input 
              type="text" 
              placeholder="Tìm mã chứng từ, đối tác, kho..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Bảng Dữ Liệu Chứng Từ */}
        <div className="table-responsive" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table className="wms-data-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Nghiệp Vụ</th>
                <th style={{ width: '150px' }}>Mã Chứng Từ</th>
                <th>Đối Tác / Đơn Vị Giao Nhận</th>
                <th>Kho Lưu Trữ</th>
                <th style={{ textAlign: 'right' }}>Giá Trị / Đơn Hàng</th>
                <th>Thời Gian Lập</th>
                <th style={{ textAlign: 'center', width: '140px' }}>Trạng Thái</th>
                <th style={{ textAlign: 'right', width: '90px' }}>Xem</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="empty-table-cell">
                    <FiRefreshCw className="spin-icon" size={24} style={{ color: '#dc2626' }} />
                    <p>Đang tải dữ liệu chứng từ vận hành...</p>
                  </td>
                </tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table-cell">
                    <FiFileText size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <p>Không có chứng từ giao dịch nào phù hợp với bộ lọc.</p>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => (
                  <tr key={act.id}>
                    <td>
                      <span className={`flow-badge ${act.type === 'IMPORT' ? 'badge-in' : 'badge-out'}`}>
                        {act.type === 'IMPORT' ? (
                          <>
                            <FiArrowDownLeft size={13} />
                            <span>Nhập Kho</span>
                          </>
                        ) : (
                          <>
                            <FiArrowUpRight size={13} />
                            <span>Xuất Kho</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="sku-badge">{act.code}</span>
                    </td>
                    <td>
                      <div className="partner-cell">
                        {act.type === 'IMPORT' ? (
                          <FiUsers size={14} className="partner-icon in" />
                        ) : (
                          <FiTruck size={14} className="partner-icon out" />
                        )}
                        <strong>{act.partner}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="wh-text">{act.warehouse}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {act.type === 'IMPORT' ? (
                        <span className="price-text text-green">
                          {act.value ? formatCurrency(act.value) : '---'}
                        </span>
                      ) : (
                        <span className="order-ref-badge">
                          {act.orderRef}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="time-text">{act.time}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-badge ${act.type === 'IMPORT' ? 'badge-success' : 'badge-info'}`}>
                        <FiCheckCircle size={12} />
                        <span>{act.status}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-icon" 
                        title={`Xem chi tiết ${act.code}`}
                        onClick={() => {
                          if (act.type === 'IMPORT') {
                            navigate(`/import-notes/${act.rawId}`);
                          } else {
                            navigate(`/export-notes/${act.rawId}`);
                          }
                        }}
                      >
                        <FiEye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer bảng */}
        <div className="dashboard-table-footer">
          <span>Hiển thị <strong>{filteredActivities.length}</strong> / <strong>{recentActivities.length}</strong> chứng từ gần nhất</span>
        </div>
      </div>
    </div>
  );
};

export default WmsDashboard;
