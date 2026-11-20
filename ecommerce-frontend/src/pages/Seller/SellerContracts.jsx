// src/pages/Seller/SellerContracts.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link, useNavigate, useLocation } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { 
  FiFileText, FiPlus, FiCheckCircle, FiShield, 
  FiPackage, FiTruck, FiArrowRight, FiClock, FiAlertCircle, FiRefreshCw, FiCheck
} from 'react-icons/fi';
import './SellerContracts.css';

const SellerContracts = () => {
  const { storeId, currentStore, currentSeller } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [alertNotice, setAlertNotice] = useState(
    location.state?.message || 
    (location.state?.justRegistered ? `Chào mừng ${location.state?.storeName || 'Cửa hàng'}! Vui lòng lập yêu cầu cung ứng để nhập hàng về kho.` : '')
  );

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const data = await marketplaceService.getStoreContracts(storeId);
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải danh sách hợp đồng:', err);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchContracts();
    }
    const handleUpdate = () => fetchContracts();
    window.addEventListener('supply-contracts-updated', handleUpdate);
    return () => window.removeEventListener('supply-contracts-updated', handleUpdate);
  }, [storeId]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    return {
      total: contracts.length,
      pendingAdmin: contracts.filter((c) => c.trangThai === 'CHO_ADMIN_DUYET').length,
      needSign: contracts.filter((c) => c.trangThai === 'CHO_SHOP_KY').length,
      shipping: contracts.filter((c) => c.trangThai === 'DANG_GIAO_HANG').length,
      completed: contracts.filter((c) => c.trangThai === 'HOAN_THANH').length,
    };
  }, [contracts]);

  // Bộ lọc
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      // Lọc theo tab trạng thái
      let matchTab = true;
      if (activeTab === 'PENDING') matchTab = c.trangThai === 'CHO_ADMIN_DUYET';
      else if (activeTab === 'NEED_SIGN') matchTab = c.trangThai === 'CHO_SHOP_KY';
      else if (activeTab === 'SHIPPING') matchTab = c.trangThai === 'DANG_GIAO_HANG';
      else if (activeTab === 'COMPLETED') matchTab = c.trangThai === 'HOAN_THANH';

      // Lọc theo từ khóa tìm kiếm
      const matchSearch = !searchTerm.trim() || 
        (c.maHopDong || '').toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (c.khoCungUng || '').toLowerCase().includes(searchTerm.toLowerCase().trim());

      return matchTab && matchSearch;
    });
  }, [contracts, activeTab, searchTerm]);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'CHO_ADMIN_DUYET':
        return <span className="contract-badge amber"><FiClock size={12} /> Chờ Admin duyệt V1</span>;
      case 'CHO_SHOP_KY':
        return <span className="contract-badge blue"><FiShield size={12} /> Chờ Shop ký số</span>;
      case 'DA_KY_CHO_DUYET_KHO':
        return <span className="contract-badge purple"><FiCheckCircle size={12} /> Đã ký • Chờ duyệt kho</span>;
      case 'DA_DUYET_CHO_XUAT_KHO':
        return <span className="contract-badge teal"><FiTruck size={12} /> Đã duyệt • Chờ xuất kho</span>;
      case 'DANG_GIAO_HANG':
        return <span className="contract-badge orange"><FiTruck size={12} /> Đang giao hàng</span>;
      case 'HOAN_THANH':
        return <span className="contract-badge green"><FiCheck size={12} /> Đã hoàn tất</span>;
      case 'TU_CHOI':
        return <span className="contract-badge red"><FiAlertCircle size={12} /> Từ chối</span>;
      default:
        return <span className="contract-badge gray">{status}</span>;
    }
  };

  return (
    <div className="seller-contracts-dashboard">
      {/* Top Header */}
      <div className="contracts-dashboard-header">
        <div>
          <h1>Hợp Đồng Cung Ứng & Nhập Hàng</h1>
          <p>Quy trình điều chuyển hàng hóa 6 bước từ Kho Tổng Trung Tâm về Gian Hàng của bạn</p>
        </div>

        <div className="header-actions-group">
          <button 
            type="button" 
            className="btn-refresh-data"
            onClick={fetchContracts} 
            disabled={loading}
            title="Tải lại danh sách"
          >
            <FiRefreshCw className={loading ? 'spin-icon' : ''} size={15} /> Làm mới
          </button>

          <Link to="/seller/contracts/create" className="btn-create-contract-primary">
            <FiPlus size={18} /> Lập Yêu Cầu Nhập Hàng Mới
          </Link>
        </div>
      </div>

      {/* Thông báo điều hướng */}
      {alertNotice && (
        <div className="contracts-dashboard-alert">
          <FiCheckCircle size={18} />
          <span>{alertNotice}</span>
          <button type="button" className="close-alert-btn" onClick={() => setAlertNotice('')}>✕</button>
        </div>
      )}

      {/* Thẻ Thống Kê Nhanh (Stats Cards) */}
      <div className="contracts-stats-grid">
        <div className="c-stat-card" onClick={() => setActiveTab('ALL')}>
          <div className="c-stat-icon blue"><FiFileText size={20} /></div>
          <div className="c-stat-info">
            <span className="c-stat-label">Tổng hợp đồng</span>
            <strong className="c-stat-value">{stats.total}</strong>
          </div>
        </div>

        <div className="c-stat-card" onClick={() => setActiveTab('PENDING')}>
          <div className="c-stat-icon amber"><FiClock size={20} /></div>
          <div className="c-stat-info">
            <span className="c-stat-label">Chờ duyệt Vòng 1</span>
            <strong className="c-stat-value">{stats.pendingAdmin}</strong>
          </div>
        </div>

        <div className="c-stat-card highlight-card" onClick={() => setActiveTab('NEED_SIGN')}>
          <div className="c-stat-icon purple"><FiShield size={20} /></div>
          <div className="c-stat-info">
            <span className="c-stat-label">Cần Shop Ký Số</span>
            <strong className="c-stat-value text-purple">{stats.needSign}</strong>
          </div>
        </div>

        <div className="c-stat-card" onClick={() => setActiveTab('SHIPPING')}>
          <div className="c-stat-icon orange"><FiTruck size={20} /></div>
          <div className="c-stat-info">
            <span className="c-stat-label">Đang giao đến kho</span>
            <strong className="c-stat-value">{stats.shipping}</strong>
          </div>
        </div>

        <div className="c-stat-card" onClick={() => setActiveTab('COMPLETED')}>
          <div className="c-stat-icon green"><FiCheckCircle size={20} /></div>
          <div className="c-stat-info">
            <span className="c-stat-label">Đã hoàn tất nhập kho</span>
            <strong className="c-stat-value">{stats.completed}</strong>
          </div>
        </div>
      </div>

      {/* Bảng Dữ Liệu Hợp Đồng */}
      <div className="contracts-table-card">
        {/* Navigation Tabs & Search */}
        <div className="table-controls-bar">
          <div className="status-tabs-group">
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              Tất cả ({stats.total})
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
              onClick={() => setActiveTab('PENDING')}
            >
              Chờ Admin duyệt ({stats.pendingAdmin})
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'NEED_SIGN' ? 'active' : ''}`}
              onClick={() => setActiveTab('NEED_SIGN')}
            >
              Cần Ký Số ({stats.needSign})
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'SHIPPING' ? 'active' : ''}`}
              onClick={() => setActiveTab('SHIPPING')}
            >
              Đang giao ({stats.shipping})
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setActiveTab('COMPLETED')}
            >
              Hoàn tất ({stats.completed})
            </button>
          </div>

          <div className="table-search-input">
            <input 
              type="text" 
              placeholder="Tìm theo mã hợp đồng, kho cung ứng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="contracts-loading-state">
            <div className="spinner"></div>
            <p>Đang tải danh sách hợp đồng cung ứng...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="contracts-empty-state">
            <FiPackage size={44} color="#94a3b8" />
            <h3>Chưa có hợp đồng nào</h3>
            <p>Bạn chưa có yêu cầu nhập hàng nào trong phân mục này.</p>
            <Link to="/seller/contracts/create" className="btn-create-now">
              <FiPlus /> Lập Yêu Cầu Nhập Hàng Ngay
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="contracts-main-table">
              <thead>
                <tr>
                  <th>Mã Hợp Đồng</th>
                  <th>Kho Cung Ứng</th>
                  <th>Ngày Lập</th>
                  <th style={{ textAlign: 'center' }}>Số Mặt Hàng</th>
                  <th style={{ textAlign: 'right' }}>Tổng Giá Trị (Sỉ)</th>
                  <th>Trạng Thái Tiến Độ</th>
                  <th style={{ textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/seller/contracts/${c.id}`} className="contract-code-link">
                        <FiFileText size={15} />
                        <strong>{c.maHopDong}</strong>
                      </Link>
                    </td>
                    <td>
                      <span className="warehouse-name">{c.khoCungUng || 'Kho Tổng Trung Tâm'}</span>
                    </td>
                    <td>
                      <span className="date-text">
                        {new Date(c.ngayTao).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="items-qty-pill">
                        {c.tongSoLuongHang || (c.danhSachHang || []).reduce((s, i) => s + (i.soLuong || 0), 0)} cái 
                        <small> ({c.soLuongMatHang || (c.danhSachHang || []).length} mục)</small>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <strong className="contract-amount">
                        {(c.tongTien || 0).toLocaleString('vi-VN')} đ
                      </strong>
                    </td>
                    <td>
                      {renderStatusBadge(c.trangThai)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-cell-btns">
                        {c.trangThai === 'CHO_SHOP_KY' ? (
                          <Link to={`/seller/contracts/${c.id}`} className="btn-quick-action sign">
                            Ký số ngay <FiArrowRight size={13} />
                          </Link>
                        ) : c.trangThai === 'DANG_GIAO_HANG' ? (
                          <Link to={`/seller/contracts/${c.id}`} className="btn-quick-action receive">
                            Nhận hàng <FiArrowRight size={13} />
                          </Link>
                        ) : (
                          <Link to={`/seller/contracts/${c.id}`} className="btn-quick-action detail">
                            Xem tiến độ <FiArrowRight size={13} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerContracts;
