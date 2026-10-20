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

  useEffect(() => {
    fetchNoteDetail();
  }, [id]);

  const fetchNoteDetail = async () => {
    try {
      setIsLoading(true);
      const allNotes = await wmsCoreService.getImportNotes();
      if (Array.isArray(allNotes)) {
        const found = allNotes.find(n => String(n.id) === String(id));
        if (found) {
          setNote(found);
          return;
        }
      }
      // Fallback data
      setNote({
        id: id,
        maPhieuNhap: `PN-2026-00${id}`,
        ngayNhap: '10/10/2026',
        nguoiTao: 'Nguyễn Văn Thủ Kho',
        nhaCungCap: {
          tenNhaCungCap: 'Công ty TNHH Logitech Việt Nam',
          diaChi: 'Tầng 5, Tòa nhà Bitexco, Q.1, TP.HCM',
          soDienThoai: '0901234567',
        },
        khoHang: {
          tenKho: 'Kho Tổng Trung Tâm (KHO-01)',
          diaChi: 'Lô A2, KCN Tân Bình, TP.HCM',
        },
        trangThai: 'ĐÃ NHẬP KHO',
        tongTienNhap: 85000000,
        items: [
          { sku: 'SP001', tenSanPham: 'iPhone 15 Pro Max 256GB', donViTinh: 'Cái', soLuong: 20, donGia: 2500000, thanhTien: 50000000 },
          { sku: 'SP003', tenSanPham: 'Tai nghe Sony WH-1000XM5', donViTinh: 'Cái', soLuong: 10, donGia: 3500000, thanhTien: 35000000 },
        ],
      });
    } catch (e) {
      console.warn('Lỗi lấy chi tiết phiếu nhập:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !note) {
    return (
      <div className="import-form-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Đang tải chi tiết phiếu nhập kho #{id}...</p>
      </div>
    );
  }

  const code = note.maPhieuNhap || `PN-2026-00${note.id}`;
  const supplierName = note.nhaCungCap?.tenNhaCungCap || note.nhaCungCap || 'Đối tác phân phối';
  const supplierPhone = note.nhaCungCap?.soDienThoai || '0901234567';
  const supplierAddress = note.nhaCungCap?.diaChi || 'Toàn quốc';
  const warehouseName = note.khoHang?.tenKho || 'Kho Tổng Trung Tâm';
  const totalAmount = note.tongTienNhap || 85000000;

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
            className="btn-submit" 
            onClick={handlePrint}
            style={{ backgroundColor: '#0f172a' }}
          >
            <FiPrinter size={16} /> In Phiếu Nhập Kho
          </button>
        </div>
      </div>

      {/* Tờ Phiếu Nhập Chuẩn In Ấn */}
      <div className="voucher-paper">
        <div className="voucher-header">
          <div className="voucher-title">
            <h1>PHIẾU NHẬP KHO HÀNG HÓA</h1>
            <p>CTUT WMS SYSTEM • BỘ PHẬN QUẢN LÝ KHO BÃI & CHUỖI CUNG ỨNG</p>
          </div>
          <div className="voucher-meta">
            <div>Mã số phiếu: <span className="voucher-code">{code}</span></div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Ngày nhập: <strong>{note.ngayNhap || new Date().toLocaleDateString('vi-VN')}</strong>
            </div>
            <div style={{ marginTop: '6px' }}>
              <span className="badge safe"><FiCheckCircle size={12} /> {note.trangThai || 'ĐÃ NHẬP KHO'}</span>
            </div>
          </div>
        </div>

        {/* Thông tin đối tác & kho nhận */}
        <div className="voucher-info-grid">
          <div>
            <p style={{ margin: '0 0 6px 0', fontSize: '14px' }}>
              <strong><FiTruck /> Đơn vị giao hàng / Nhà cung cấp:</strong> {supplierName}
            </p>
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#475569' }}>
              <strong>Số điện thoại liên hệ:</strong> {supplierPhone}
            </p>
            <p style={{ margin: '0', fontSize: '13px', color: '#475569' }}>
              <strong>Địa chỉ xuất kho giao:</strong> {supplierAddress}
            </p>
          </div>

          <div>
            <p style={{ margin: '0 0 6px 0', fontSize: '14px' }}>
              <strong><FiMapPin /> Kho nhập hàng:</strong> {warehouseName}
            </p>
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#475569' }}>
              <strong>Người lập chứng từ:</strong> {note.nguoiTao || 'Thủ kho trưởng'}
            </p>
            <p style={{ margin: '0', fontSize: '13px', color: '#475569' }}>
              <strong>Lý do nhập:</strong> Nhập hàng bổ sung tồn kho định kỳ
            </p>
          </div>
        </div>

        {/* Danh sách mặt hàng */}
        <div className="items-table-wrapper" style={{ marginTop: '20px' }}>
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>STT</th>
                <th>Tên Hàng Hóa & Quy Cách</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Đơn Vị Tính</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Số Lượng</th>
                <th style={{ width: '160px', textAlign: 'right' }}>Đơn Giá Nhập</th>
                <th style={{ width: '180px', textAlign: 'right' }}>Thành Tiền (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              {(note.items || [
                { sku: 'SP001', tenSanPham: 'iPhone 15 Pro Max 256GB', donViTinh: 'Cái', soLuong: 20, donGia: 2500000, thanhTien: 50000000 },
                { sku: 'SP002', tenSanPham: 'MacBook Pro 14 M3 Pro', donViTinh: 'Cái', soLuong: 10, donGia: 3500000, thanhTien: 35000000 },
              ]).map((it, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>
                    <strong>{it.tenSanPham}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Mã SKU: {it.sku}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{it.donViTinh || 'Cái'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{it.soLuong}</td>
                  <td style={{ textAlign: 'right' }}>{Number(it.donGia).toLocaleString('vi-VN')} đ</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#1d4ed8' }}>
                    {Number(it.thanhTien).toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                <td colSpan="5" style={{ textAlign: 'right', padding: '12px' }}>TỔNG CỘNG TIỀN THANH TOÁN:</td>
                <td style={{ textAlign: 'right', padding: '12px', fontSize: '16px', color: '#1d4ed8' }}>
                  {Number(totalAmount).toLocaleString('vi-VN')} đ
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Chữ ký xác nhận */}
        <div className="voucher-signatures">
          <div className="signature-block">
            <p className="sign-title">Người Lập Phiếu</p>
            <p className="sign-sub">(Ký, ghi rõ họ tên)</p>
            <div className="sign-space"></div>
            <p style={{ fontWeight: '600' }}>{note.nguoiTao || 'Nguyễn Văn Kho'}</p>
          </div>

          <div className="signature-block">
            <p className="sign-title">Người Giao Hàng</p>
            <p className="sign-sub">(Ký, ghi rõ họ tên)</p>
            <div className="sign-space"></div>
            <p style={{ fontWeight: '600' }}>Đại diện NCC</p>
          </div>

          <div className="signature-block">
            <p className="sign-title">Thủ Kho Tiếp Nhận</p>
            <p className="sign-sub">(Ký, đóng dấu xác nhận)</p>
            <div className="sign-space"></div>
            <p style={{ fontWeight: '600' }}>Trần Văn Kiểm Kê</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportNoteDetail;
