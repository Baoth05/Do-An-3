import { useState, useEffect } from 'react';
import { 
  FiCheckSquare, FiTruck, FiBox, FiClock, 
  FiMapPin, FiUser, FiHome, FiList, FiFileText
} from 'react-icons/fi';
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
      const res = await wmsCoreService.getExportNotes();
      
      // Lọc các phiếu cần xuất thực tế (Ví dụ: Trạng thái CHỜ DUYỆT hoặc CHỜ XUẤT)
      setPendingNotes((res || []).filter(n => n.trangThai !== 'HOÀN THÀNH'));
    } catch (error) {
      console.warn('Lỗi lấy dữ liệu xuất thực tế:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmExport = async (id) => {
    if (window.confirm('Xác nhận hàng hóa đã được kiểm đếm, đưa lên xe và rời khỏi kho?')) {
      try {
        // Gọi API xác nhận xuất thực tế ở đây
        // await wmsCoreService.confirmActualExport(id);
        alert('Đã xác nhận xuất kho thành công!');
        fetchPendingExports(); 
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
        <p style={{ color: '#64748b' }}>Đang tải danh sách chờ xuất...</p>
      ) : pendingNotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <FiCheckSquare size={48} color="#16a34a" style={{ marginBottom: '16px' }}/>
          <h3 style={{ color: '#334155', margin: 0 }}>Không có phiếu xuất nào đang chờ xử lý!</h3>
          <p style={{ color: '#64748b', marginTop: '8px' }}>Tất cả hàng hóa đã được xuất kho hoàn tất.</p>
        </div>
      ) : (
        pendingNotes.map(note => (
          <div key={note.id} className="actual-card">
            
            {/* Header Thẻ */}
            <div className="card-header-top">
              <h3><FiFileText size={20} color="#3b82f6" /> {note.maPhieuXuat || `PX-${note.id}`}</h3>
              <span className="status-badge">CHỜ XUẤT KHO</span>
            </div>

            {/* Thông tin chung (Grid 2 cột) */}
            <div className="card-body-grid">
              {/* Cột 1: Thông tin chứng từ */}
              <div className="info-group">
                <div className="info-item">
                  <FiBox size={16} />
                  <div>
                    <span className="info-label">Đơn hàng tham chiếu:</span> 
                    {note.donHangId || 'Không có'}
                  </div>
                </div>
                <div className="info-item">
                  <FiClock size={16} />
                  <div>
                    <span className="info-label">Ngày lập phiếu:</span> 
                    {note.ngayXuat ? new Date(note.ngayXuat).toLocaleString('vi-VN') : '---'}
                  </div>
                </div>
                <div className="info-item">
                  <FiUser size={16} />
                  <div>
                    <span className="info-label">Người tạo:</span> 
                    {note.nguoiTao || 'Hệ thống'}
                  </div>
                </div>
              </div>

              {/* Cột 2: Thông tin kho & Vận chuyển */}
              <div className="info-group">
                <div className="info-item">
                  <FiHome size={16} />
                  <div>
                    <span className="info-label">Xuất từ kho:</span> 
                    {/* Tùy chỉnh theo JSON của bạn, VD: note.khoHang?.tenKho */}
                    {note.tenKhoHang || 'Kho trung tâm'} 
                  </div>
                </div>
                <div className="info-item">
                  <FiTruck size={16} />
                  <div>
                    <span className="info-label">ĐV Vận chuyển:</span> 
                    {note.tenDonViVanChuyen || 'Chưa cập nhật'}
                  </div>
                </div>
                <div className="info-item">
                  <FiMapPin size={16} />
                  <div>
                    <span className="info-label">Nơi nhận (Dự kiến):</span> 
                    {note.diaChiNhan || 'Theo địa chỉ đơn hàng'}
                  </div>
                </div>
              </div>
            </div>

            {/* Chi tiết hàng hóa cần xuất */}
            <div className="card-products">
              <h4><FiList size={16} /> Danh sách hàng hóa cần bàn giao</h4>
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Mã SKU</th>
                    <th>Tên sản phẩm</th>
                    <th>ĐVT</th>
                    <th style={{ textAlign: 'center' }}>Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Kiểm tra xem API có trả về danhSachHangHoa không */}
                  {note.danhSachHangHoa && note.danhSachHangHoa.length > 0 ? (
                    note.danhSachHangHoa.map((item, index) => (
                      <tr key={index}>
                        <td><strong>{item.sku || '---'}</strong></td>
                        <td>{item.tenSanPham}</td>
                        <td>{item.donViTinh || 'Cái'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#0f172a' }}>
                          {item.soLuong}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                        Không có chi tiết mặt hàng hoặc cần API Join bảng chi tiết.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Chân thẻ chứa nút hành động */}
            <div className="card-footer-bottom">
              <button 
                className="btn-confirm-actual"
                onClick={() => handleConfirmExport(note.id)}
              >
                <FiCheckSquare size={18} /> Xác nhận xuất hàng
              </button>
            </div>

          </div>
        ))
      )}
    </div>
  );
};

export default ActualExportNote;