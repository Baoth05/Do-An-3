// src/pages/PurchaseOrder/CreatePurchaseOrder.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShoppingBag, FiCheck } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './CreatePurchaseOrder.css';

const CreatePurchaseOrder = () => {
  const navigate = useNavigate();
  const [approvedNotes, setApprovedNotes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchApprovedNotes();
  }, []);

  // 1. Nạp danh sách chứng từ đã duyệt từ API
  const fetchApprovedNotes = async () => {
    try {
      setIsLoading(true);
      const res = await wmsCoreService.getImportNotes();
      if (Array.isArray(res)) {
        // Lọc phiếu có trạng thái DA_DUYET hoặc ĐÃ DUYỆT
        const approved = res.filter(n => {
          if (!n.trangThai) return false;
          const status = n.trangThai.toString().toUpperCase().trim();
          return status === 'DA_DUYET' || status === 'ĐÃ DUYỆT';
        });

        // In ra console để kiểm tra cấu trúc nếu cần
        console.log("Dữ liệu phiếu duyệt tải về:", approved);

        setApprovedNotes(approved);
        // Mặc định tích chọn tất cả các phiếu đã duyệt
        setSelectedIds(approved.map(n => n.id));
      }
    } catch (e) {
      console.warn('Lỗi nạp yêu cầu đã duyệt:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Hàm hỗ trợ tự động tìm ĐÚNG mảng chứa sản phẩm từ API
  const extractItems = (note) => {
    // 1. Thử các tên phổ biến
    const knownKeys = [
      'danhSachHangHoa', 'chiTietPhieuNhap', 'chiTietPhieuNhaps', 
      'items', 'danhSachSanPham', 'chiTiet', 'details', 'sanPhams', 'products'
    ];
    
    for (let key of knownKeys) {
      if (Array.isArray(note[key])) return note[key];
    }

    // 2. Radar tự động: Quét toàn bộ object để tìm Array
    for (let key in note) {
      if (Array.isArray(note[key])) {
        console.log(`Bingo! Mảng sản phẩm nằm ở trường có tên là: "${key}"`);
        return note[key];
      }
    }

    return []; // Trả về mảng rỗng nếu không tìm thấy
  };

  // 3. Logic nòng cốt: Gom nhóm các mặt hàng theo từng Nhà Cung Cấp
  const groupedBySupplier = useMemo(() => {
    const map = {};

    approvedNotes.forEach(note => {
      if (!selectedIds.includes(note.id)) return;

      const nccName = note.tenNhaCungCap || 'Nhà Cung Cấp Chưa Xác Định';
      const nccId = note.nhaCungCapId || nccName;

      if (!map[nccId]) {
        map[nccId] = {
          nccId: nccId,
          nccName: nccName,
          sourceCodes: [note.maPhieuNhap || `PN-${note.id}`],
          itemsMap: {},
          totalAmount: 0
        };
      } else {
        const code = note.maPhieuNhap || `PN-${note.id}`;
        if (!map[nccId].sourceCodes.includes(code)) {
          map[nccId].sourceCodes.push(code);
        }
      }

      // Lấy danh sách sản phẩm thông qua hàm tự động dò
      const rawItems = extractItems(note);
      
      rawItems.forEach(item => {
        // Tự động dò các thuộc tính phổ biến của 1 mặt hàng
        const prodId = item.sanPhamId || item.id || item.hangHoaId;
        const prodName = item.tenSanPham || item.tenHangHoa || 'Sản phẩm không tên';
        const qty = Number(item.soLuong || item.soLuongNhap || 0);
        const price = Number(item.giaNhap || item.donGia || item.donGiaNhap || 0);
        const subtotal = item.thanhTien ? Number(item.thanhTien) : (qty * price);

        if (!map[nccId].itemsMap[prodId]) {
          map[nccId].itemsMap[prodId] = {
            sanPhamId: prodId,
            tenSanPham: prodName,
            soLuong: qty,
            giaNhap: price,
            thanhTien: subtotal
          };
        } else {
          map[nccId].itemsMap[prodId].soLuong += qty;
          map[nccId].itemsMap[prodId].thanhTien += subtotal;
        }

        map[nccId].totalAmount += subtotal;
      });
    });

    return Object.values(map).map(group => ({
      ...group,
      items: Object.values(group.itemsMap)
    }));
  }, [approvedNotes, selectedIds]);

  const handleCreatePO = () => {
    if (groupedBySupplier.length === 0) {
      alert('Vui lòng tích chọn ít nhất một phiếu yêu cầu đã duyệt!');
      return;
    }
    alert(`Đã phát hành thành công ${groupedBySupplier.length} Đơn Đặt Hàng (PO)! Chuyển sang trang Xử Lý Nhập Kho Thực Tế.`);
    
    // Chuyển thẳng sang trang Tiếp Nhận Hàng Nhập Kho
    navigate('/actual-imports');
  };

  const formatCurrency = (val) => Number(val || 0).toLocaleString('vi-VN') + ' đ';

  return (
    <div className="po-container">
      <div className="po-header">
        <button className="btn-back" onClick={() => navigate('/import-notes')} title="Quay lại">
          <FiArrowLeft size={18} /> Quay lại
        </button>
        <div>
          <h2>Bảng Điều Khiển Gom Đơn Mua Hàng (Bulk PO)</h2>
          <p>Tự động phân nhóm mặt hàng theo Nhà Cung Cấp từ các yêu cầu nhập kho đã phê duyệt</p>
        </div>
      </div>

      <div className="po-content-grid">
        {/* Nguồn đề xuất */}
        <div className="po-card source-card">
          <h3>Nguồn Đề Xuất (Đã Duyệt)</h3>
          {isLoading ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>Đang nạp danh sách phiếu đã duyệt...</p>
          ) : approvedNotes.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>Chưa có yêu cầu nhập kho nào được duyệt để tạo PO.</p>
          ) : (
            approvedNotes.map(n => {
              const isChecked = selectedIds.includes(n.id);
              const code = n.maPhieuNhap || `PN-${n.id}`;
              const ncc = n.tenNhaCungCap || 'Chưa xác định';
              const rawItems = extractItems(n);
              const itemCount = rawItems.length;

              return (
                <div 
                  key={n.id} 
                  className="approved-item-box"
                  style={{ 
                    borderColor: isChecked ? '#3b82f6' : '#e0f2fe',
                    backgroundColor: isChecked ? '#eff6ff' : '#f0f9ff',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleToggleSelect(n.id)}
                >
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={() => handleToggleSelect(n.id)}
                    onClick={(e) => e.stopPropagation()} 
                  />
                  <div>
                    <strong>{code}</strong>
                    <p>NCC: {ncc} • {itemCount} mặt hàng</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Giỏ hàng tổng hợp */}
        <div className="po-card cart-card">
          <h3><FiShoppingBag /> Giỏ Hàng Tổng Hợp</h3>
          
          {groupedBySupplier.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
              <p>Chưa chọn phiếu đề xuất nào để gom đơn mua hàng.</p>
            </div>
          ) : (
            groupedBySupplier.map(group => (
              <div key={group.nccId} className="ncc-group-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0 }}>Nhà Cung Cấp: {group.nccName}</h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Từ {group.sourceCodes.length} phiếu ({group.sourceCodes.join(', ')})
                  </span>
                </div>

                <table className="po-table">
                  <thead>
                    <tr>
                      <th>Mặt Hàng</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Số Lượng</th>
                      <th style={{ width: '140px', textAlign: 'right' }}>Đơn Giá</th>
                      <th style={{ width: '160px', textAlign: 'right' }}>Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, idx) => (
                      <tr key={item.sanPhamId || idx}>
                        <td>{item.tenSanPham}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.soLuong}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.giaNhap)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                          {formatCurrency(item.thanhTien)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold', paddingTop: '12px' }}>
                        TỔNG ĐƠN {group.nccName.toUpperCase()}:
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: '#1d4ed8', fontSize: '15px', paddingTop: '12px' }}>
                        {formatCurrency(group.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))
          )}

          {groupedBySupplier.length > 0 && (
            <button className="btn-submit-po" onClick={handleCreatePO}>
              <FiCheck /> XÁC NHẬN & TẠO {groupedBySupplier.length} ĐƠN ĐẶT HÀNG PO
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePurchaseOrder;