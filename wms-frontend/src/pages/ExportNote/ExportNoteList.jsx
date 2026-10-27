import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiPlus, FiEye, FiTruck, FiRefreshCw, FiCheckCircle, 
  FiFileText, FiMapPin 
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
      console.warn('Lỗi lấy phiếu xuất kho từ Backend:', e.message);
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
          <h2>Quản Lý Phiếu Xuất Kho (Fulfillment)</h2>
          <p>Chứng từ xuất hàng giao cho bưu cục vận chuyển và trừ tồn kho vật lý</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchData} disabled={isLoading} title="Làm mới">
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/export-notes/create')}
          >
            <FiPlus size={16} /> Lập Phiếu Xuất Kho
          </button>
        </div>
      </div>

      <div className="export-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo mã phiếu xuất, mã đơn hàng, kho xuất, bưu tá..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="export-table">
          <thead>
            <tr>
              <th>Mã Phiếu Xuất</th>
              <th>Tham Chiếu Đơn Hàng</th>
              <th>Kho Xuất Hàng</th>
              <th>Đơn Vị Vận Chuyển</th>
              <th>Ngày Xuất</th>
              <th style={{ textAlign: 'center' }}>Trạng Thái</th>
              <th>Thủ Kho Xuất</th>
              <th style={{ textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  <FiRefreshCw className="spin-icon" size={24} style={{ color: '#4f46e5' }} />
                  <p style={{ marginTop: '8px', color: '#64748b' }}>Đang nạp dữ liệu phiếu xuất kho...</p>
                </td>
              </tr>
            ) : filteredNotes.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <FiFileText size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p>Chưa có phiếu xuất kho nào.</p>
                  <button 
                    className="btn-primary" 
                    style={{ marginTop: '12px' }}
                    onClick={() => navigate('/export-notes/create')}
                  >
                    <FiPlus size={16} /> Tạo Phiếu Xuất Kho Mới
                  </button>
                </td>
              </tr>
            ) : (
              filteredNotes.map((note) => {
                const code = note.maPhieuXuat || note.maPhieu || `PX-${note.id}`;
                const orderRef = note.donHangId || note.donHangRef || '---';
                const whName = note.tenKhoHang || note.khoXuat || 'Kho Tổng Trung Tâm';
                const shipName = note.tenDonViVanChuyen || note.dvvc || 'Giao Hàng Tiết Kiệm';
                const dateStr = note.ngayXuat ? new Date(note.ngayXuat).toLocaleDateString('vi-VN') : '---';
                const creator = note.nguoiTao || 'Thủ kho';
                const status = note.trangThai || 'HOÀN THÀNH';

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
                      <span className="status-tag success">
                        {status}
                      </span>
                    </td>
                    <td>{creator}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-icon" 
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
        <span>Tổng cộng: <strong>{filteredNotes.length}</strong> chứng từ xuất kho</span>
      </div>
    </div>
  );
};

export default ExportNoteList;
