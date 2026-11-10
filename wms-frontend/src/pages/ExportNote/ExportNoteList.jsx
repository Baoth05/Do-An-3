/**
 * ==============================================================================
 * Module: ExportNoteList.jsx
 * Mô tả: Giao diện Quản lý Yêu Cầu/Phiếu Xuất Kho (WMS Fulfillment).
 * ==============================================================================
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiPlus, FiEye, FiTruck, FiRefreshCw, 
  FiFileText 
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
    const ship = n.tenDonViVanChuyen || n.dvvc || '';
    return code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           order.toLowerCase().includes(searchTerm.toLowerCase()) ||
           wh.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ship.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="export-container">
      <div className="export-header">
        <div>
          <h2>Quản Lý Yêu Cầu Xuất Kho (Fulfillment)</h2>
          <p>Theo dõi các yêu cầu xuất hàng và tình trạng xử lý</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchData} disabled={isLoading} title="Làm mới">
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/export-notes/create')}
          >
            <FiPlus size={16} /> Lập Yêu Cầu Xuất Kho
          </button>
        </div>
      </div>

      <div className="export-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo mã yêu cầu, mã đơn hàng, kho xuất, đối tác vận chuyển..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="export-table">
          <thead>
            <tr>
              <th>Mã Yêu Cầu</th>
              <th>Tham Chiếu Đơn Hàng</th>
              <th>Kho Xuất Hàng</th>
              <th>Đơn Vị Vận Chuyển</th>
              <th>Ngày Tạo</th>
              <th style={{ textAlign: 'center' }}>Trạng Thái</th>
              <th>Người Tạo</th>
              <th style={{ textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  <FiRefreshCw className="spin-icon" size={24} style={{ color: '#4f46e5' }} />
                  <p style={{ marginTop: '8px', color: '#64748b' }}>Đang nạp dữ liệu...</p>
                </td>
              </tr>
            ) : filteredNotes.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <FiFileText size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p>Chưa có yêu cầu xuất kho nào.</p>
                  <button 
                    className="btn-primary" 
                    style={{ marginTop: '12px' }}
                    onClick={() => navigate('/export-notes/create')}
                  >
                    <FiPlus size={16} /> Tạo Yêu Cầu Mới
                  </button>
                </td>
              </tr>
            ) : (
              filteredNotes.map((note) => {
                const code = note.maPhieuXuat || note.maPhieu || `YCX-${note.id}`;
                const orderRef = note.donHangId || note.donHangRef || '---';
                const whName = note.tenKhoHang || note.khoXuat || 'Kho Tổng Trung Tâm';
                const shipName = note.tenDonViVanChuyen || note.dvvc || 'Giao Hàng Tiết Kiệm';
                const dateStr = note.ngayXuat ? new Date(note.ngayXuat).toLocaleDateString('vi-VN') : '---';
                const creator = note.nguoiTao || 'Nhân viên';
                
                // Phân tích trạng thái để gán class CSS
                const statusStr = note.trangThai || 'HOÀN THÀNH';
                let statusClass = 'success'; // Mặc định màu xanh (hoàn thành)
                
                if (statusStr.toUpperCase() === 'HỦY BỎ' || statusStr.toUpperCase() === 'ĐÃ HỦY') {
                  statusClass = 'cancelled'; // Màu đỏ
                } else if (statusStr.toUpperCase() === 'CHỜ XỬ LÝ' || statusStr.toUpperCase() === 'ĐANG XỬ LÝ') {
                  statusClass = 'pending'; // Màu vàng cam
                }

                return (
                  <tr key={note.id}>
                    <td>
                      <span className="code-badge">{code}</span>
                    </td>
                    <td>
                      <strong>{orderRef}</strong>
                    </td>
                    <td>{whName}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FiTruck size={13} style={{ color: '#4f46e5' }} /> {shipName}
                      </span>
                    </td>
                    <td>{dateStr}</td>
                    <td style={{ textAlign: 'center' }}>
                      {/* Áp dụng class động dựa vào trạng thái */}
                      <span className={`status-tag ${statusClass}`}>
                        {statusStr}
                      </span>
                    </td>
                    <td>{creator}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-icon" 
                        title="Xem chi tiết yêu cầu"
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
        <span>Tổng cộng: <strong>{filteredNotes.length}</strong> yêu cầu xuất kho</span>
      </div>
    </div>
  );
};

export default ExportNoteList;