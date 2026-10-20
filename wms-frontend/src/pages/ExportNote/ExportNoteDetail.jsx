import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, FiPrinter, FiFileText, FiCheckCircle, 
  FiMapPin, FiTruck, FiPackage, FiCalendar, FiUser 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import { orderService } from '../../services/orderService';
import './ExportNoteForm.css';

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
      const isWms = String(id).startsWith('wms-');
      const isOrder = String(id).startsWith('ord-');
      const realId = id.replace('wms-', '').replace('ord-', '');

      if (isWms) {
        const allWms = await wmsCoreService.getExportNotes();
        const found = allWms.find(n => String(n.id) === String(realId));
        if (found) {
          setNote({
            maPhieu: found.maPhieuXuat || ('PX-' + found.id),
            donHangRef: found.donHangId || 'Xuất nội bộ',
            ngayXuat: found.ngayXuat ? new Date(found.ngayXuat).toLocaleDateString('vi-VN') : 'Hôm nay',
            khoXuat: found.khoHang?.tenKho || 'Kho Tổng Trung Tâm',
            dvvc: found.donViVanChuyen?.tenDonVi || 'Giao Hàng Tiết Kiệm',
            nguoiTao: found.nguoiTao || 'Thủ kho trực ban',
            trangThai: found.trangThai || 'ĐÃ XUẤT',
            items: [
              { sku: 'SP001', tenSanPham: 'iPhone 15 Pro Max 256GB', donViTinh: 'Cái', soLuong: 1 },
            ],
          });
          return;
        }
      }

      if (isOrder) {
        const allOrders = await orderService.getAllOrders();
        const found = allOrders.find(o => String(o.id) === String(realId));
        if (found) {
          setNote({
            maPhieu: 'PX-' + (found.maDonHang || found.id),
            donHangRef: found.maDonHang || `ORD-${found.id}`,
            ngayXuat: found.createdAt ? new Date(found.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay',
            khoXuat: 'Kho Tổng Trung Tâm',
            dvvc: found.phuongThucThanhToan ? `Thanh toán: ${found.phuongThucThanhToan}` : 'Giao Hàng Nhanh',
            nguoiTao: 'Hệ thống E-commerce',
            trangThai: found.trangThaiDonHang || 'ĐÃ XÁC NHẬN',
            tongThanhToan: found.tongThanhToan,
            items: (found.chiTietDonHangs || []).map(d => ({
              sku: `SP00${d.sanPhamId}`,
              tenSanPham: `Sản phẩm mã #${d.sanPhamId}`,
              donViTinh: 'Cái',
              soLuong: d.soLuong,
              donGia: d.donGia,
            })),
          });
          return;
        }
      }

      // Fallback
      setNote({
        maPhieu: `PX-2026-00${id}`,
        donHangRef: 'DH-ONLINE-9812',
        ngayXuat: '12/10/2026',
        khoXuat: 'Kho Tổng Trung Tâm (KHO-01)',
        dvvc: 'Giao Hàng Tiết Kiệm (GHTK)',
        nguoiTao: 'Nguyễn Văn Thủ Kho',
        trangThai: 'ĐÃ XUẤT KHO',
        items: [
          { sku: 'SP001', tenSanPham: 'iPhone 15 Pro Max 256GB', donViTinh: 'Cái', soLuong: 2 },
          { sku: 'SP004', tenSanPham: 'Chuột không dây Logitech MX Master 3S', donViTinh: 'Cái', soLuong: 1 },
        ],
      });
    } catch (e) {
      console.warn('Lỗi lấy chi tiết phiếu xuất:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !note) {
    return (
      <div className="export-form-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Đang tải chi tiết phiếu xuất kho #{id}...</p>
      </div>
    );
  }

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
            <h2>Chi Tiết Phiếu Xuất: {note.maPhieu}</h2>
            <p>Hồ sơ chứng từ xuất kho và bàn giao vận chuyển</p>
          </div>
        </div>

        <div className="form-header-actions">
          <button 
            type="button" 
            className="btn-submit" 
            onClick={handlePrint}
            style={{ backgroundColor: '#0f172a' }}
          >
            <FiPrinter size={16} /> In Phiếu Xuất Kho
          </button>
        </div>
      </div>

      {/* Tờ Phiếu Xuất Chuẩn In Ấn */}
      <div className="voucher-paper">
        <div className="voucher-header">
          <div className="voucher-title">
            <h1>PHIẾU XUẤT KHO KIÊM BÀN GIAO VẬN CHUYỂN</h1>
            <p>CTUT WMS SYSTEM • BỘ PHẬN ĐÓNG GÓI & ĐIỀU PHỐI GIAO NHẬN</p>
          </div>
          <div className="voucher-meta">
            <div>Mã số phiếu: <span className="voucher-code">{note.maPhieu}</span></div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Ngày xuất: <strong>{note.ngayXuat}</strong>
            </div>
            <div style={{ marginTop: '6px' }}>
              <span className="badge safe"><FiCheckCircle size={12} /> {note.trangThai}</span>
            </div>
          </div>
        </div>

        {/* Thông tin đơn hàng & kho xuất */}
        <div className="voucher-info-grid">
          <div>
            <p style={{ margin: '0 0 6px 0', fontSize: '14px' }}>
              <strong><FiPackage /> Đơn hàng tham chiếu:</strong> <span className="text-bold text-blue font-mono">{note.donHangRef}</span>
            </p>
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#475569' }}>
              <strong><FiTruck /> Đơn vị giao nhận / Bưu tá:</strong> {note.dvvc}
            </p>
            {note.tongThanhToan && (
              <p style={{ margin: '0', fontSize: '13px', color: '#475569' }}>
                <strong>Tổng tiền thu hộ (COD):</strong> {Number(note.tongThanhToan).toLocaleString('vi-VN')} đ
              </p>
            )}
          </div>

          <div>
            <p style={{ margin: '0 0 6px 0', fontSize: '14px' }}>
              <strong><FiMapPin /> Kho xuất hàng:</strong> {note.khoXuat}
            </p>
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#475569' }}>
              <strong>Người lập phiếu:</strong> {note.nguoiTao}
            </p>
            <p style={{ margin: '0', fontSize: '13px', color: '#475569' }}>
              <strong>Mục đích:</strong> Xuất giao khách hàng thương mại điện tử
            </p>
          </div>
        </div>

        {/* Danh sách mặt hàng */}
        <div className="items-table-wrapper" style={{ marginTop: '20px' }}>
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>STT</th>
                <th>Mặt Hàng Xuất Kho (Mã SKU)</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Đơn Vị Tính</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Số Lượng Xuất</th>
                {note.tongThanhToan && (
                  <th style={{ width: '160px', textAlign: 'right' }}>Đơn Giá</th>
                )}
              </tr>
            </thead>
            <tbody>
              {(note.items || []).map((it, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>
                    <strong>{it.tenSanPham}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Mã SKU: {it.sku}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{it.donViTinh || 'Cái'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>{it.soLuong}</td>
                  {note.tongThanhToan && (
                    <td style={{ textAlign: 'right' }}>{it.donGia ? Number(it.donGia).toLocaleString('vi-VN') + ' đ' : '-'}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Chữ ký xác nhận */}
        <div className="voucher-signatures">
          <div className="signature-block">
            <p className="sign-title">Thủ Kho Xuất Hàng</p>
            <p className="sign-sub">(Ký, ghi rõ họ tên)</p>
            <div className="sign-space"></div>
            <p style={{ fontWeight: '600' }}>{note.nguoiTao}</p>
          </div>

          <div className="signature-block">
            <p className="sign-title">Nhân Viên Đóng Gói</p>
            <p className="sign-sub">(Ký, kiểm đếm)</p>
            <div className="sign-space"></div>
            <p style={{ fontWeight: '600' }}>Bộ phận Packing</p>
          </div>

          <div className="signature-block">
            <p className="sign-title">Bưu Tá Nhận Hàng</p>
            <p className="sign-sub">(Ký nhận và bàn giao mã vận đơn)</p>
            <div className="sign-space"></div>
            <p style={{ fontWeight: '600' }}>Đại diện ĐVVC</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportNoteDetail;
