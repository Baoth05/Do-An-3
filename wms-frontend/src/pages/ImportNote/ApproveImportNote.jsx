// src/pages/ImportNote/ApproveImportNote.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiEye, FiUser, FiTruck, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ApproveImportNote.css';

const ApproveImportNote = () => {
  const navigate = useNavigate();
  const [pendingNotes, setPendingNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State quản lý Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const fetchPendingNotes = async () => {
    try {
      setIsLoading(true);
      const res = await wmsCoreService.getImportNotes();
      if (Array.isArray(res)) {
        const pending = res.filter(n => {
          if (!n.trangThai) return true;
          const status = n.trangThai.toString().toUpperCase().trim();
          return status === 'CHO_DUYET' || status === 'CHỜ DUYỆT';
        });
        setPendingNotes(pending);
      }
    } catch (e) {
      console.warn('Lỗi lấy phiếu chờ duyệt:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingNotes();
  }, []);

  // Hàm mở modal khi nhấn "Kiểm tra"
  const openInspectModal = (note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNote(null);
  };

  // Cập nhật hàm Duyệt: nhận id trực tiếp và đóng modal sau khi xong
  const handleApprove = async (id, code) => {
    if (window.confirm(`Xác nhận PHÊ DUYỆT yêu cầu ${code}?`)) {
      try {
        await wmsCoreService.updateImportNoteStatus(id, 'DA_DUYET');
        alert('Đã phê duyệt yêu cầu nhập kho thành công!');
        closeModal(); // Đóng cửa sổ
        fetchPendingNotes(); // Tải lại danh sách
      } catch (err) {
        alert('Lỗi phê duyệt: ' + err.message);
      }
    }
  };

  // Cập nhật hàm Từ chối
  const handleReject = async (id, code) => {
    if (window.confirm(`Xác nhận TỪ CHỐI yêu cầu ${code}?`)) {
      try {
        await wmsCoreService.updateImportNoteStatus(id, 'TU_CHOI');
        alert('Đã từ chối yêu cầu nhập kho.');
        closeModal(); // Đóng cửa sổ
        fetchPendingNotes();
      } catch (err) {
        alert('Lỗi khi từ chối: ' + err.message);
      }
    }
  };

  return (
    <div className="import-container">
      <div className="import-header">
        <div>
          <h2>Duyệt Đề Xuất Mua Hàng</h2>
          <p>Sắp đang có {pendingNotes.length} đề xuất cần xem xét</p>
        </div>
        <button className="btn-secondary" onClick={fetchPendingNotes} disabled={isLoading}>
          <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> Làm mới
        </button>
      </div>

      <div className="import-table-card">
        <div className="table-responsive">
          <table className="import-table">
            <thead>
              <tr>
                <th>Mã Yêu Cầu</th>
                <th>Ngày Gửi</th>
                <th>Người Đề Xuất</th>
                <th style={{ textAlign: 'right' }}>Giá Trị Dự Chi</th>
                <th style={{ textAlign: 'center' }}>Trạng Thái</th>
                <th style={{ textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {pendingNotes.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Hiện tại không có yêu cầu nào đang chờ duyệt.
                  </td>
                </tr>
              ) : (
                pendingNotes.map((note) => {
                  const code = note.maPhieuNhap || `PN-${note.id}`;
                  return (
                    <tr key={note.id}>
                      <td><strong>{code}</strong></td>
                      <td>{note.ngayNhap ? new Date(note.ngayNhap).toLocaleDateString('vi-VN') : '---'}</td>
                      <td>{note.nguoiTao || 'Nhân viên'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#e11d48' }}>
                        {Number(note.tongTienNhap || 0).toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ textAlign: 'center' }}>
                         <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500}}>
                           Chờ Duyệt
                         </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {/* Đổi thành 1 nút Kiểm tra & Ký */}
                        <button className="btn-inspect" onClick={() => openInspectModal(note)}>
                          <FiEye /> Kiểm tra & Ký
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

      {/* ======================= MODAL CHI TIẾT ======================= */}
      {isModalOpen && selectedNote && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Phê Duyệt Phiếu: {selectedNote.maPhieuNhap || `PN-${selectedNote.id}`}</h3>
              <button className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item">
                  <FiUser /> <strong>Nhân viên:</strong> {selectedNote.nguoiTao || '---'}
                </div>
                <div className="info-item">
                  <FiTruck /> <strong>Nhà cung cấp:</strong> {selectedNote.tenNhaCungCap || '---'}
                </div>
                <div className="info-item">
                  <FiCalendar /> <strong>Ngày lập:</strong> {selectedNote.ngayNhap ? new Date(selectedNote.ngayNhap).toLocaleString('vi-VN') : '---'}
                </div>
              </div>

              <div className="total-budget-box">
                <FiDollarSign size={20}/> 
                <span>Tổng ngân sách đề xuất: {Number(selectedNote.tongTienNhap || 0).toLocaleString('vi-VN')} VNĐ</span>
              </div>

              <table className="modal-product-table">
                <thead>
                  <tr>
                    <th>Sản Phẩm</th>
                    <th style={{textAlign: 'right'}}>Giá Nhập</th>
                    <th style={{textAlign: 'center'}}>Số Lượng</th>
                    <th style={{textAlign: 'right'}}>Thành Tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedNote.danhSachHangHoa && selectedNote.danhSachHangHoa.length > 0 ? (
                    selectedNote.danhSachHangHoa.map((item, index) => (
                      <tr key={index}>
                        <td>{item.tenSanPham}</td>
                        <td style={{textAlign: 'right'}}>{Number(item.giaNhap || 0).toLocaleString('vi-VN')}</td>
                        <td style={{textAlign: 'center'}}>{item.soLuong}</td>
                        <td style={{textAlign: 'right', fontWeight: 600}}>
                          {Number((item.giaNhap || 0) * (item.soLuong || 0)).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{textAlign: 'center'}}>Không có chi tiết sản phẩm</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-modal-reject" 
                onClick={() => handleReject(selectedNote.id, selectedNote.maPhieuNhap)}
              >
                BÁC BỎ
              </button>
              <button 
                className="btn-modal-approve" 
                onClick={() => handleApprove(selectedNote.id, selectedNote.maPhieuNhap)}
              >
                PHÊ DUYỆT CHI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveImportNote;