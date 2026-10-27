import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiRepeat, FiBox, FiHome } from 'react-icons/fi';
import { wmsCoreService } from '../../services/wmsCoreService';
import '../Product/ProductForm.css';

const TransferCreate = () => {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);

  const [formData, setFormData] = useState({
    khoNguonId: '',
    khoDichId: '',
    sanPhamId: '',
    soLuong: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [whData, prodData, invData] = await Promise.all([
        wmsCoreService.getWarehouses(),
        wmsCoreService.getProducts(),
        wmsCoreService.getInventory(),
      ]);

      if (Array.isArray(whData)) setWarehouses(whData);
      if (Array.isArray(prodData)) setProducts(prodData);
      if (Array.isArray(invData)) setInventoryList(invData);

      if (whData && whData.length >= 2) {
        setFormData(prev => ({
          ...prev,
          khoNguonId: whData[0].id,
          khoDichId: whData[1].id,
          sanPhamId: prodData?.[0]?.id || '',
        }));
      }
    } catch (e) {
      console.warn('Lỗi nạp dữ liệu điều chuyển:', e.message);
      setErrorMsg('Không thể nạp danh mục kho và sản phẩm!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Tìm tồn kho khả dụng tại kho nguồn
  const getAvailableStockAtSource = () => {
    if (!formData.khoNguonId || !formData.sanPhamId) return 0;
    const item = inventoryList.find(
      inv => String(inv.khoHangId) === String(formData.khoNguonId) &&
             String(inv.sanPhamId) === String(formData.sanPhamId)
    );
    return item ? (item.soLuongKhaDung || 0) : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (String(formData.khoNguonId) === String(formData.khoDichId)) {
      alert('Kho nguồn và Kho đích không được trùng nhau!');
      return;
    }

    if (!formData.sanPhamId) {
      alert('Vui lòng chọn sản phẩm cần điều chuyển!');
      return;
    }

    const qty = Number(formData.soLuong);
    if (qty <= 0) {
      alert('Số lượng chuyển phải lớn hơn 0!');
      return;
    }

    const available = getAvailableStockAtSource();
    if (qty > available) {
      alert(`Kho nguồn không đủ hàng! Tồn kho khả dụng hiện tại: ${available} món.`);
      return;
    }

    const payload = {
      khoNguonId: Number(formData.khoNguonId),
      khoDichId: Number(formData.khoDichId),
      sanPhamId: Number(formData.sanPhamId),
      soLuong: qty,
    };

    try {
      setIsSubmitting(true);
      await wmsCoreService.createTransfer(payload);
      alert('Lập lệnh và thực hiện điều chuyển kho thành công!');
      navigate('/transfers');
    } catch (err) {
      const msg = err.response?.data || err.message || 'Lỗi điều chuyển kho';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableStock = getAvailableStockAtSource();

  return (
    <div className="product-form-container">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate('/transfers')}>
          <FiArrowLeft size={18} /> Quay lại
        </button>
        <h2>Lập Lệnh Điều Chuyển Kho Hàng Hóa</h2>
      </div>

      {errorMsg && (
        <div style={{ background: '#fff5f5', color: '#c53030', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Đang nạp dữ liệu...</div>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
          <div className="form-card">
            <h3><FiRepeat /> Lộ Trình Điều Chuyển</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Kho Nguồn (Xuất hàng) (*):</label>
                <select name="khoNguonId" value={formData.khoNguonId} onChange={handleChange} required>
                  <option value="">-- Chọn kho xuất --</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.tenKho} ({w.maKho})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Kho Đích (Nhận hàng) (*):</label>
                <select name="khoDichId" value={formData.khoDichId} onChange={handleChange} required>
                  <option value="">-- Chọn kho nhận --</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.tenKho} ({w.maKho})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Sản Phẩm Cần Chuyển (*):</label>
              <select name="sanPhamId" value={formData.sanPhamId} onChange={handleChange} required>
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.tenSanPham} [SKU: {p.sku}]</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label>Số Lượng Chuyển (*):</label>
                <span style={{ fontSize: '12px', color: availableStock > 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                  Tồn khả dụng tại kho nguồn: {availableStock} món
                </span>
              </div>
              <input 
                type="number" 
                min="1" 
                max={availableStock > 0 ? availableStock : 1}
                name="soLuong" 
                value={formData.soLuong} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-actions" style={{ marginTop: '24px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting || availableStock <= 0}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <FiSave size={16} /> {isSubmitting ? 'Đang thực hiện...' : 'Xác Nhận & Điều Chuyển Ngay'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default TransferCreate;

