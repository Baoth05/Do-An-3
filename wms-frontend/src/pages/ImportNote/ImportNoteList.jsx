import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye, FiRefreshCw, FiFileText } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ImportNoteList.css';

const ImportNoteList = () => {
  const navigate = useNavigate();

  const initialMockNotes = [
    { id: 1, maPhieuNhap: 'PN-2610-001', nhaCungCap: { tenNhaCungCap: 'Công ty TNHH Apple Việt Nam' }, khoHang: { tenKho: 'Kho Tổng Trung Tâm' }, ngayNhap: '10/10/2026', tongTienNhap: 85000000, trangThai: 'ĐÃ NHẬP', nguoiTao: 'Nguyễn Văn Kho' },
    { id: 2, maPhieuNhap: 'PN-2610-002', nhaCungCap: { tenNhaCungCap: 'Công ty Cổ phần Digiworld' }, khoHang: { tenKho: 'Kho Tổng Trung Tâm' }, ngayNhap: '11/10/2026', tongTienNhap: 42500000, trangThai: 'ĐÃ NHẬP', nguoiTao: 'Trần Thủ Kho' },
  ];

  const [importNotes, setImportNotes] = useState(initialMockNotes);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const notesRes = await wmsCoreService.getImportNotes();
      if (Array.isArray(notesRes) && notesRes.length > 0) {
        setImportNotes(notesRes);
        setIsBackendConnected(true);
      }
    } catch (e) {
      console.warn('Lỗi lấy dữ liệu phiếu nhập từ Backend:', e.message);
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    if (!amount) return '0 đ';
    return Number(amount).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div className="import-container">
      <div className="import-header">
        <div>
          <h2>Quản Lý Phiếu Nhập Kho</h2>
          <p>Danh sách các chứng từ nhập hàng từ nhà cung cấp và tăng tồn kho</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchData} disabled={isLoading} title="Làm mới">
            <FiRefreshCw className={isLoading ? 'spin-icon' : ''} /> {isBackendConnected ? 'Backend Live' : 'Đồng bộ'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/import-notes/create')}
          >
            <FiPlus size={16} /> Tạo Phiếu Nhập
          </button>
        </div>
      </div>

      <div className="import-table-wrapper">
        <table className="wms-data-table">
          <thead>
            <tr>
              <th>Mã Phiếu</th>
              <th>Nhà Cung Cấp</th>
              <th>Kho Nhận Hàng</th>
              <th>Người Lập</th>
              <th>Tổng Tiền Nhập</th>
              <th>Trạng Thái</th>
              <th>Chi Tiết</th>
            </tr>
          </thead>
          <tbody>
            {importNotes.map((note) => {
              const code = note.maPhieuNhap || 'PN-' + note.id;
              const supplierName = note.nhaCungCap?.tenNhaCungCap || note.nhaCungCap || 'Đối tác phân phối';
              const whName = note.khoHang?.tenKho || 'Kho Tổng Trung Tâm';
              const total = note.tongTienNhap || note.tongTien || 0;

              return (
                <tr key={note.id}>
                  <td className="font-mono text-bold">
                    <FiFileText style={{ marginRight: '6px', color: '#3b82f6' }} />
                    {code}
                  </td>
                  <td>{supplierName}</td>
                  <td>{whName}</td>
                  <td>{note.nguoiTao || 'Thủ kho'}</td>
                  <td className="text-bold text-blue">{formatCurrency(total)}</td>
                  <td>
                    <span className="badge safe">{note.trangThai || 'ĐÃ NHẬP'}</span>
                  </td>
                  <td>
                    <button 
                      className="btn-icon text-blue" 
                      title="Xem chi tiết phiếu nhập trên trang riêng" 
                      onClick={() => navigate(`/import-notes/${note.id}`)}
                    >
                      <FiEye />
                    </button>
                  </td>
                </tr>
              );
            })}

            {importNotes.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center">Chưa có phiếu nhập kho nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ImportNoteList;