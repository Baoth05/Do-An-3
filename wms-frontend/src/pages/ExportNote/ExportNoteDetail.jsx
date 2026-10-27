import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, FiPrinter, FiFileText, FiCheckCircle, 
  FiMapPin, FiTruck, FiPackage, FiCalendar, FiUser 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ExportNoteForm.css';

const ExportNoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchExportDetail();
  }, [id]);

  const fetchExportDetail = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const realId = String(id).replace('wms-', '').replace('ord-', '');
      const noteRes = await wmsCoreService.getExportNoteById(realId);
      if (noteRes) {
        setNote(noteRes);
      }
    } catch (e) {
      console.warn('Lỗi lấy chi tiết phiếu xuất:', e.message);
      setErrorMsg('Không thể nạp chứng từ phiếu xuất kho từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="export-form-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Đang tải chi tiết chứng từ xuất kho #{id}...</p>
      </div>
    );
  }

  if (errorMsg || !note) {
    return (
      <div className="export-form-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#c53030' }}>{errorMsg || 'Không tìm thấy phiếu xuất này!'}</p>
        <button className="btn-secondary" onClick={() => navigate('/export-notes')} style={{ marginTop: '16px' }}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const code = note.maPhieuXuat || `PX-${note.id}`;
  const orderRef = note.donHangId || 'Xuất trực tiếp';
  const whName = note.tenKhoHang || 'Kho Tổng Trung Tâm';
  const shipName = note.tenDonViVanChuyen || 'Đơn vị vận chuyển';
  const creator = note.nguoiTao || 'Thủ kho xuất';
  const dateFormatted = note.ngayXuat ? new Date(note.ngayXuat).toLocaleString('vi-VN') : '---';
  const items = note.danhSachHangHoa || [];
  const totalAmount = note.tongGiaTri || 0;

  return (
    <div className="export-form-container">
      {/* Header điều hướng */}
      <div className="form-header no-print">
        <div className="form-header-title">
          <button 
            type="button" 
            className="btn-back" 
            onClick={() => navigate('/export-notes')}
            title="Quay lại danh sách"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2>Chi Tiết Lệnh Xuất Kho: {code}</h2>
            <p>Chứng từ hoàn tất đóng gói và bàn giao giao nhận</p>
          </div>
        </div>

        <div className="form-header-actions">
          <button 
            type="button" 
            className="btn-print" 
            onClick={handlePrint}
          >
            <FiPrinter size={16} /> In Phiếu Xuất Kho
          </button>
        </div>
      </div>

      {/* Tờ Phiếu Xuất Kho In Ấn A4 */}
      <div className="receipt-paper">
        <div className="receipt-header">
          <div>
            <h1>PHIẾU XUẤT KHO KIÊM BÀN GIAO VẬN CHUYỂN</h1>
            <p>Hệ thống Quản trị & Điều phối Kho hàng CTUT WMS</p>
          </div>
          <div className="receipt-meta">
            <h3>CHỨNG TỪ XUẤT KHO</h3>
            <span className="code-text">Số Phiếu: {code}</span>
            <span className="date-text">Ngày Xuất: {dateFormatted}</span>
          </div>
        </div>

        <hr className="receipt-divider" />

        <div className="receipt-info-grid">
          <div className="info-block">
            <h4><FiPackage /> THÔNG TIN XUẤT HÀNG</h4>
            <p><strong>Mã Đơn Hàng Liên Kết:</strong> {orderRef}</p>
            <p><FiUser size={12} /> Người lập phiếu: {creator}</p>
            <p>Trạng thái: <strong style={{ color: '#16a34a' }}>{note.trangThai || 'HOÀN THÀNH'}</strong></p>
          </div>

          <div className="info-block">
            <h4><FiTruck /> ĐIỀU PHỐI VẬN CHUYỂN & KHO</h4>
            <p><FiMapPin size={12} /> <strong>Kho Xuất Hàng:</strong> {whName}</p>
            <p><FiTruck size={12} /> <strong>Đơn Vị Giao Vận (3PL):</strong> {shipName}</p>
          </div>
        </div>

        {/* Danh sách mặt hàng xuất */}
        <table className="receipt-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>STT</th>
              <th>Mã SKU</th>
              <th>Tên Hàng Hóa Xuất Kho</th>
              <th>ĐVT</th>
              <th style={{ textAlign: 'center' }}>Số Lượng</th>
              <th style={{ textAlign: 'right' }}>Đơn Giá</th>
              <th style={{ textAlign: 'right' }}>Thành Tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                  Không có mặt hàng nào trong phiếu xuất.
                </td>
              </tr>
            ) : (
              items.map((it, idx) => {
                const sku = it.sku || `SP-${it.sanPhamId}`;
                const name = it.tenSanPham || 'Sản phẩm';
                const unit = it.donViTinh || 'Cái';
                const qty = Number(it.soLuong || 0);
                const price = Number(it.donGia || 0);
                const total = Number(it.thanhTien || price * qty);

                return (
                  <tr key={it.id || idx}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td><strong>{sku}</strong></td>
                    <td>{name}</td>
                    <td>{unit}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{qty}</td>
                    <td style={{ textAlign: 'right' }}>{price > 0 ? price.toLocaleString('vi-VN') + ' đ' : '---'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{total > 0 ? total.toLocaleString('vi-VN') + ' đ' : '---'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {totalAmount > 0 && (
            <tfoot>
              <tr>
                <td colSpan="6" style={{ textAlign: 'right', fontWeight: 700 }}>TỔNG GIÁ TRỊ XUẤT KHO:</td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                  {Number(totalAmount).toLocaleString('vi-VN')} đ
                </td>
              </tr>
            </tfoot>
          )}
        </table>

        {/* Chữ ký xác nhận */}
        <div className="receipt-signatures">
          <div className="sign-box">
            <strong>Bưu Tá Nhận Hàng</strong>
            <small>(Ký và ghi rõ họ tên)</small>
          </div>
          <div className="sign-box">
            <strong>Thủ Kho Xuất Hàng</strong>
            <small>(Ký và ghi rõ họ tên)</small>
            <p style={{ marginTop: '50px' }}>{creator}</p>
          </div>
          <div className="sign-box">
            <strong>Kế Toán / Giám Sát</strong>
            <small>(Ký và ghi rõ họ tên)</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportNoteDetail;
