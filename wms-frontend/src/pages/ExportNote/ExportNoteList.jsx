/**
 * ==============================================================================
 * Module: ExportNoteList.jsx
 * Mô tả: Giao diện Quản lý Yêu Cầu/Phiếu Xuất Kho (WMS Fulfillment) - Nâng cấp UI.
 * ==============================================================================
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiPlus, FiEye, FiTruck, FiRefreshCw, 
  FiFileText, FiShoppingBag, FiCheckCircle, FiClock,
  FiXCircle 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ExportNoteList.css';

const ExportNoteList = () => {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const exportRes = await wmsCoreService.getExportNotes();
      if (Array.isArray(exportRes)) {
        setNotes(exportRes);
        setIsBackendConnected(true);
      } else {
        setNotes([]);
      }
    } catch (e) {
      console.warn('Lỗi lấy dữ liệu từ Backend:', e.message);
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredNotes = notes.filter(n => {
    const code = n.maPhieuXuat || n.maPhieu || '';
    const order = n.donHangId || n.donHangRef || '';
    const wh = n.tenKhoHang || n.khoXuat || '';
    const store = n.tenCuaHangNhan || n.cuaHangNhan || '';
    const ship = n.tenDonViVanChuyen || n.dvvc || '';
    return code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           order.toLowerCase().includes(searchTerm.toLowerCase()) ||
           wh.toLowerCase().includes(searchTerm.toLowerCase()) ||
           store.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ship.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // ----------------------------------------------------
  // TÍNH TOÁN SỐ LƯỢNG THỐNG KÊ (MỚI)
  // ----------------------------------------------------
  const totalNotes = notes.length;
  
  const completedNotes = notes.filter(n => 
    (n.trangThai || '').toUpperCase() === 'HOÀN THÀNH'
  ).length;

  const rejectedNotes = notes.filter(n => 
    (n.trangThai || '').toUpperCase() === 'TỪ CHỐI'
  ).length;

  const pendingApprovalNotes = notes.filter(n => {
    const status = (n.trangThai || 'CHỜ DUYỆT').toUpperCase();
    return status.includes('CHỜ DUYỆT');
  }).length;

  // Phiếu chờ xử lý / đang giao là phần còn lại sau khi trừ đi các phiếu trên
  const processingNotes = totalNotes - completedNotes - rejectedNotes - pendingApprovalNotes;

  return (
    <div className="export-container">
      {/* Header */}
      <div className="export-header">
        <div>
          <h2>Quản Lý Yêu Cầu Xuất Kho (Fulfillment)</h2>
          <p>Theo dõi các yêu cầu xuất hàng, nơi nhận và tình trạng bàn giao vận chuyển</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary-live" onClick={fetchData} disabled={isLoading}>
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} size={15} /> 
            {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button 
            className="btn-primary-action" 
            onClick={() => navigate('/export-notes/create')}
          >
            <FiPlus size={16} /> Lập Yêu Cầu Xuất Kho
          </button>
        </div>
      </div>

      {/* Thẻ Thống Kê Nâng Cấp UI - Bổ sung 5 ô */}
      <div className="export-stats-grid">
        <div className="stat-card purple">
          <div className="stat-info">
            <span className="stat-title">TỔNG YÊU CẦU</span>
            <div className="stat-number">{totalNotes}</div>
          </div>
          <div className="stat-icon"><FiFileText size={22} /></div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-info">
            <span className="stat-title">ĐANG CHỜ DUYỆT</span>
            <div className="stat-number">{pendingApprovalNotes}</div>
          </div>
          <div className="stat-icon"><FiClock size={22} /></div>
        </div>

        <div className="stat-card blue">
          <div className="stat-info">
            <span className="stat-title">CHỜ XỬ LÝ / ĐANG GIAO</span>
            <div className="stat-number">{processingNotes}</div>
          </div>
          <div className="stat-icon"><FiTruck size={22} /></div>
        </div>

        <div className="stat-card green">
          <div className="stat-info">
            <span className="stat-title">ĐÃ HOÀN THÀNH</span>
            <div className="stat-number">{completedNotes}</div>
          </div>
          <div className="stat-icon"><FiCheckCircle size={22} /></div>
        </div>

        <div className="stat-card red">
          <div className="stat-info">
            <span className="stat-title">TỪ CHỐI</span>
            <div className="stat-number">{rejectedNotes}</div>
          </div>
          <div className="stat-icon"><FiXCircle size={22} /></div>
        </div>
      </div>

      {/* Toolbar Tìm Kiếm */}
      <div className="export-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" size={16} />
          <input 
            type="text" 
            placeholder="Tìm theo mã phiếu, đơn hàng, kho xuất, nơi nhận, đối tác vận chuyển..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bảng Dữ Liệu */}
      <div className="table-card-wrapper">
        <table className="export-table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>MÃ PHIẾU</th>
              <th>THAM CHIẾU ĐƠN</th>
              <th>KHO XUẤT HÀNG</th>
              <th>NƠI NHẬN (CỬA HÀNG)</th>
              <th>ĐƠN VỊ VẬN CHUYỂN</th>
              <th>NGÀY TẠO</th>
              <th style={{ textAlign: 'center' }}>TRẠNG THÁI</th>
              <th style={{ textAlign: 'right', width: '90px' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '50px' }}>
                  <FiRefreshCw className="spin-icon" size={26} style={{ color: '#2563eb' }} />
                  <p style={{ marginTop: '10px', color: '#64748b' }}>Đang nạp danh sách phiếu xuất...</p>
                </td>
              </tr>
            ) : filteredNotes.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                  <FiFileText size={40} style={{ marginBottom: '10px', opacity: 0.4 }} />
                  <p>Chưa có yêu cầu xuất kho nào.</p>
                </td>
              </tr>
            ) : (
              filteredNotes.map((note) => {
                const code = note.maPhieuXuat || note.maPhieu || `YCX-${note.id}`;
                const orderRef = note.donHangId || note.donHangRef || '---';
                const whName = note.tenKhoHang || note.khoXuat || 'Kho Tổng Trung Tâm';
                const storeName = note.tenCuaHangNhan || note.cuaHangNhan || 'Shop chuyên bán IT';
                const shipName = note.tenDonViVanChuyen || note.dvvc || 'Sếp Hưng Shipper';
                const dateStr = note.ngayXuat ? new Date(note.ngayXuat).toLocaleDateString('vi-VN') : '---';
                
                const statusStr = note.trangThai || 'CHỜ DUYỆT'; 
                let statusClass = 'processing'; // Mặc định là xử lý (xanh biển)
                
                // Đồng bộ màu của trạng thái bảng với màu thống kê
                if (statusStr.toUpperCase().includes('HỦY') || statusStr.toUpperCase().includes('TỪ CHỐI')) {
                  statusClass = 'cancelled'; // Đỏ
                } else if (statusStr.toUpperCase().includes('HOÀN THÀNH')) {
                  statusClass = 'success'; // Xanh lá
                } else if (statusStr.toUpperCase().includes('CHỜ DUYỆT')) {
                  statusClass = 'warning'; // Vàng
                }

                return (
                  <tr key={note.id}>
                    <td>
                      <span className="export-code-badge">{code}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{orderRef}</strong>
                    </td>
                    <td>{whName}</td>
                    <td>
                      <span className="store-receive-badge">
                        <FiShoppingBag size={13} style={{ color: '#2563eb', flexShrink: 0 }} />
                        {storeName}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                        <FiTruck size={14} style={{ color: '#8b5cf6' }} /> {shipName}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{dateStr}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-pill-custom ${statusClass}`}>
                        {statusStr}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-view-detail" 
                        title="Xem chi tiết phiếu xuất"
                        onClick={() => navigate(`/export-notes/${note.id}`)}
                      >
                        <FiEye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="export-footer">
        <span>Hiển thị <strong>{filteredNotes.length}</strong> yêu cầu xuất kho</span>
      </div>
    </div>
  );
};

export default ExportNoteList;