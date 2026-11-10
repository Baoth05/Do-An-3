import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiPrinter, FiUser, FiTruck, FiPackage, FiMapPin } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ExportNoteDetail.css'; // Đã cập nhật import

const ExportNoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchExportDetail();
  }, [id]);

  const fetchExportDetail = async () => {
    try {
      setIsLoading(true);
      const noteRes = await wmsCoreService.getExportNoteById(id.replace(/\D/g, ''));
      if (noteRes) setNote(noteRes);
    } catch (e) {
      console.warn('Lỗi lấy chi tiết phiếu xuất:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (isLoading || !note) return <div className="export-detail-container"><p>Đang tải dữ liệu...</p></div>;

  return (
    <div className="export-detail-container">
      <div className="form-header no-print">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-back" onClick={() => navigate('/export-notes')}><FiArrowLeft /></button>
          <div>
            <h2 style={{ margin: 0 }}>Chi Tiết Phiếu Xuất: {note.maPhieuXuat || `PX-${note.id}`}</h2>
          </div>
        </div>
        <button className="btn-print" onClick={handlePrint}><FiPrinter /> In Phiếu</button>
      </div>

      <div className="receipt-paper">
        <div className="receipt-header">
          <div>
            <h1>PHIẾU XUẤT KHO</h1>
            <p>Hệ thống WMS Core</p>
          </div>
          <div className="receipt-meta">
            <h3>Mã phiếu: {note.maPhieuXuat || `PX-${note.id}`}</h3>
            <span>Ngày: {note.ngayXuat ? new Date(note.ngayXuat).toLocaleDateString('vi-VN') : '---'}</span>
          </div>
        </div>

        <hr className="receipt-divider" />

        <div className="receipt-info-grid">
          <div className="info-block">
            <h4><FiPackage /> THÔNG TIN XUẤT</h4>
            <p><strong>Đơn Hàng:</strong> {note.donHangId || '---'}</p>
            <p><FiUser size={12}/> Người lập: {note.nguoiTao || 'Thủ kho'}</p>
          </div>
          <div className="info-block">
            <h4><FiTruck /> GIAO NHẬN</h4>
            <p><FiMapPin size={12}/> Kho xuất: {note.tenKhoHang || 'Kho Tổng'}</p>
            <p><FiTruck size={12}/> Vận chuyển: {note.tenDonViVanChuyen || 'Đơn vị vận chuyển'}</p>
          </div>
        </div>

        <table className="receipt-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã Hàng</th>
              <th>Tên Sản Phẩm</th>
              <th>SL</th>
            </tr>
          </thead>
          <tbody>
            {(note.danhSachHangHoa || []).map((it, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                <td>{it.sku || `SP-${it.sanPhamId}`}</td>
                <td>{it.tenSanPham || 'Sản phẩm'}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{it.soLuong}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-signatures">
          <div className="sign-box"><strong>Người Nhận Hàng</strong><br/><small>(Ký và ghi rõ họ tên)</small></div>
          <div className="sign-box"><strong>Thủ Kho Xuất</strong><br/><small>(Ký và ghi rõ họ tên)</small></div>
        </div>
      </div>
    </div>
  );
};

export default ExportNoteDetail;