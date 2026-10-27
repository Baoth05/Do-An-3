import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, FiPrinter, FiFileText, FiCheckCircle, 
  FiMapPin, FiTruck, FiUser, FiCalendar 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ImportNoteForm.css';

const ImportNoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchNoteDetail();
  }, [id]);

  const fetchNoteDetail = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const noteRes = await wmsCoreService.getImportNoteById(id);
      if (noteRes) {
        setNote(noteRes);
      }
    } catch (e) {
      console.warn('Lỗi lấy chi tiết phiếu nhập:', e.message);
      setErrorMsg('Không thể nạp chứng từ phiếu nhập từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="import-form-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Đang tải chi tiết phiếu nhập kho #{id}...</p>
      </div>
    );
  }

  if (errorMsg || !note) {
    return (
      <div className="import-form-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#c53030' }}>{errorMsg || 'Không tìm thấy phiếu nhập này!'}</p>
        <button className="btn-secondary" onClick={() => navigate('/import-notes')} style={{ marginTop: '16px' }}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const code = note.maPhieuNhap || `PN-${note.id}`;
  const supplierName = note.tenNhaCungCap || 'Chưa xác định';
  const supplierPhone = note.sdtNhaCungCap || '---';
  const supplierAddress = note.diaChiNhaCungCap || 'Toàn quốc';
  const warehouseName = note.tenKhoHang || 'Kho Tổng Trung Tâm';
  const warehouseAddress = note.diaChiKho || '';
  const totalAmount = note.tongTienNhap || 0;
  const items = note.danhSachHangHoa || [];
  const dateFormatted = note.ngayNhap ? new Date(note.ngayNhap).toLocaleString('vi-VN') : '---';

  return (
    <div className="import-form-container">
      {/* Header điều hướng */}
      <div className="form-header no-print">
        <div className="form-header-title">
          <button 
            type="button" 
            className="btn-back" 
            onClick={() => navigate('/import-notes')}
            title="Quay lại danh sách"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2>Chi Tiết Chứng Từ: {code}</h2>
            <p>Hồ sơ chứng từ nhập kho vật lý</p>
          </div>
        </div>

        <div className="form-header-actions">
          <button 
            type="button" 
            className="btn-print" 
            onClick={handlePrint}
          >
            <FiPrinter size={16} /> In Phiếu Nhập
          </button>
        </div>
      </div>

      {/* Tờ Phiếu Nhập Kho A4 Chuẩn */}
      <div className="receipt-paper">
        <div className="receipt-header">
          <div>
            <h1>HỆ THỐNG PHÂN HỆ QUẢN LÝ KHO CTUT WMS</h1>
            <p>Đồ án tốt nghiệp / Phân hệ Lõi Kho Bãi wms-core-service (Port 8081)</p>
          </div>
          <div className="receipt-meta">
            <h3>PHIẾU NHẬP KHO</h3>
            <span className="code-text">Mã: {code}</span>
            <span className="date-text">Ngày: {dateFormatted}</span>
          </div>
        </div>

        <hr className="receipt-divider" />

        <div className="receipt-info-grid">
          <div className="info-block">
            <h4><FiTruck /> ĐƠN VỊ CUNG CẤP HÀNG</h4>
            <p><strong>{supplierName}</strong></p>
            <p><FiMapPin size={12} /> Địa chỉ: {supplierAddress}</p>
            <p>Điện thoại: {supplierPhone}</p>
          </div>

          <div className="info-block">
            <h4><FiMapPin /> KHO NHẬN HÀNG</h4>
            <p><strong>{warehouseName}</strong></p>
            {warehouseAddress && <p>Địa chỉ: {warehouseAddress}</p>}
            <p><FiUser size={12} /> Người lập chứng từ: {note.nguoiTao || 'Thủ kho'}</p>
            <p>Trạng thái: <strong style={{ color: '#16a34a' }}>{note.trangThai || 'ĐÃ NHẬP KHO'}</strong></p>
          </div>
        </div>

        {/* Bảng kê danh mục sản phẩm */}
        <table className="receipt-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>STT</th>
              <th>Mã SKU</th>
              <th>Tên Hàng Hóa / Thiết Bị</th>
              <th>Đơn Vị Tính</th>
              <th style={{ textAlign: 'center' }}>Số Lượng</th>
              <th style={{ textAlign: 'right' }}>Đơn Giá Nhập</th>
              <th style={{ textAlign: 'right' }}>Thành Tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                  Không có mặt hàng nào trong phiếu.
                </td>
              </tr>
            ) : (
              items.map((it, idx) => {
                const sku = it.sku || `SP-${it.sanPhamId}`;
                const name = it.tenSanPham || 'Sản phẩm';
                const unit = it.donViTinh || 'Cái';
                const price = Number(it.giaNhap || 0);
                const qty = Number(it.soLuong || 0);
                const total = Number(it.thanhTien || price * qty);

                return (
                  <tr key={it.id || idx}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td><strong>{sku}</strong></td>
                    <td>{name}</td>
                    <td>{unit}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{qty}</td>
                    <td style={{ textAlign: 'right' }}>{price.toLocaleString('vi-VN')} đ</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{total.toLocaleString('vi-VN')} đ</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="6" style={{ textAlign: 'right', fontWeight: 700 }}>TỔNG CỘNG TIỀN NHẬP:</td>
              <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                {Number(totalAmount).toLocaleString('vi-VN')} đ
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Chữ ký xác nhận */}
        <div className="receipt-signatures">
          <div className="sign-box">
            <strong>Người Giao Hàng</strong>
            <small>(Ký và ghi rõ họ tên)</small>
          </div>
          <div className="sign-box">
            <strong>Thủ Kho Nhận Hàng</strong>
            <small>(Ký và ghi rõ họ tên)</small>
            <p style={{ marginTop: '50px' }}>{note.nguoiTao || 'Thủ kho'}</p>
          </div>
          <div className="sign-box">
            <strong>Kế Toán Trưởng</strong>
            <small>(Ký và ghi rõ họ tên)</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportNoteDetail;
