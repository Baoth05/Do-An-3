/**
 * ==============================================================================
 * Module: WmsDashboard.jsx
 * Mô tả: Màn hình Thống Kê WMS - Nâng cấp UI & Tích hợp Biểu đồ.
 * ==============================================================================
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiBox, FiArrowDownLeft, FiArrowUpRight, FiLayers, 
  FiRefreshCw, FiEye, FiSearch, FiTruck, FiUsers, 
  FiActivity, FiPieChart 
} from 'react-icons/fi';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
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
  const [chartData, setChartData] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      // 1. Chuẩn bị dữ liệu cho Bảng giao dịch
      const activities = [];
      imports.forEach(n => {
        activities.push({
          id: 'import-' + n.id,
          rawId: n.id,
          type: 'IMPORT',
          code: n.maPhieuNhap || `PN-${n.id}`,
          partner: n.tenNhaCungCap || 'Nhà Cung Cấp',
          warehouse: n.tenKhoHang || 'Kho Hàng',
          value: n.tongTienNhap ? Number(n.tongTienNhap) : 0,
          orderRef: null,
          rawDate: n.ngayNhap ? new Date(n.ngayNhap) : new Date(0),
          time: n.ngayNhap ? new Date(n.ngayNhap).toLocaleDateString('vi-VN') : 'Gần đây',
          status: n.trangThai || 'HOÀN THÀNH',
        });
      });

      exports.forEach(n => {
        activities.push({
          id: 'export-' + n.id,
          rawId: n.id,
          type: 'EXPORT',
          code: n.maPhieuXuat || `PX-${n.id}`,
          partner: n.tenDonViVanChuyen || 'Giao Hàng',
          warehouse: n.tenKhoHang || 'Kho Hàng',
          value: 0,
          orderRef: n.donHangId ? `Đơn #${n.donHangId}` : 'Khách lẻ',
          rawDate: n.ngayXuat ? new Date(n.ngayXuat) : new Date(0),
          time: n.ngayXuat ? new Date(n.ngayXuat).toLocaleDateString('vi-VN') : 'Gần đây',
          status: n.trangThai || 'HOÀN THÀNH',
        });
      });
      activities.sort((a, b) => b.rawDate - a.rawDate);
      setRecentActivities(activities);

      // 2. Phân tích dữ liệu Biểu đồ theo Ngày (Gộp Nhập/Xuất)
      const dateMap = {};
      activities.forEach(act => {
        const dateKey = act.time;
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = { date: dateKey, import: 0, export: 0 };
        }
        if (act.type === 'IMPORT') dateMap[dateKey].import += 1;
        if (act.type === 'EXPORT') dateMap[dateKey].export += 1;
      });
      
      const sortedChartData = Object.values(dateMap).slice(0, 7).reverse();
      setChartData(sortedChartData);

    } catch (e) {
      console.warn('Lỗi lấy dữ liệu Dashboard:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => Number(amount || 0).toLocaleString('vi-VN') + ' ₫';

  const totalNotes = stats.importNotesCount + stats.exportNotesCount;
  const importPercent = totalNotes > 0 ? Math.round((stats.importNotesCount / totalNotes) * 100) : 50;
  const exportPercent = totalNotes > 0 ? 100 - importPercent : 50;

  const filteredActivities = useMemo(() => {
    return recentActivities.filter(act => {
      const matchTab = activeTab === 'ALL' || act.type === activeTab;
      const search = searchTerm.toLowerCase();
      const matchSearch = act.code.toLowerCase().includes(search) || act.partner.toLowerCase().includes(search);
      return matchTab && matchSearch;
    });
  }, [recentActivities, activeTab, searchTerm]);

  const getStatusPill = (status, type) => {
    const s = status.toUpperCase();
    if (s.includes('HỦY') || s.includes('TỪ CHỐI')) return <span className="status-pill danger">{status}</span>;
    if (s.includes('CHỜ')) return <span className="status-pill warning">{status}</span>;
    if (type === 'IMPORT') return <span className="status-pill success">{status}</span>;
    return <span className="status-pill info">{status}</span>;
  };

  return (
    <div className="wms-dashboard">
      {/* 1. Header */}
      <div className="dashboard-header-bar">
        <div>
          <h1 className="dashboard-title">Bảng Điều Khiển WMS</h1>
          <p className="dashboard-subtitle">Giám sát tổng quan vật tư, tồn kho và luân chuyển hàng hóa</p>
        </div>
        <div className="dashboard-actions">
          {/* Đã xóa nút Nhập/Xuất, chỉ giữ lại nút Đồng bộ */}
          <button className="btn-shortcut" onClick={fetchDashboardData} style={{ background: '#f1f5f9', color: '#334155' }}>
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> Đồng bộ
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="dashboard-stats-grid">
        <div className="kpi-metric-card">
          <div className="metric-header">
            <span className="metric-label">Mã Vật Tư (SKU)</span>
            <div className="metric-icon-box blue"><FiLayers size={22} /></div>
          </div>
          <div className="metric-value">{stats.productsCount}</div>
          <div className="metric-footer">Quản lý trên <strong>{stats.warehousesCount}</strong> kho</div>
        </div>

        <div className="kpi-metric-card">
          <div className="metric-header">
            <span className="metric-label">Tồn Kho Khả Dụng</span>
            <div className="metric-icon-box orange"><FiBox size={22} /></div>
          </div>
          <div className="metric-value">{stats.totalStockCount.toLocaleString('vi-VN')}</div>
          <div className="metric-footer">Sản phẩm sẵn sàng giao dịch</div>
        </div>

        <div className="kpi-metric-card">
          <div className="metric-header">
            <span className="metric-label">Chứng Từ Nhập Kho</span>
            <div className="metric-icon-box green"><FiArrowDownLeft size={22} /></div>
          </div>
          <div className="metric-value">{stats.importNotesCount}</div>
          <div className="metric-footer">Giá trị: <strong>{formatCurrency(stats.totalImportValue)}</strong></div>
        </div>

        <div className="kpi-metric-card">
          <div className="metric-header">
            <span className="metric-label">Yêu Cầu Xuất Kho</span>
            <div className="metric-icon-box purple"><FiArrowUpRight size={22} /></div>
          </div>
          <div className="metric-value">{stats.exportNotesCount}</div>
          <div className="metric-footer">Chứng từ vận hành bàn giao</div>
        </div>
      </div>

      {/* 3. Charts & Analytics */}
      <div className="dashboard-reports-layout">
        <div className="chart-card">
          <h3 className="card-title"><FiActivity /> Biến Động Nhập / Xuất Kho (7 Ngày)</h3>
          <div style={{ width: '100%', height: 250 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorImport" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExport" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" name="Nhập Kho" dataKey="import" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorImport)" />
                  <Area type="monotone" name="Xuất Kho" dataKey="export" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorExport)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Chưa có dữ liệu giao dịch</div>
            )}
          </div>
        </div>

        <div className="analytics-banner">
          <h3 className="card-title"><FiPieChart /> Tỷ Trọng Giao Dịch</h3>
          <div className="flow-legend">
            <div className="legend-item">
              <span style={{ color: '#10b981', fontWeight: 600 }}>● Nhập Kho</span>
              <strong>{stats.importNotesCount} ({importPercent}%)</strong>
            </div>
            <div className="legend-item">
              <span style={{ color: '#3b82f6', fontWeight: 600 }}>● Xuất Kho</span>
              <strong>{stats.exportNotesCount} ({exportPercent}%)</strong>
            </div>
          </div>
          <div className="flow-progress-bar">
            <div className="progress-fill in" style={{ width: `${importPercent}%` }}></div>
            <div className="progress-fill out" style={{ width: `${exportPercent}%` }}></div>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: '16px', lineHeight: 1.5 }}>
            Tỷ lệ so sánh khối lượng nghiệp vụ kho giữa quy trình bổ sung hàng hóa và quy trình thực thi xuất bán đơn hàng.
          </p>
        </div>
      </div>

      {/* 4. Data Table */}
      <div className="dashboard-table-card">
        <div className="dashboard-table-toolbar">
          <div className="tab-pills-group">
            <button className={`tab-pill-btn ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>Tất Cả ({recentActivities.length})</button>
            <button className={`tab-pill-btn tab-in ${activeTab === 'IMPORT' ? 'active' : ''}`} onClick={() => setActiveTab('IMPORT')}>Phiếu Nhập</button>
            <button className={`tab-pill-btn tab-out ${activeTab === 'EXPORT' ? 'active' : ''}`} onClick={() => setActiveTab('EXPORT')}>Phiếu Xuất</button>
          </div>
          <div className="table-search-wrap">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Tìm mã chứng từ, đối tác..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="wms-data-table">
            <thead>
              <tr>
                <th>Nghiệp Vụ</th>
                <th>Mã Chứng Từ</th>
                <th>Đối Tác / Giao Nhận</th>
                <th>Thời Gian</th>
                <th style={{ textAlign: 'center' }}>Trạng Thái</th>
                <th style={{ textAlign: 'center' }}>Xem</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.slice(0, 10).map((act) => (
                <tr key={act.id}>
                  <td>
                    <span style={{ color: act.type === 'IMPORT' ? '#10b981' : '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {act.type === 'IMPORT' ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                      {act.type === 'IMPORT' ? 'Nhập Kho' : 'Xuất Kho'}
                    </span>
                  </td>
                  <td><strong>{act.code}</strong></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {act.type === 'IMPORT' ? <FiUsers color="#64748b"/> : <FiTruck color="#64748b" />}
                      {act.partner}
                    </div>
                  </td>
                  <td style={{ color: '#64748b' }}>{act.time}</td>
                  <td style={{ textAlign: 'center' }}>{getStatusPill(act.status, act.type)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                      onClick={() => navigate(act.type === 'IMPORT' ? `/import-notes/${act.rawId}` : `/export-notes/${act.rawId}`)}
                    >
                      <FiEye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WmsDashboard;