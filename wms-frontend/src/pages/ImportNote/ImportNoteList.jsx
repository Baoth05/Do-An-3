/**
 * ==============================================================================
 * Module: ImportNoteList.jsx
 * Mô tả: Giao diện Quản lý Phiếu Nhập Kho.
 * Chức năng: Quản lý các chứng từ nhập hàng từ Nhà cung cấp hoặc điều chuyển từ Kho Tổng.
 * ==============================================================================
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye, FiRefreshCw, FiFileText } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ImportNoteList.css';

const ImportNoteList = () => {
  const navigate = useNavigate();

  const [importNotes, setImportNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const notesRes = await wmsCoreService.getImportNotes();
      if (Array.isArray(notesRes)) {
        setImportNotes(notesRes);
        setIsBackendConnected(true);
      } else {
        setImportNotes([]);
      }
    } catch (e) {
      console.warn('Lỗi lấy dữ liệu phiếu nhập từ Backend:', e.message);
      setIsBackendConnected(false);
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

  return (
    <div className="import-container">
      <div className="import-header">
        <div>
          <h2>Quản Lý Phiếu Nhập Kho</h2>
          <p>Danh sách các chứng từ nhập hàng từ nhà cung cấp và tăng tồn kho</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchData} disabled={isLoading} title="Làm mới">
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button 
            className="btn-primary"
            onClick={() => navigate('/import-notes/create')}
          >
            <FiPlus size={16} /> Lập Phiếu Nhập Kho
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
                <th>Ngày Nhập</th>
                <th style={{ textAlign: 'right' }}>Tổng Giá Trị</th>
                <th style={{ textAlign: 'center' }}>Trạng Thái</th>
                <th>Người Lập</th>
                <th style={{ textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    <FiRefreshCw className="spin-icon" size={24} style={{ color: '#4f46e5' }} />
                    <p style={{ marginTop: '8px', color: '#64748b' }}>Đang nạp danh sách phiếu nhập kho...</p>
                  </td>
                </tr>
              ) : importNotes.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <FiFileText size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p>Chưa có phiếu nhập kho nào.</p>
                    <button 
                      className="btn-primary" 
                      style={{ marginTop: '12px' }}
                      onClick={() => navigate('/import-notes/create')}
                    >
                      <FiPlus size={16} /> Lập Phiếu Nhập Đầu Tiên
                    </button>
                  </td>
                </tr>
              ) : (
                importNotes.map((note) => {
                  const code = note.maPhieuNhap || `PN-${note.id}`;
                  const supplierName = note.tenNhaCungCap || note.nhaCungCap?.tenNhaCungCap || 'Chưa xác định';
                  const warehouseName = note.tenKhoHang || note.khoHang?.tenKho || 'Kho Tổng Trung Tâm';
                  const dateStr = note.ngayNhap ? new Date(note.ngayNhap).toLocaleDateString('vi-VN') : '---';
                  const creator = note.nguoiTao || 'Thủ kho';
                  const total = note.tongTienNhap || 0;
                  const status = note.trangThai || 'ĐÃ NHẬP KHO';

                  return (
                    <tr key={note.id}>
                      <td>
                        <span className="code-badge">{code}</span>
                      </td>
                      <td>
                        <strong>{supplierName}</strong>
                      </td>
                      <td>{warehouseName}</td>
                      <td>{dateStr}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                        {formatCurrency(total)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="status-tag success">
                          {status}
                        </span>
                      </td>
                      <td>{creator}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn-icon" 
                          title="Xem chi tiết phiếu nhập"
                          onClick={() => navigate(`/import-notes/${note.id}`)}
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
      </div>
    </div>
  );
};

export default ImportNoteList;
