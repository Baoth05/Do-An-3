import { useState, useEffect } from 'react';
import { FiCheckSquare, FiTruck, FiBox, FiClock } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ActualExportNote.css';

const ActualExportNote = () => {
  const [pendingNotes, setPendingNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPendingExports();
  }, []);

  const fetchPendingExports = async () => {
    try {
      setIsLoading(true);
      // Giả định API trả về các phiếu đang chờ xuất thực tế (VD: trạng thái CHO_XUAT)
      const res = await wmsCoreService.getExportNotes();
      // Lọc fake các phiếu chưa hoàn thành để làm demo (Bạn tùy chỉnh theo field trạng thái backend thực)
      setPendingNotes((res || []).filter(n => n.trangThai !== 'HOÀN THÀNH'));
    } catch (error) {
      console.warn('Lỗi lấy dữ liệu xuất thực tế:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmExport = async (id) => {
    if (window.confirm('Xác nhận hàng đã được đưa lên xe và rời khỏi kho?')) {
      try {
        // API giả định để cập nhật trạng thái
        // await wmsCoreService.confirmActualExport(id);
        alert('Đã xác nhận xuất kho thành công!');
        fetchPendingExports(); // Reload list
      } catch (err) {
        alert('Lỗi xác nhận: ' + err.message);
      }
    }
  };

  return (
    <div className="actual-export-container">
      <div className="actual-header">
        <h2>Xử Lý Xuất Kho Thực Tế</h2>
        <p>Kiểm đếm hàng hóa tại cửa kho, quét mã vạch và bàn giao cho đơn vị vận chuyển</p>
      </div>

      {isLoading ? (
        <p>Đang tải danh sách chờ xuất...</p>
      ) : pendingNotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
          <FiCheckSquare size={40} color="#16a34a" style={{ marginBottom: '12px' }}/>
          <h3>Không có phiếu xuất nào đang chờ xử lý!</h3>
        </div>
      ) : (
        pendingNotes.map(note => (
          <div key={note.id} className="actual-card">
            <div className="actual-info">
              <h3>Mã Phiếu: {note.maPhieuXuat || `PX-${note.id}`}</h3>
              <p><FiBox /> Đơn hàng tham chiếu: {note.donHangId || '---'}</p>
              <p><FiTruck /> Vận chuyển: {note.tenDonViVanChuyen || 'Đang chờ'}</p>
              <p><FiClock /> Ngày lập: {note.ngayXuat ? new Date(note.ngayXuat).toLocaleDateString() : '---'}</p>
            </div>
            <div>
              <button 
                className="btn-confirm-actual"
                onClick={() => handleConfirmExport(note.id)}
              >
                <FiCheckSquare size={16} /> Xác nhận xuất hàng
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ActualExportNote;