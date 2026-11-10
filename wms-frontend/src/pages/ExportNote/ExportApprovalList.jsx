/**
 * ==============================================================================
 * Module: ExportApprovalList.jsx
 * Quyền: Thủ Kho Trưởng (Quản lý & Phê duyệt)
 * Mô tả: Màn hình chuyên dụng để xem và duyệt các yêu cầu xuất kho đang chờ.
 * ==============================================================================
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiEye, FiCheckCircle, FiXCircle, FiRefreshCw, FiAlertCircle 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ExportApprovalList.css';

const ExportApprovalList = () => {
  const navigate = useNavigate();
  const [pendingNotes, setPendingNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Lấy dữ liệu và chỉ lọc các phiếu đang chờ duyệt
  const fetchPendingData = async () => {
    try {
      setIsLoading(true);
      const allNotes = await wmsCoreService.getExportNotes();
      if (Array.isArray(allNotes)) {
        // Giả định trạng thái chờ là "CHỜ XỬ LÝ" hoặc "PENDING"
        const filtered = allNotes.filter(n => {
          const status = (n.trangThai || '').toUpperCase();
          return status.includes('CHỜ') || status.includes('PENDING');
        });
        setPendingNotes(filtered);
      }
    } catch (e) {
      console.warn('Lỗi lấy dữ liệu chờ duyệt:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingData();
  }, []);

  // Lọc theo thanh tìm kiếm
  const displayNotes = pendingNotes.filter(n => {
    const searchStr = `${n.maPhieuXuat} ${n.donHangId} ${n.tenKhoHang} ${n.tenCuaHangNhan}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  // Xử lý Phê duyệt
  const handleApprove = async (id, maPhieu) => {
    if (window.confirm(`Thủ kho trưởng xác nhận PHÊ DUYỆT phiếu xuất [${maPhieu}]?`)) {
      try {
        // GỌI API DUYỆT TẠI ĐÂY - Ví dụ: await wmsCoreService.approveExportNote(id);
        console.log(`Đã duyệt phiếu: ${id}`);
        alert('Phê duyệt thành công!');
        fetchPendingData(); // Tải lại danh sách
      } catch (error) {
        alert('Có lỗi xảy ra khi phê duyệt.');
      }
    }
  };

  // Xử lý Từ chối
  const handleReject = async (id, maPhieu) => {
    const reason = window.prompt(`Nhập lý do TỪ CHỐI phiếu xuất [${maPhieu}]:`);
    if (reason !== null) {
      try {
        // GỌI API TỪ CHỐI TẠI ĐÂY - Ví dụ: await wmsCoreService.rejectExportNote(id, reason);
        console.log(`Đã từ chối phiếu: ${id}, Lý do: ${reason}`);
        alert('Đã từ chối phiếu xuất!');
        fetchPendingData(); // Tải lại danh sách
      } catch (error) {
        alert('Có lỗi xảy ra khi từ chối.');
      }
    }
  };

  return (
    <div className="approval-container">
      {/* Header */}
      <div className="approval-header">
        <div>
          <h2>Phê Duyệt Yêu Cầu Xuất Kho</h2>
          <p>Màn hình dành cho Thủ Kho Trưởng để xét duyệt hàng hóa ra khỏi kho</p>
        </div>
        <button className="btn-secondary-live" onClick={fetchPendingData} disabled={isLoading}>
          <FiRefreshCw className={isLoading ? 'spin-icon' : ''} size={15} /> 
          Làm mới dữ liệu
        </button>
      </div>

      {/* Cảnh báo trạng thái */}
      <div className="approval-alert-box">
        <FiAlertCircle size={24} style={{ color: '#d97706' }} />
        <div>
          <strong>Chú ý:</strong> Hiện đang có <strong>{pendingNotes.length}</strong> yêu cầu xuất kho đang chờ Thủ kho trưởng phê duyệt. Vui lòng kiểm tra tồn kho trước khi duyệt.
        </div>
      </div>

      {/* Toolbar Tìm Kiếm */}
      <div className="approval-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" size={16} />
          <input 
            type="text" 
            placeholder="Tìm theo mã phiếu, đơn hàng, kho xuất, nơi nhận..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bảng Dữ Liệu Chờ Duyệt */}
      <div className="table-card-wrapper">
        <table className="approval-table">
          <thead>
            <tr>
              <th>MÃ PHIẾU</th>
              <th>THAM CHIẾU ĐƠN</th>
              <th>KHO XUẤT</th>
              <th>NƠI NHẬN</th>
              <th>NGÀY TẠO</th>
              <th style={{ textAlign: 'center' }}>HÀNH ĐỘNG DUYỆT</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '50px' }}>
                  <FiRefreshCw className="spin-icon" size={26} style={{ color: '#2563eb' }} />
                  <p style={{ marginTop: '10px', color: '#64748b' }}>Đang nạp danh sách chờ duyệt...</p>
                </td>
              </tr>
            ) : displayNotes.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                  <FiCheckCircle size={40} style={{ marginBottom: '10px', color: '#10b981', opacity: 0.5 }} />
                  <p>Tuyệt vời! Không còn phiếu xuất nào cần duyệt.</p>
                </td>
              </tr>
            ) : (
              displayNotes.map((note) => {
                const code = note.maPhieuXuat || note.maPhieu || `YCX-${note.id}`;
                return (
                  <tr key={note.id}>
                    <td><span className="approval-code-badge">{code}</span></td>
                    <td><strong>{note.donHangId || note.donHangRef || '---'}</strong></td>
                    <td>{note.tenKhoHang || note.khoXuat}</td>
                    <td>{note.tenCuaHangNhan || note.cuaHangNhan}</td>
                    <td style={{ color: '#64748b' }}>
                      {note.ngayXuat ? new Date(note.ngayXuat).toLocaleDateString('vi-VN') : '---'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons-group">
                        <button 
                          className="btn-action view" 
                          title="Xem chi tiết"
                          onClick={() => navigate(`/export-notes/${note.id}`)}
                        >
                          <FiEye size={16} />
                        </button>
                        <button 
                          className="btn-action approve" 
                          title="Phê duyệt phiếu này"
                          onClick={() => handleApprove(note.id, code)}
                        >
                          <FiCheckCircle size={16} /> Duyệt
                        </button>
                        <button 
                          className="btn-action reject" 
                          title="Từ chối xuất kho"
                          onClick={() => handleReject(note.id, code)}
                        >
                          <FiXCircle size={16} /> Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExportApprovalList;