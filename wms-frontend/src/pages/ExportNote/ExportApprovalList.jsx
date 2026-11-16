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

  const fetchPendingData = async () => {
    try {
      setIsLoading(true);
      const allNotes = await wmsCoreService.getExportNotes();
      
      if (Array.isArray(allNotes)) {
        const filtered = allNotes.filter(n => {
          const status = (n.trangThai || '').toUpperCase();
          return status === 'CHỜ DUYỆT' || status === 'PENDING';
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

  // Xử lý chuỗi "chưa cập nhật" trả về từ API
  const extractShopName = (note) => {
    const name = note.tenShop || '';
    // Xóa khoảng trắng và kiểm tra chính xác chuỗi hệ thống trả về
    if (name.trim().toLowerCase() === 'chưa cập nhật' || name.trim() === '') {
      return '---';
    }
    return name;
  };

  // Xử lý chuỗi địa chỉ hệ thống trả về
  const extractAddress = (note) => {
    const addr = note.diaChiNhan || '';
    // Nếu chứa câu báo mặc định của Backend
    if (addr.includes('Địa chỉ lấy từ hệ thống') || addr.trim().toLowerCase() === 'chưa cập nhật' || addr.trim() === '') {
      return 'Chưa có thông tin';
    }
    return addr;
  };

  const displayNotes = pendingNotes.filter(n => {
    const shopName = extractShopName(n);
    const address = extractAddress(n);
    const searchStr = `${n.maPhieuXuat || ''} ${n.donHangId || ''} ${n.tenKhoHang || ''} ${shopName} ${address}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const handleApprove = async (id, maPhieu) => {
    if (window.confirm(`Thủ kho trưởng xác nhận PHÊ DUYỆT phiếu xuất [${maPhieu}]?`)) {
      try {
        await wmsCoreService.approveExportNote(id);
        alert('Phê duyệt thành công!');
        fetchPendingData(); 
      } catch (error) {
        alert('Có lỗi xảy ra khi phê duyệt: ' + error.message);
      }
    }
  };

 const handleReject = async (id, maPhieu) => {
    const reason = window.prompt(`Nhập lý do TỪ CHỐI phiếu xuất [${maPhieu}]:`);
    
    if (reason !== null) {
      try {
        // Sửa thành updateExportNoteStatus
        await wmsCoreService.updateExportNoteStatus(id, 'TỪ CHỐI'); 
        
        alert('Đã từ chối phiếu xuất!');
        fetchPendingData();
      } catch (error) {
        alert('Có lỗi xảy ra khi từ chối: ' + error.message);
      }
    }
  };

  return (
    <div className="approval-container">
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

      <div className="approval-alert-box">
        <FiAlertCircle size={24} style={{ color: '#d97706' }} />
        <div>
          <strong>Chú ý:</strong> Hiện đang có <strong>{pendingNotes.length}</strong> yêu cầu xuất kho đang chờ Thủ kho trưởng phê duyệt. Vui lòng kiểm tra tồn kho trước khi duyệt.
        </div>
      </div>

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

      <div className="table-card-wrapper">
        <table className="approval-table">
          <thead>
            <tr>
              <th>MÃ PHIẾU</th>
              <th>THAM CHIẾU ĐƠN</th>
              <th>KHO XUẤT</th>
              <th>TÊN SHOP</th>
              <th>NƠI NHẬN</th>
              <th>NGÀY TẠO</th>
              <th style={{ textAlign: 'center' }}>HÀNH ĐỘNG DUYỆT</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '50px' }}>
                  <FiRefreshCw className="spin-icon" size={26} style={{ color: '#2563eb' }} />
                  <p style={{ marginTop: '10px', color: '#64748b' }}>Đang nạp danh sách chờ duyệt...</p>
                </td>
              </tr>
            ) : displayNotes.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                  <FiCheckCircle size={40} style={{ marginBottom: '10px', color: '#10b981', opacity: 0.5 }} />
                  <p>Tuyệt vời! Không còn phiếu xuất nào cần duyệt.</p>
                </td>
              </tr>
            ) : (
              displayNotes.map((note) => {
                const code = note.maPhieuXuat || note.maPhieu || `YCX-${note.id}`;
                
                // Sử dụng hàm làm sạch dữ liệu
                const shopName = extractShopName(note);
                const address = extractAddress(note);

                return (
                  <tr key={note.id}>
                    <td><span className="approval-code-badge">{code}</span></td>
                    <td><strong>{note.donHangId || note.donHangRef || '---'}</strong></td>
                    <td>{note.tenKhoHang || note.khoXuat}</td>
                    <td>{shopName}</td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={address !== 'Chưa có thông tin' ? address : ''}>
                      {address}
                    </td>
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