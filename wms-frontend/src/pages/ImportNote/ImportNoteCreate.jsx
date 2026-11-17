import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiPlus, FiTrash2, 
  FiFileText, FiTruck, FiCheckCircle 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ImportNoteCreate.css';

const ImportNoteCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const passedState = location.state?.requestImportItem;
  
  // Biến cờ (flag) để kiểm tra xem có phải điều hướng từ trang Tồn kho không
  const isFromInventory = !!passedState;

  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Form State
  const [headerData, setHeaderData] = useState({
    maPhieu: 'PN-' + Math.floor(1000 + Math.random() * 9000),
    nhaCungCapId: '',
    khoHangId: '',
    nguoiTao: 'Thủ kho trưởng',
    ngayNhap: new Date().toISOString().split('T')[0],
    ghiChu: '',
  });

  const [items, setItems] = useState([]);

  // --- HÀM HỖ TRỢ LỌC SẢN PHẨM ---
  const filterProductsBySupplier = (allProducts, supplierId) => {
    if (!supplierId) return [];
    const targetId = String(supplierId);
    
    return allProducts.filter(p => {
      return (
        String(p.nhaCungCapId) === targetId ||
        String(p.nha_cung_cap_id) === targetId ||
        String(p.supplierId) === targetId ||
        (p.nhaCungCap && String(p.nhaCungCap.id) === targetId) ||
        (p.supplier && String(p.supplier.id) === targetId) ||
        (typeof p.nhaCungCap !== 'object' && String(p.nhaCungCap) === targetId)
      );
    });
  };

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    try {
      setIsLoading(true);
      const [suppRes, whRes, prodRes] = await Promise.allSettled([
        wmsCoreService.getSuppliers(),
        wmsCoreService.getWarehouses(),
        wmsCoreService.getProducts(),
      ]);

      let loadedProducts = [];
      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
        setProducts(prodRes.value);
        loadedProducts = prodRes.value;
      }

      let initialSupplierId = '';
      let initialWarehouseId = '';
      let initialItems = [];
      let initialFilteredProds = [];

      // Xử lý dữ liệu truyền từ trang Tồn Kho
      if (passedState && loadedProducts.length > 0) {
        const targetProduct = loadedProducts.find(p => String(p.id) === String(passedState.sanPhamId));
        
        if (targetProduct) {
          initialSupplierId = String(targetProduct.nhaCungCapId || targetProduct.nha_cung_cap_id || targetProduct.supplierId || (targetProduct.nhaCungCap?.id) || (typeof targetProduct.nhaCungCap !== 'object' ? targetProduct.nhaCungCap : ''));
          initialWarehouseId = String(passedState.khoHangId);
          initialFilteredProds = filterProductsBySupplier(loadedProducts, initialSupplierId);
          
          // Thêm tonThucTe và trangThai vào item
          initialItems = [{ 
            sanPhamId: targetProduct.id, 
            soLuong: passedState.soLuong || 1, 
            giaNhap: targetProduct.giaNhap || 0,
            tonThucTe: passedState.tonThucTe || 0,
            trangThai: passedState.trangThai || 'Không xác định'
          }];
        }
      }

      // Khởi tạo Nhà cung cấp
      if (suppRes.status === 'fulfilled' && Array.isArray(suppRes.value)) {
        setSuppliers(suppRes.value);
        if (suppRes.value.length > 0) {
          const finalSuppId = initialSupplierId || String(suppRes.value[0].id);
          setHeaderData(prev => ({ ...prev, nhaCungCapId: finalSuppId }));
          
          const finalFiltered = initialFilteredProds.length > 0 ? initialFilteredProds : filterProductsBySupplier(loadedProducts, finalSuppId);
          setFilteredProducts(finalFiltered);

          if (initialItems.length > 0) {
            setItems(initialItems);
          } else if (finalFiltered.length > 0) {
            // Nếu không từ tồn kho, không cần tonThucTe và trangThai
            setItems([{ sanPhamId: finalFiltered[0].id, soLuong: 1, giaNhap: finalFiltered[0].giaNhap || 0 }]);
          }
        }
      }

      // Khởi tạo Kho hàng
      if (whRes.status === 'fulfilled' && Array.isArray(whRes.value)) {
        setWarehouses(whRes.value);
        if (whRes.value.length > 0) {
          const finalWhId = initialWarehouseId || String(whRes.value[0].id);
          setHeaderData(prev => ({ ...prev, khoHangId: finalWhId }));
        }
      }
    } catch (e) {
      console.warn('Lỗi nạp danh mục:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeaderData(prev => ({ ...prev, [name]: value }));

    if (name === 'nhaCungCapId') {
      const newFiltered = filterProductsBySupplier(products, value);
      setFilteredProducts(newFiltered);

      if (newFiltered.length > 0) {
        setItems([{ sanPhamId: newFiltered[0].id, soLuong: 1, giaNhap: newFiltered[0].giaNhap || 0 }]);
      } else {
        setItems([]);
      }
    }
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      if (field === 'sanPhamId') {
        const selectedId = String(value);
        const selectedProduct = filteredProducts.find(p => String(p.id) === selectedId);
        // Khi đổi sản phẩm, ta reset lại tonThucTe và trangThai nếu có
        updated[index] = { 
          ...updated[index], 
          sanPhamId: value,
          giaNhap: selectedProduct ? (selectedProduct.giaNhap || 0) : 0,
          tonThucTe: undefined, 
          trangThai: undefined
        };
      } else {
        updated[index] = { ...updated[index], [field]: Number(value) };
      }
      return updated;
    });
  };

  const handleAddItem = () => {
    if (filteredProducts.length === 0) {
        alert('Không có sản phẩm nào thuộc nhà cung cấp này để thêm!');
        return;
    }
    const defaultProdId = filteredProducts[0].id;
    // Sản phẩm thêm mới sẽ không có thông tin tồn/trạng thái từ Inventory
    setItems(prev => [...prev, { sanPhamId: defaultProdId, soLuong: 1, giaNhap: filteredProducts[0].giaNhap || 0 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const calculateTotal = () => items.reduce((sum, item) => sum + (item.soLuong * item.giaNhap), 0);
  const calculateTotalQuantity = () => items.reduce((sum, item) => sum + Number(item.soLuong || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!headerData.nhaCungCapId || !headerData.khoHangId) {
      alert('Vui lòng chọn đầy đủ Nhà cung cấp và Kho hàng!');
      return;
    }
    if (items.length === 0) {
      alert('Vui lòng thêm ít nhất một mặt hàng vào phiếu nhập!');
      return;
    }

    // Đóng gói dữ liệu để gửi lên máy chủ
    const payload = {
      nhaCungCapId: Number(headerData.nhaCungCapId),
      khoHangId: Number(headerData.khoHangId),
      nguoiTao: headerData.nguoiTao,
      trangThai: 'CHO_DUYET',
      danhSachHangHoa: items.map(it => ({
        sanPhamId: Number(it.sanPhamId),
        soLuong: Number(it.soLuong),
        giaNhap: Number(it.giaNhap),
      })),
    };

    // BƯỚC 1: In dữ liệu ra Console để kiểm tra xem Frontend gửi gì
    console.log("=== DỮ LIỆU GỬI LÊN MÁY CHỦ (PAYLOAD) ===", payload);

    try {
      setIsSubmitting(true);
      await wmsCoreService.createImportNote(payload);
      alert('Tạo phiếu nhập kho thành công!');
      navigate('/import-notes');
    } catch (err) {
      // BƯỚC 2: In chi tiết lỗi máy chủ trả về ra Console
      console.error("=== LỖI CHI TIẾT TỪ MÁY CHỦ ===", err.response?.data);
      
      // Hiển thị lỗi chi tiết lên màn hình cho dễ nhìn (chuyển Object thành chuỗi)
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert('Lỗi khi tạo phiếu nhập kho: ' + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper render badge trạng thái
  const renderStatusBadge = (status) => {
    if (!status) return null;
    if (status === 'Hết Hàng') return <span className="ref-badge badge-danger">{status}</span>;
    if (status === 'Cạn Kho') return <span className="ref-badge badge-warning">{status}</span>;
    return <span className="ref-badge badge-info">{status}</span>;
  };

  if (isLoading) {
    return (
      <div className="import-form-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Đang tải danh mục kho bãi và nhà cung cấp...</p>
      </div>
    );
  }

  return (
    <div className="import-form-container">
      <div className="form-header">
        <div className="form-header-title">
          <button type="button" className="btn-back" onClick={() => navigate('/import-notes')} title="Quay lại danh sách">
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2>Tạo Yêu Cầu Nhập Kho</h2>
            <p>Lập danh sách hàng hóa cần nhập để gửi Thủ kho trưởng phê duyệt</p>
          </div>
        </div>
        <div className="form-header-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/import-notes')}>Hủy Bỏ</button>
          <button type="button" className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
            <FiSave size={16} /> {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Nhập'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="form-card">
          <div className="form-card-title">
            <FiFileText size={18} /><span>Thông Tin Chứng Từ Nhập Kho</span>
          </div>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Mã Phiếu Nhập Kho</label>
              <input type="text" name="maPhieu" value={headerData.maPhieu} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', fontWeight: 'bold' }} />
            </div>
            <div className="form-group">
              <label>Nhà Cung Cấp Giao Hàng <span style={{ color: '#dc2626' }}>*</span></label>
              <select name="nhaCungCapId" value={headerData.nhaCungCapId} onChange={handleHeaderChange} required>
                <option value="">-- Chọn Nhà Cung Cấp --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.tenNhaCungCap || s.tenNCC}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Kho Tiếp Nhận & Lưu Trữ <span style={{ color: '#dc2626' }}>*</span></label>
              <select name="khoHangId" value={headerData.khoHangId} onChange={handleHeaderChange} required>
                
                {/* 
                  LỌC DỮ LIỆU CỨNG: 
                  Chỉ lấy duy nhất kho có mã chứa chữ 'MAIN' (MAIN-WH-01).
                  Cách này loại bỏ hoàn toàn các gian hàng (như STORE-BAOTH05).
                */}
                {warehouses
                  .filter(w => w.maKho === 'MAIN-WH-01' || (w.maKho && w.maKho.includes('MAIN'))) 
                  .map(w => (
                    <option key={w.id} value={w.id}>
                      Kho Tổng: {w.tenKho} ({w.maKho})
                    </option>
                  ))
                }
                
              </select>
            </div>
          </div>
          <div className="form-grid-3" style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label>Người Lập Phiếu / Thủ Kho</label>
              <input type="text" name="nguoiTao" value={headerData.nguoiTao} onChange={handleHeaderChange}/>
            </div>
            <div className="form-group">
              <label>Ngày Thực Hiện Nhập Kho</label>
              <input type="date" name="ngayNhap" value={headerData.ngayNhap} onChange={handleHeaderChange}/>
            </div>
            <div className="form-group">
              <label>Ghi Chú Chứng Từ</label>
              <input type="text" name="ghiChu" value={headerData.ghiChu} onChange={handleHeaderChange} placeholder="VD: Hóa đơn GTGT số 008912"/>
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-title">
            <FiTruck size={18} /><span>Danh Sách Mặt Hàng Kiểm Đếm & Nhập Kho</span>
          </div>
          <div className="items-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>STT</th>
                  <th>Hàng Hóa / Sản Phẩm (Mã SKU)</th>
                  
                  {/* Chỉ render 2 cột này nếu điều hướng từ InventoryStock */}
                  {isFromInventory && <th style={{ width: '100px', textAlign: 'center' }}>Tồn Thực Tế</th>}
                  {isFromInventory && <th style={{ width: '120px', textAlign: 'center' }}>Trạng Thái</th>}
                  
                  <th style={{ width: '130px' }}>Số Lượng Nhập</th>
                  <th style={{ width: '150px' }}>Đơn Giá (VNĐ)</th>
                  <th style={{ width: '150px' }}>Thành Tiền (VNĐ)</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Xóa</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const subtotal = item.soLuong * item.giaNhap;
                  return (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                      <td>
                        <select value={item.sanPhamId} onChange={(e) => handleItemChange(idx, 'sanPhamId', e.target.value)}>
                          {filteredProducts.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.tenSanPham || p.tenHangHoa} ({p.sku || `SP00${p.id}`})
                            </option>
                          ))}
                          {filteredProducts.length === 0 && <option value="">Không có sản phẩm nào cho NCC này</option>}
                        </select>
                      </td>
                      
                      {/* Dữ liệu tham chiếu */}
                      {isFromInventory && (
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#475569' }}>
                          {item.tonThucTe !== undefined ? item.tonThucTe : '—'}
                        </td>
                      )}
                      {isFromInventory && (
                        <td style={{ textAlign: 'center' }}>
                          {item.trangThai ? renderStatusBadge(item.trangThai) : '—'}
                        </td>
                      )}

                      <td>
                        <input type="number" min="1" value={item.soLuong} onChange={(e) => handleItemChange(idx, 'soLuong', e.target.value)} />
                      </td>
                      <td>
                        <input type="number" min="0" step="1000" value={item.giaNhap} onChange={(e) => handleItemChange(idx, 'giaNhap', e.target.value)} />
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#1d4ed8' }}>
                        {Number(subtotal).toLocaleString('vi-VN')} đ
                      </td>
                      <td>
                        <button type="button" className="btn-icon text-red" onClick={() => handleRemoveItem(idx)} title="Xóa dòng này">
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn-add-row" onClick={handleAddItem}>
            <FiPlus size={16} /> Thêm Dòng Mặt Hàng
          </button>
          <div className="total-summary-card">
            <div className="total-summary-item">
              <span>TỔNG SỐ LƯỢNG HÀNG</span>
              <strong>{calculateTotalQuantity()} món</strong>
            </div>
            <div className="total-summary-item">
              <span>TỔNG GIÁ TRỊ NHẬP KHO</span>
              <strong style={{ fontSize: '22px' }}>{calculateTotal().toLocaleString('vi-VN')} đ</strong>
            </div>
          </div>
        </div>
        <div className="form-footer">
          <button type="button" className="btn-cancel" onClick={() => navigate('/import-notes')}>Hủy Bỏ</button>
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            <FiCheckCircle size={18} /> {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Gửi Yêu Cầu Phê Duyệt'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ImportNoteCreate;