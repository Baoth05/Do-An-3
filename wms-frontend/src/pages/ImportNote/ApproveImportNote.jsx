// src/pages/ImportNote/ApproveImportNote.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiEye, FiUser, FiTruck, FiCalendar, FiDollarSign, FiBox } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ApproveImportNote.css';

const ApproveImportNote = () => {
  const navigate = useNavigate();
  const [pendingNotes, setPendingNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
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

  const openInspectModal = (note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNote(null);
  };

  const handleApprove = async (id, code) => {
    if (window.confirm(`Xác nhận PHÊ DUYỆT yêu cầu ${code}?`)) {
      try {
        await wmsCoreService.updateImportNoteStatus(id, 'DA_DUYET');
        alert('Đã phê duyệt yêu cầu nhập kho thành công!');
        closeModal();
        fetchPendingNotes();
      } catch (err) {
        alert('Lỗi phê duyệt: ' + err.message);
      }
    }
  };

  const handleReject = async (id, code) => {
    if (window.confirm(`Xác nhận TỪ CHỐI yêu cầu ${code}?`)) {
      try {
        await wmsCoreService.updateImportNoteStatus(id, 'TU_CHOI');
        alert('Đã từ chối yêu cầu nhập kho.');
        closeModal();
        fetchPendingNotes();
      } catch (err) {
        alert('Lỗi khi từ chối: ' + err.message);
      }
    }
  };

  // Cập nhật hàm renderStatusBadge: xử lý an toàn hơn
  const renderStatusBadge = (tonThucTe) => {
      // Nếu không có dữ liệu thật, chúng ta coi như là 0 để gợi ý an toàn
      const stock = tonThucTe != null ? Number(tonThucTe) : 0; 

      if (stock <= 0) {
        return <span className="ref-badge badge-danger">Hết Hàng</span>;
      }
      if (stock > 0 && stock <= 10) { 
         return <span className="ref-badge badge-warning">Cạn Kho</span>;
      }
      
      return <span className="ref-badge badge-success">Đủ Hàng</span>;
  };

  return (
    <div className="import-container">
      <div className="import-header">
        <div>
          <h2>Duyệt Đề Xuất Mua Hàng</h2>
          <p>Đang có {pendingNotes.length} đề xuất cần xem xét</p>
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
                         <span className="ref-badge badge-warning">
                           Chờ Duyệt
                         </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn-inspect" onClick={() => openInspectModal(note)}>
                          <FiEye /> Kiểm tra chi tiết
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
              <div>
                <span className="modal-subtitle">Chi tiết phiếu đề xuất</span>
                <h3>{selectedNote.maPhieuNhap || `PN-${selectedNote.id}`}</h3>
              </div>
              <button className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-icon"><FiUser /></div>
                  <div>
                    <span className="info-label">Người lập phiếu</span>
                    <strong>{selectedNote.nguoiTao || 'Chưa cập nhật'}</strong>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon"><FiTruck /></div>
                  <div>
                    <span className="info-label">Nhà cung cấp</span>
                    <strong>{selectedNote.tenNhaCungCap || 'Chưa cập nhật'}</strong>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon"><FiCalendar /></div>
                  <div>
                    <span className="info-label">Ngày lập</span>
                    <strong>{selectedNote.ngayNhap ? new Date(selectedNote.ngayNhap).toLocaleString('vi-VN') : '---'}</strong>
                  </div>
                </div>
              </div>

              <div className="total-budget-box">
                <div className="budget-icon"><FiDollarSign /></div>
                <div className="budget-text">
                  <span>Tổng ngân sách đề xuất</span>
                  <h2>{Number(selectedNote.tongTienNhap || 0).toLocaleString('vi-VN')} VNĐ</h2>
                </div>
              </div>

              <div className="modal-table-wrapper">
                <table className="modal-product-table">
                  <thead>
                    <tr>
                      <th>Sản Phẩm</th>
                      <th style={{textAlign: 'center'}}>Tồn Hiện Tại</th>
                      <th style={{textAlign: 'center'}}>Đánh Giá</th>
                      <th style={{textAlign: 'right'}}>Đơn Giá Nhập</th>
                      <th style={{textAlign: 'center'}}>SL Cần Mua</th>
                      <th style={{textAlign: 'right'}}>Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedNote.danhSachHangHoa && selectedNote.danhSachHangHoa.length > 0 ? (
                      selectedNote.danhSachHangHoa.map((item, index) => {
                          // Bắt nhiều trường hợp tên biến từ Backend trả về
                          const tonThucTe = item.tonKho ?? item.soLuongTon ?? item.soLuongThucTe ?? item.tonThucTe ?? 0;

                          return (
                            <tr key={index}>
                              <td>
                                <div className="product-name-cell">
                                  <FiBox className="product-icon" />
                                  <span>{item.tenSanPham || 'Sản phẩm không tên'}</span>
                                </div>
                              </td>
                              <td style={{textAlign: 'center'}}>
                                <span className="stock-number">{tonThucTe}</span>
                              </td>
                              <td style={{textAlign: 'center'}}>
                                {renderStatusBadge(tonThucTe)}
                              </td>
                              <td style={{textAlign: 'right', color: '#64748b'}}>
                                {Number(item.giaNhap || 0).toLocaleString('vi-VN')}
                              </td>
                              <td style={{textAlign: 'center'}}>
                                <span className="qty-number">{item.soLuong}</span>
                              </td>
                              <td style={{textAlign: 'right', fontWeight: 600, color: '#0f172a'}}>
                                {Number((item.giaNhap || 0) * (item.soLuong || 0)).toLocaleString('vi-VN')} đ
                              </td>
                            </tr>
                          );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" style={{textAlign: 'center', padding: '30px', color: '#94a3b8'}}>
                          Chưa có sản phẩm nào trong đề xuất này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-modal-reject" 
                onClick={() => handleReject(selectedNote.id, selectedNote.maPhieuNhap)}
              >
                BÁC BỎ ĐỀ XUẤT
              </button>
              <button 
                className="btn-modal-approve" 
                onClick={() => handleApprove(selectedNote.id, selectedNote.maPhieuNhap)}
              >
                PHÊ DUYỆT CHI TIỀN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveImportNote;