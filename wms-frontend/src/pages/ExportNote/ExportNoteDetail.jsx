/**
 * ==============================================================================
 * Module: ExportNoteDetail.jsx
 * Mô tả: Giao diện Chi tiết / Giấy In Phiếu Xuất Kho chuẩn Doanh Nghiệp.
 * ==============================================================================
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, FiPrinter, FiUser, FiTruck, FiPackage, 
  FiMapPin, FiShoppingBag, FiCalendar, FiFileText 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ExportNoteDetail.css';

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

  if (isLoading || !note) {
    return (
      <div className="export-detail-container" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: '#64748b' }}>Đang nạp chi tiết phiếu xuất kho...</p>
      </div>
    );
  }

  const exportCode = note.maPhieuXuat || note.maPhieu || `PX-${note.id}`;
  const exportDate = note.ngayXuat ? new Date(note.ngayXuat).toLocaleDateString('vi-VN') : '10/11/2026';
  const storeName = note.tenCuaHangNhan || note.cuaHangNhan || 'Shop chuyên bán IT';
  const storeAddress = note.diaChiNhan || 'Đường 32B D.Trần Hưng Đạo, Tp.HCM';

  return (
    <div className="export-detail-container">
      {/* Header Điều Hướng (Không in khi bấm Print) */}
      <div className="form-header no-print">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-back" onClick={() => navigate('/export-notes')}>
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>
              Chi Tiết Phiếu Xuất Kho: {exportCode}
            </h2>
          </div>
        </div>
        <button className="btn-print" onClick={handlePrint}>
          <FiPrinter size={16} /> In Phiếu Xuất Kho
        </button>
      </div>

      {/* Mẫu Giấy In Phiếu Xuất (Receipt Paper) */}
      <div className="receipt-paper">
        <div className="receipt-header">
          <div>
            <h1>PHIẾU XUẤT KHO VẬN HÀNH</h1>
            <p>Hệ thống Quản lý Kho CTUT WMS Core</p>
          </div>
          <div className="receipt-meta">
            <h3>Mã phiếu: {exportCode}</h3>
            <span>Ngày tạo: {exportDate}</span>
          </div>
        </div>

        <hr className="receipt-divider" />

        {/* Khối Thông Tin 3 Cột / 3 Phần */}
        <div className="receipt-info-grid">
          {/* Thông tin đơn hàng */}
          <div className="info-block">
            <h4><FiFileText size={15} /> THÔNG TIN XUẤT HÀNG</h4>
            <p><strong>Mã Đơn Hàng:</strong> {note.donHangId || 'DH-48ACA371'}</p>
            <p><FiUser size={13}/> <strong>Người Lập Yêu Cầu:</strong> {note.nguoiTao || 'Hệ thống Đơn hàng (Order Service)'}</p>
            <p><FiCalendar size={13}/> <strong>Ngày Xuất Kho:</strong> {exportDate}</p>
          </div>

          {/* Thông tin Kho xuất (Gửi) */}
          <div className="info-block">
            <h4><FiPackage size={15} /> NƠI GỬI (KHO XUẤT)</h4>
            <p><FiMapPin size={13}/> <strong>Kho Xuất:</strong> {note.tenKhoHang || 'SLO (Kho Vật Lý)'}</p>
            <p><FiTruck size={13}/> <strong>Đơn Vị Vận Chuyển:</strong> {note.tenDonViVanChuyen || 'Sếp Hưng Shipper'}</p>
          </div>

          {/* BỔ SUNG: Thông tin Nơi Nhận Hàng & Địa Chỉ */}
          <div className="info-block highlight-store">
            <h4><FiShoppingBag size={15} /> NƠI NHẬN HÀNG (CỬA HÀNG)</h4>
            <p><strong>Cửa Hàng Đích:</strong> {storeName}</p>
            <p><FiMapPin size={13}/> <strong>Địa Chỉ Nhận:</strong> {storeAddress}</p>
          </div>
        </div>

        {/* Bảng Danh Sách Sản Phẩm */}
        <table className="receipt-table">
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
              <th style={{ width: '130px' }}>Mã Hàng (SKU)</th>
              <th>Tên Sản Phẩm Cần Xuất</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Số Lượng</th>
            </tr>
          </thead>
          <tbody>
            {(note.danhSachHangHoa || [
              {
                sanPhamId: 1,
                sku: 'msi-06',
                tenSanPham: 'Laptop Msi Crosshair A16 HX MLG Edition E8WGK - 093VN (Ryzen 9 8940HX/ GeForce RTX™ 5070/ 16GB/ 1TB/ Windows 11 Home)',
                soLuong: 1
              }
            ]).map((it, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{it.sku || `SP-${it.sanPhamId}`}</td>
                <td>{it.tenSanPham || 'Sản phẩm xuất kho'}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px' }}>{it.soLuong}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Chữ Ký Xác Nhận */}
        <div className="receipt-signatures">
          <div className="sign-box">
            <strong>Người Nhận Hàng (Cửa Hàng)</strong>
            <br/><small>(Ký và ghi rõ họ tên)</small>
          </div>
          <div className="sign-box">
            <strong>Đơn Vị Vận Chuyển</strong>
            <br/><small>(Ký và ghi rõ họ tên)</small>
          </div>
          <div className="sign-box">
            <strong>Thủ Kho Xuất</strong>
            <br/><small>(Ký và ghi rõ họ tên)</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportNoteDetail;