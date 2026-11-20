// src/pages/ImportNote/ImportNoteList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiEye, FiRefreshCw, FiFileText, 
  FiClipboard, FiClock, FiCheckCircle, FiXCircle 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ImportNoteList.css';

const ImportNoteList = () => {
  const navigate = useNavigate();
  const [importNotes, setImportNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const notesRes = await wmsCoreService.getImportNotes();
      if (Array.isArray(notesRes)) {
        setImportNotes(notesRes);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 503) {
          setErrorMessage("Máy chủ hiện đang bảo trì hoặc mất kết nối (Lỗi 503).");
        } else {
          setErrorMessage(`Lỗi máy chủ: ${error.response.status}`);
        }
      } else if (error.request) {
        setErrorMessage("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!");
      } else {
        setErrorMessage("Lỗi: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    if (!amount) return '0 đ';
    return Number(amount).toLocaleString('vi-VN') + ' đ';
  };

  const renderStatusBadge = (status) => {
    if (!status) return <span className="status-badge pending">Chờ duyệt</span>;
    const s = status.toString().toUpperCase().trim();
    if (s === 'CHO_DUYET' || s === 'CHỜ DUYỆT') return <span className="status-badge pending">Chờ duyệt</span>;
    if (s === 'DA_DUYET' || s === 'ĐÃ DUYỆT') return <span className="status-badge approved">Đã duyệt</span>;
    if (s === 'DA_NHAP_KHO' || s === 'ĐÃ NHẬP KHO') return <span className="status-badge success">Đã nhập kho</span>;
    if (s === 'TU_CHOI' || s === 'TỪ CHỐI') return <span className="status-badge rejected">Từ chối</span>;
    return <span className="status-badge pending">{status}</span>;
  };

  // Tính toán thống kê
  const stats = {
    total: importNotes.length,
    pending: importNotes.filter(n => ['CHO_DUYET', 'CHỜ DUYỆT'].includes((n.trangThai || '').toUpperCase().trim())).length,
    success: importNotes.filter(n => ['DA_NHAP_KHO', 'ĐÃ NHẬP KHO'].includes((n.trangThai || '').toUpperCase().trim())).length,
    rejected: importNotes.filter(n => ['TU_CHOI', 'TỪ CHỐI'].includes((n.trangThai || '').toUpperCase().trim())).length,
  };

  return (
    <div className="import-container">
      <div className="import-header">
        <div>
          <h2>Quản Lý Yêu Cầu & Phiếu Nhập Kho</h2>
          <p>Theo dõi luồng công việc, phê duyệt và trạng thái nhập hàng vật lý</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={fetchData} disabled={isLoading}>
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> Đồng bộ
          </button>
          <button className="btn-primary" onClick={() => navigate('/import-notes/create')} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <FiPlus size={18} /> Tạo Phiếu Mới
          </button>
        </div>
      </div>

      {errorMessage && (
        <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '16px', borderRadius: '10px', border: '1px solid #fecaca' }}>
          <strong>Cảnh báo:</strong> {errorMessage}
        </div>
      )}

      {/* KHU VỰC THỐNG KÊ MỚI THÊM VÀO */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper total"><FiClipboard /></div>
          <div className="stat-info"><span>Tổng Phiếu</span><strong>{stats.total}</strong></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper pending"><FiClock /></div>
          <div className="stat-info"><span>Chờ Xử Lý</span><strong>{stats.pending}</strong></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper success"><FiCheckCircle /></div>
          <div className="stat-info"><span>Đã Hoàn Thành</span><strong>{stats.success}</strong></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper rejected"><FiXCircle /></div>
          <div className="stat-info"><span>Bị Từ Chối</span><strong>{stats.rejected}</strong></div>
        </div>
      </div>

      <div className="import-table-card">
        <div className="table-responsive">
          <table className="import-table">
            <thead>
              <tr>
                <th>Mã Phiếu</th>
                <th>Nhà Cung Cấp</th>
                <th>Kho Tiếp Nhận</th>
                <th>Ngày Tạo</th>
                <th style={{ textAlign: 'right' }}>Giá Trị (VNĐ)</th>
                <th style={{ textAlign: 'center' }}>Trạng Thái</th>
                <th>Người Lập</th>
                <th style={{ textAlign: 'center' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    <FiRefreshCw className="spin-icon" size={24} style={{ color: '#3b82f6' }} />
                    <p style={{ marginTop: '8px', color: '#64748b' }}>Đang nạp dữ liệu...</p>
                  </td>
                </tr>
              ) : importNotes.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    <FiFileText size={48} style={{ marginBottom: '16px', color: '#cbd5e1' }} />
                    <h3 style={{ margin: '0 0 8px 0', color: '#334155' }}>Chưa có phiếu nhập kho</h3>
                  </td>
                </tr>
              ) : (
                importNotes.map((note) => (
                  <tr key={note.id}>
                    <td><span className="code-badge">{note.maPhieuNhap || `PN-${note.id}`}</span></td>
                    <td><strong>{note.tenNhaCungCap || '---'}</strong></td>
                    <td>{note.tenKhoHang || 'Kho Tổng'}</td>
                    <td>{note.ngayNhap ? new Date(note.ngayNhap).toLocaleDateString('vi-VN') : '---'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#1d4ed8' }}>{formatCurrency(note.tongTienNhap)}</td>
                    <td style={{ textAlign: 'center' }}>{renderStatusBadge(note.trangThai)}</td>
                    <td>{note.nguoiTao || '---'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-icon" title="Xem chi tiết phiếu" onClick={() => navigate(`/import-notes/${note.id}`)}>
                        <FiEye size={16} />
                      </button>
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

export default ImportNoteList;