import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiPlus, FiTrash2, 
  FiFileText, FiTruck, FiCheckCircle 
} from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import './ImportNoteCreate.css';

const ImportNoteCreate = () => {
  const navigate = useNavigate();

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
  // Hàm này bao quát nhiều cấu trúc JSON khác nhau từ backend
  const filterProductsBySupplier = (allProducts, supplierId) => {
    if (!supplierId) return [];
    const targetId = String(supplierId);
    
    // In ra phần tử đầu tiên để bạn dễ debug (Mở F12 -> tab Console để xem cấu trúc thực tế)
    if (allProducts.length > 0) {
        console.log("Cấu trúc 1 sản phẩm từ API là:", allProducts[0]);
    }

    return allProducts.filter(p => {
      return (
        String(p.nhaCungCapId) === targetId ||
        String(p.nha_cung_cap_id) === targetId ||
        String(p.supplierId) === targetId ||
        (p.nhaCungCap && String(p.nhaCungCap.id) === targetId) ||
        (p.supplier && String(p.supplier.id) === targetId) ||
        // Trường hợp backend chỉ trả về ID thẳng trong trường nhaCungCap chứ không phải object
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

      if (suppRes.status === 'fulfilled' && Array.isArray(suppRes.value)) {
        setSuppliers(suppRes.value);
        if (suppRes.value.length > 0) {
          const firstSuppId = String(suppRes.value[0].id);
          setHeaderData(prev => ({ ...prev, nhaCungCapId: firstSuppId }));
          
          const initialFiltered = filterProductsBySupplier(loadedProducts, firstSuppId);
          setFilteredProducts(initialFiltered);

          if (initialFiltered.length > 0) {
            setItems([{ 
              sanPhamId: initialFiltered[0].id, 
              soLuong: 1, 
              giaNhap: initialFiltered[0].giaNhap || 0 
            }]);
          }
        }
      }

      if (whRes.status === 'fulfilled' && Array.isArray(whRes.value)) {
        setWarehouses(whRes.value);
        if (whRes.value.length > 0) {
          setHeaderData(prev => ({ ...prev, khoHangId: whRes.value[0].id }));
        }
      }
    } catch (e) {
      console.warn('Lỗi nạp danh mục tạo phiếu nhập:', e.message);
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
        setItems([{ 
          sanPhamId: newFiltered[0].id, 
          soLuong: 1, 
          giaNhap: newFiltered[0].giaNhap || 0 
        }]);
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
        updated[index] = { 
          ...updated[index], 
          sanPhamId: value,
          giaNhap: selectedProduct ? (selectedProduct.giaNhap || 0) : 0
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

    try {
      setIsSubmitting(true);
      await wmsCoreService.createImportNote(payload);
      alert('Tạo phiếu nhập kho thành công!');
      navigate('/import-notes');
    } catch (err) {
      alert('Lỗi khi tạo phiếu nhập kho: ' + (err.response?.data || err.message));
    } finally {
      setIsSubmitting(false);
    }
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
            <h2>Tạo Yêu Cầu Nhập Kho</h2> {/* Sửa tiêu đề */}
            <p>Lập danh sách hàng hóa cần nhập để gửi Thủ kho trưởng phê duyệt</p> {/* Sửa mô tả */}
          </div>
        </div>
        <div className="form-header-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/import-notes')}>Hủy Bỏ</button>
          <button type="button" className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
            {/* Sửa text nút bấm */}
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
                <option value="">-- Chọn Kho Tiếp Nhận --</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.tenKho} ({w.maKho})</option>)}
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
          <div className="items-table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>STT</th>
                  <th>Hàng Hóa / Sản Phẩm (Mã SKU)</th>
                  <th style={{ width: '150px' }}>Số Lượng Nhập</th>
                  <th style={{ width: '180px' }}>Đơn Giá Nhập (VNĐ)</th>
                  <th style={{ width: '180px' }}>Thành Tiền (VNĐ)</th>
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
            {/* Sửa text nút bấm dưới cùng */}
            <FiCheckCircle size={18} /> {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Gửi Yêu Cầu Phê Duyệt'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ImportNoteCreate;