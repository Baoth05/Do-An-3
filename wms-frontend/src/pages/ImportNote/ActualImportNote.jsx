// src/pages/ImportNote/ActualImportNote.jsx
import { useState, useEffect } from 'react';
import { FiInbox, FiCheckCircle } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ActualImportNote.css';

const ActualImportNote = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [actualDate, setActualDate] = useState(new Date().toISOString().split('T')[0]);
  const [poList, setPoList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [suppRes, notesRes] = await Promise.allSettled([
        wmsCoreService.getSuppliers(),
        wmsCoreService.getImportNotes(),
      ]);

      if (suppRes.status === 'fulfilled' && Array.isArray(suppRes.value)) {
        setSuppliers(suppRes.value);
        if (suppRes.value.length > 0) {
          setSelectedSupplierId(String(suppRes.value[0].id));
        }
      }

      if (notesRes.status === 'fulfilled' && Array.isArray(notesRes.value)) {
        // SỬA LỖI Ở ĐÂY: Sử dụng notesRes.value.filter thay vì notesRes.filter
        const approved = notesRes.value.filter(n => {
          if (!n.trangThai) return false;
          const status = n.trangThai.toString().toUpperCase().trim();
          return status === 'DA_DUYET' || status === 'ĐÃ DUYỆT';
        });
        setPoList(approved);
      }
    } catch (e) {
      console.warn('Lỗi nạp dữ liệu nhập kho thực tế:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Lọc các PO theo Nhà Cung Cấp đang chọn
  const filteredPOs = poList.filter(po => {
    if (!selectedSupplierId) return true;
    return String(po.nhaCungCapId) === String(selectedSupplierId);
  });

  const handleCompleteImport = async (poId, code) => {
    try {
      // Cập nhật trạng thái phiếu thành ĐÃ_NHẬP_KHO
      await wmsCoreService.updateImportNoteStatus(poId, 'DA_NHAP_KHO');
      alert(`Đã hoàn tất nhập đơn hàng ${code} vào kho thực tế!`);
      // Loại bỏ đơn đã nhập xong khỏi danh sách tiếp nhận
      setPoList(prev => prev.filter(item => item.id !== poId));
    } catch (err) {
      alert('Lỗi hoàn tất nhập đơn: ' + err.message);
    }
  };

  return (
    <div className="actual-import-container">
      <div className="actual-import-header">
        <h2><FiInbox style={{ color: '#2563eb' }} /> Tiếp Nhận Hàng Nhập Kho</h2>
      </div>

      {/* Thanh chọn NCC và Ngày nhập thực tế */}
      <div className="actual-filter-card">
        <div className="filter-group">
          <label>Chọn Nhà Cung Cấp có hàng giao đến:</label>
          <select 
            value={selectedSupplierId} 
            onChange={(e) => setSelectedSupplierId(e.target.value)}
          >
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.tenNhaCungCap || s.tenNCC}</option>
            ))}
          </select>
        </div>

        <div className="filter-group" style={{ maxWidth: '240px' }}>
          <label>Ngày Nhập Thực Tế:</label>
          <input 
            type="date" 
            value={actualDate} 
            onChange={(e) => setActualDate(e.target.value)} 
          />
        </div>
      </div>

      {/* Danh sách các Mã Đơn (PO) cần thực nhận */}
      {isLoading ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải danh sách đơn nhập kho...</p>
      ) : filteredPOs.length === 0 ? (
        <div className="empty-po-box">
          <p>Hiện không có đơn hàng (PO) nào thuộc Nhà Cung Cấp này đang chờ nhập kho thực tế.</p>
        </div>
      ) : (
        filteredPOs.map((po) => {
          const code = po.maPhieuNhap || `PO-${po.id}`;
          const items = po.danhSachHangHoa || po.chiTietPhieuNhap || [];
          const nccName = po.tenNhaCungCap || 'Chưa xác định';

          return (
            <div key={po.id} className="po-receipt-card">
              <div className="po-receipt-header">
                <h3>Mã Đơn (PO): {code}</h3>
                <span className="ncc-badge">NCC: {nccName}</span>
              </div>

              <table className="actual-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>MÃ HÀNG</th>
                    <th>TÊN SẢN PHẨM</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>SỐ LƯỢNG ĐẶT</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>ĐÃ NHẬN</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>CÒN THIẾU</th>
                    <th style={{ width: '160px', textAlign: 'center' }}>THỰC NHẬN LẦN NÀY</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>
                        Không có chi tiết sản phẩm.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const sku = item.sku || `SP-00${item.sanPhamId || item.id}`;
                      const name = item.tenSanPham || 'Sản phẩm không tên';
                      const qty = Number(item.soLuong || 0);

                      return (
                        <tr key={idx}>
                          <td><strong>{sku}</strong></td>
                          <td>{name}</td>
                          <td style={{ textAlign: 'center' }}>{qty}</td>
                          <td style={{ textAlign: 'center' }}>0</td>
                          <td style={{ textAlign: 'center' }}>{qty}</td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="number" 
                              className="qty-actual-input" 
                              defaultValue={qty} 
                              min="0"
                              max={qty}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              <div className="po-receipt-footer">
                <div className="note-input-box">
                  <label>Ghi chú tình trạng nhập kho:</label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: Hàng trầy xước nhẹ, thiếu biên bản giao..." 
                  />
                </div>
                <button 
                  className="btn-finish-import"
                  onClick={() => handleCompleteImport(po.id, code)}
                >
                  <FiCheckCircle size={16} /> HOÀN TẤT NHẬP ĐƠN
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ActualImportNote;