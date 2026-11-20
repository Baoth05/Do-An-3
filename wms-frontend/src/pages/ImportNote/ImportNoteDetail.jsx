// src/pages/ImportNote/ImportNoteDetail.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, FiPrinter, FiMapPin, 
  FiTruck, FiUser, FiHome, FiPhone, FiBox
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ImportNoteDetail.css';

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
      if (noteRes) setNote(noteRes);
    } catch (e) {
      setErrorMsg('Không thể nạp chứng từ phiếu nhập từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div style={{ padding: '60px', textAlign: 'center' }}>Đang tải chi tiết phiếu...</div>;
  if (errorMsg || !note) return <div style={{ padding: '60px', textAlign: 'center', color: 'red' }}>{errorMsg || 'Không tìm thấy phiếu!'}</div>;

  const code = note.maPhieuNhap || `PN-${note.id}`;
  const totalAmount = note.tongTienNhap || 0;
  const items = note.danhSachHangHoa || [];
  
  return (
    <div className="import-detail-wrapper">
      <div className="import-form-container">
        
        {/* Header điều hướng không in ra giấy */}
        <div className="form-header no-print">
          <div className="form-header-title">
            <button type="button" className="btn-back" onClick={() => navigate('/import-notes')} title="Quay lại">
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h2>Chi Tiết Chứng Từ: {code}</h2>
              <p>Trạng thái: <strong style={{ color: '#2563eb' }}>{note.trangThai || 'ĐÃ NHẬP KHO'}</strong></p>
            </div>
          </div>
          <button type="button" className="btn-print" onClick={() => window.print()}>
            <FiPrinter size={18} /> In Biên Bản
          </button>
        </div>

        {/* Tờ Phiếu A4 */}
        <div className="receipt-paper">
          <div className="receipt-header">
            <div>
              <h1>HỆ THỐNG QUẢN LÝ KHO CTUT WMS</h1>
              <p>Phân hệ Kho Bãi Trung Tâm - Cổng In Ấn</p>
            </div>
            <div className="receipt-meta">
              <h3>PHIẾU NHẬP KHO</h3>
              <span>Mã Phiếu: <strong>{code}</strong></span>
              <span>Ngày Tạo: {note.ngayNhap ? new Date(note.ngayNhap).toLocaleDateString('vi-VN') : '---'}</span>
            </div>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-info-grid">
            <div className="info-block">
              <h4><FiTruck size={16}/> ĐƠN VỊ GIAO HÀNG (NCC)</h4>
              <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{note.tenNhaCungCap || 'Chưa xác định'}</p>
              <p><FiMapPin size={14} style={{ color: '#64748b' }}/> {note.diaChiNhaCungCap || 'Toàn quốc'}</p>
              <p><FiPhone size={14} style={{ color: '#64748b' }}/> Hotline: {note.sdtNhaCungCap || '---'}</p>
            </div>

            <div className="info-block">
              <h4><FiHome size={16}/> KHO LƯU TRỮ & TIẾP NHẬN</h4>
              <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{note.tenKhoHang || 'Kho Tổng Trung Tâm'}</p>
              <p><FiMapPin size={14} style={{ color: '#64748b' }}/> {note.diaChiKho || 'Chưa cập nhật địa chỉ'}</p>
              <p><FiUser size={14} style={{ color: '#64748b' }}/> Phụ trách: {note.nguoiTao || 'Thủ kho trưởng'}</p>
            </div>
          </div>

          <table className="receipt-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>STT</th>
                <th>Mã Hàng (SKU)</th>
                <th style={{ width: '35%' }}>Tên Sản Phẩm / Thiết Bị</th>
                <th>ĐVT</th>
                <th style={{ textAlign: 'center' }}>Số Lượng</th>
                <th style={{ textAlign: 'right' }}>Đơn Giá (VNĐ)</th>
                <th style={{ textAlign: 'right' }}>Thành Tiền (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const price = Number(it.giaNhap || 0);
                const qty = Number(it.soLuong || 0);
                return (
                  <tr key={it.id || idx}>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                    <td><strong>{it.sku || `SP-${it.sanPhamId}`}</strong></td>
                    <td style={{ fontWeight: 500 }}>{it.tenSanPham || 'Sản phẩm'}</td>
                    <td style={{ textAlign: 'center' }}>{it.donViTinh || 'Cái'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px' }}>{qty}</td>
                    <td style={{ textAlign: 'right' }}>{price.toLocaleString('vi-VN')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>{(price * qty).toLocaleString('vi-VN')}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="6" style={{ textAlign: 'right', fontWeight: 700, paddingTop: '16px' }}>TỔNG GIÁ TRỊ NHẬP KHO:</td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '18px', paddingTop: '16px' }}>
                  {Number(totalAmount).toLocaleString('vi-VN')} đ
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="receipt-signatures">
            <div className="sign-box">
              <strong>ĐẠI DIỆN GIAO HÀNG</strong>
              <small>(Ký và ghi rõ họ tên)</small>
            </div>
            <div className="sign-box">
              <strong>THỦ KHO TIẾP NHẬN</strong>
              <small>(Ký và ghi rõ họ tên)</small>
              <p style={{ marginTop: '70px', fontWeight: 'bold' }}>{note.nguoiTao || 'Thủ kho'}</p>
            </div>
            <div className="sign-box">
              <strong>KẾ TOÁN KIỂM SOÁT</strong>
              <small>(Ký và ghi rõ họ tên)</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportNoteDetail;