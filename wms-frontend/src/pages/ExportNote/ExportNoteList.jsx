import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiPlus, FiEye, FiTruck, FiRefreshCw, FiCheckCircle, 
  FiFileText, FiMapPin 
} from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ExportNoteList.css';

const ExportNoteList = () => {
  const navigate = useNavigate();

  const initialMockNotes = [
    { 
      id: 1, 
      maPhieu: 'PX-2610-089', 
      donHangRef: 'DH-A1B2C3D4', 
      ngayXuat: '10/10/2026', 
      khoXuat: 'Kho Tổng Trung Tâm',
      dvvc: 'Giao Hàng Tiết Kiệm', 
      nguoiTao: 'Thủ kho trực ban',
      tongThanhToan: 3200000, 
      trangThai: 'HOÀN THÀNH',
    },
    { 
      id: 2, 
      maPhieu: 'PX-2610-090', 
      donHangRef: 'DH-E5F6G7H8', 
      ngayXuat: '12/10/2026', 
      khoXuat: 'Kho Tổng Trung Tâm',
      dvvc: 'Viettel Post', 
      nguoiTao: 'Nguyễn Văn Kho',
      tongThanhToan: 1850000, 
      trangThai: 'CHỜ XÁC NHẬN',
    },
  ];

  const [notes, setNotes] = useState(initialMockNotes);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [exportRes, orderRes] = await Promise.allSettled([
        wmsCoreService.getExportNotes(),
        orderService.getAllOrders(),
      ]);

      const loadedNotes = [];

      // 1. Dữ liệu từ WMS Core
      if (exportRes.status === 'fulfilled' && Array.isArray(exportRes.value) && exportRes.value.length > 0) {
        setIsBackendConnected(true);
        exportRes.value.forEach(item => {
          loadedNotes.push({
            id: 'wms-' + item.id,
            rawId: item.id,
            source: 'WMS',
            maPhieu: item.maPhieuXuat || ('PX-' + item.id),
            donHangRef: item.donHangId || 'Xuất thủ công',
            ngayXuat: item.ngayXuat ? new Date(item.ngayXuat).toLocaleDateString('vi-VN') : 'Mới tạo',
            khoXuat: item.khoHang?.tenKho || 'Kho Tổng Trung Tâm',
            dvvc: item.donViVanChuyen?.tenDonVi || 'Giao Hàng Tiết Kiệm',
            nguoiTao: item.nguoiTao || 'Thủ kho',
            trangThai: item.trangThai || 'ĐÃ XUẤT',
            tongThanhToan: null,
          });
        });
      }

      // 2. Dữ liệu đơn hàng từ Order Service
      if (orderRes.status === 'fulfilled' && Array.isArray(orderRes.value) && orderRes.value.length > 0) {
        setIsBackendConnected(true);
        orderRes.value.forEach(order => {
          loadedNotes.push({
            id: 'ord-' + order.id,
            rawId: order.id,
            source: 'ORDER',
            maPhieu: 'PX-' + (order.maDonHang || order.id),
            donHangRef: order.maDonHang || `ORD-${order.id}`,
            ngayXuat: order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay',
            khoXuat: 'Kho Tổng Trung Tâm',
            dvvc: order.phuongThucThanhToan ? `Thanh toán: ${order.phuongThucThanhToan}` : 'Giao Hàng Nhanh',
            nguoiTao: 'Hệ thống E-commerce',
            tongThanhToan: order.tongThanhToan,
            trangThai: order.trangThaiDonHang || 'CHỜ XÁC NHẬN',
          });
        });
      }

      if (loadedNotes.length > 0) {
        setNotes(loadedNotes);
      }
    } catch (e) {
      console.warn('Lỗi đồng bộ phiếu xuất từ Backend:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cập nhật trạng thái phiếu xuất / đơn hàng
  const handleUpdateStatus = async (note) => {
    const currentStatus = note.trangThai;
    const nextStatus = currentStatus === 'CHỜ XÁC NHẬN' ? 'ĐANG GIAO' : 'HOÀN THÀNH';

    try {
      if (note.source === 'ORDER' && note.rawId) {
        await orderService.updateOrderStatus(note.rawId, nextStatus);
      }
      setNotes(prev => prev.map(n => n.id === note.id ? { ...n, trangThai: nextStatus } : n));
      alert(`Đã cập nhật trạng thái phiếu ${note.maPhieu} sang "${nextStatus}"`);
    } catch {
      setNotes(prev => prev.map(n => n.id === note.id ? { ...n, trangThai: nextStatus } : n));
    }
  };

  const filteredNotes = notes.filter(note => {
    const code = note.maPhieu || '';
    const ref = note.donHangRef || '';
    return code.toLowerCase().includes(searchTerm.toLowerCase()) || 
           ref.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="export-container">
      <div className="export-header">
        <div>
          <h2>Quản Lý Phiếu Xuất Kho & Đơn Hàng</h2>
          <p>Theo dõi tiến trình xuất hàng, đóng gói và vận chuyển đơn hàng thương mại điện tử</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchData} disabled={isLoading} title="Làm mới">
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/export-notes/create')}
          >
            <FiPlus size={16} /> Tạo Phiếu Xuất
          </button>
        </div>
      </div>

      <div className="export-toolbar" style={{ marginBottom: '16px' }}>
        <div className="export-search-box">
          <FiSearch className="search-icon" style={{ position: 'absolute', top: '12px', left: '12px', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Tìm theo mã phiếu xuất hoặc mã đơn hàng..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="export-table-wrapper">
        <table className="wms-data-table">
          <thead>
            <tr>
              <th>Mã Phiếu Xuất</th>
              <th>Mã Đơn Hàng</th>
              <th>Ngày Tạo</th>
              <th>Kho Xuất</th>
              <th>ĐVVC / Thanh Toán</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotes.map((note) => (
              <tr key={note.id}>
                <td className="font-mono text-bold">
                  <FiFileText style={{ marginRight: '6px', color: '#3b82f6' }} />
                  {note.maPhieu}
                </td>
                <td className="text-bold text-blue font-mono">{note.donHangRef}</td>
                <td>{note.ngayXuat}</td>
                <td><FiMapPin className="text-muted"/> {note.khoXuat || 'Kho Tổng'}</td>
                <td><FiTruck className="text-muted"/> {note.dvvc}</td>
                <td>
                  {note.trangThai === 'HOÀN THÀNH' || note.trangThai === 'ĐÃ XUẤT' ? (
                    <span className="badge safe">{note.trangThai}</span>
                  ) : note.trangThai === 'ĐANG GIAO' ? (
                    <span className="badge blue">Đang giao hàng</span>
                  ) : (
                    <span className="badge warning">{note.trangThai}</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    {note.trangThai !== 'HOÀN THÀNH' && note.trangThai !== 'ĐÃ XUẤT' && (
                      <button 
                        className="btn-icon text-green" 
                        title="Duyệt xuất kho / Chuyển trạng thái giao" 
                        onClick={() => handleUpdateStatus(note)}
                      >
                        <FiCheckCircle size={16} />
                      </button>
                    )}
                    <button 
                      className="btn-icon text-blue" 
                      title="Xem chi tiết phiếu xuất trên trang riêng"
                      onClick={() => navigate(`/export-notes/${note.id}`)}
                    >
                      <FiEye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredNotes.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center">Chưa có phiếu xuất kho nào phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExportNoteList;