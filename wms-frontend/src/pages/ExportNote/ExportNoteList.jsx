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
  FiFileText, FiShoppingBag, FiCheckCircle, FiClock 
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

  // Tính toán số lượng thống kê
  const totalNotes = notes.length;
  const completedNotes = notes.filter(n => (n.trangThai || '').toUpperCase() === 'HOÀN THÀNH').length;
  const pendingNotes = totalNotes - completedNotes;

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

      {/* Thẻ Thống Kê Nâng Cấp UI */}
      <div className="export-stats-grid">
        <div className="stat-card blue">
          <div className="stat-info">
            <span className="stat-title">TỔNG YÊU CẦU XUẤT</span>
            <div className="stat-number">{totalNotes}</div>
          </div>
          <div className="stat-icon"><FiFileText size={22} /></div>
        </div>

        <div className="stat-card green">
          <div className="stat-info">
            <span className="stat-title">ĐÃ HOÀN THÀNH</span>
            <div className="stat-number">{completedNotes}</div>
          </div>
          <div className="stat-icon"><FiCheckCircle size={22} /></div>
        </div>

        <div className="stat-card orange">
          <div className="stat-info">
            <span className="stat-title">CHỜ XỬ LÝ / ĐANG GIAO</span>
            <div className="stat-number">{pendingNotes}</div>
          </div>
          <div className="stat-icon"><FiClock size={22} /></div>
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
                
                const statusStr = note.trangThai || 'CHỜ DUYỆT'; // SỬA Ở ĐÂY: Mặc định là CHỜ DUYỆT nếu backend trả thiếu
                let statusClass = 'pending'; // Đổi class mặc định thành pending
                
                if (statusStr.toUpperCase().includes('HỦY')) {
                  statusClass = 'cancelled';
                } else if (statusStr.toUpperCase().includes('HOÀN THÀNH')) {
                  statusClass = 'success'; // Chỉ khi backend thực sự trả về HOÀN THÀNH mới có màu xanh
                } else if (statusStr.toUpperCase().includes('CHỜ') || statusStr.toUpperCase().includes('ĐANG')) {
                  statusClass = 'pending';
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