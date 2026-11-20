// src/pages/ImportNote/ImportNoteList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye, FiRefreshCw, FiFileText } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ImportNoteList.css';

const ImportNoteList = () => {
  const navigate = useNavigate();
  const [importNotes, setImportNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const notesRes = await wmsCoreService.getImportNotes();
      if (Array.isArray(notesRes)) {
        setImportNotes(notesRes);
      }
    } catch (e) {
      console.warn('Lỗi lấy dữ liệu phiếu nhập:', e.message);
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

  // Cập nhật hàm renderStatusBadge để bao quát chuỗi có dấu từ API
  const renderStatusBadge = (status) => {
    if (!status) return <span className="status-badge pending">Chờ duyệt</span>;
    const s = status.toString().toUpperCase().trim();
    
    if (s === 'CHO_DUYET' || s === 'CHỜ DUYỆT') {
      return <span className="status-badge pending">Chờ duyệt</span>;
    }
    if (s === 'DA_DUYET' || s === 'ĐÃ DUYỆT') {
      return <span className="status-badge approved">Đã duyệt (Chờ nhập)</span>;
    }
    if (s === 'DA_NHAP_KHO' || s === 'ĐÃ NHẬP KHO') {
      return <span className="status-badge success">Đã nhập kho</span>;
    }
    if (s === 'TU_CHOI' || s === 'TỪ CHỐI') {
      return <span className="status-badge rejected">Từ chối</span>;
    }
    
    return <span className="status-badge default">{status}</span>;
  };

  return (
    <div className="import-container">
      <div className="import-header">
        <div>
          <h2>Quản Lý Yêu Cầu & Phiếu Nhập Kho</h2>
          <p>Danh sách các chứng từ yêu cầu nhập hàng và theo dõi tiến độ phê duyệt</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchData} disabled={isLoading}>
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> Đồng bộ
          </button>
          <button className="btn-primary" onClick={() => navigate('/import-notes/create')}>
            <FiPlus size={16} /> Tạo Yêu Cầu Nhập Kho
          </button>
        </div>
      </div>

      <div className="import-table-card">
        <div className="table-responsive">
          <table className="import-table">
            <thead>
              <tr>
                <th>Mã Chứng Từ</th>
                <th>Nhà Cung Cấp</th>
                <th>Kho Nhận Hàng</th>
                <th>Ngày Tạo</th>
                <th style={{ textAlign: 'right' }}>Tổng Giá Trị</th>
                <th style={{ textAlign: 'center' }}>Trạng Thái</th>
                <th>Người Lập</th>
                <th style={{ textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {importNotes.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <FiFileText size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p>Chưa có yêu cầu nhập kho nào.</p>
                  </td>
                </tr>
              ) : (
                importNotes.map((note) => (
                  <tr key={note.id}>
                    <td><span className="code-badge">{note.maPhieuNhap || `PN-${note.id}`}</span></td>
                    <td><strong>{note.tenNhaCungCap || 'Chưa xác định'}</strong></td>
                    <td>{note.tenKhoHang || 'Kho Tổng'}</td>
                    <td>{note.ngayNhap ? new Date(note.ngayNhap).toLocaleDateString('vi-VN') : '---'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(note.tongTienNhap)}</td>
                    <td style={{ textAlign: 'center' }}>{renderStatusBadge(note.trangThai)}</td>
                    <td>{note.nguoiTao || 'Nhân viên'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-icon" title="Xem chi tiết" onClick={() => navigate(`/import-notes/${note.id}`)}>
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