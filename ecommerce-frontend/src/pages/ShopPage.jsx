// src/pages/ShopPage.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import { CartContext } from '../context/CartContext';
import { FiCheck, FiShoppingCart, FiStar, FiMapPin, FiTag, FiBox } from 'react-icons/fi';
import './ShopPage.css';

const ShopPage = () => {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [copiedVoucher, setCopiedVoucher] = useState('');
  const [loading, setLoading] = useState(true);

  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchStoreData = async () => {
      setLoading(true);
      try {
        const [storeRes, prodsRes, vouchersRes] = await Promise.all([
          marketplaceService.getStoreById(storeId),
          marketplaceService.getProductsByStore(storeId),
          marketplaceService.getStoreVouchers(storeId),
        ]);
        setStore(storeRes);
        setProducts(prodsRes);
        setVouchers(vouchersRes);
      } catch (err) {
        console.error('Lỗi tải dữ liệu shop:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreData();
  }, [storeId]);

  const handleCopyVoucher = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedVoucher(code);
    setTimeout(() => setCopiedVoucher(''), 2500);
  };

  if (loading) {
    return (
      <div className="container loading-container">
        <div className="spinner"></div>
        <p>Đang tải thông tin Gian hàng...</p>
      </div>
    );
  }

  return (
    <div className="shop-page">
      {/* Header Hồ Sơ Gian Hàng */}
      <section className="shop-banner-header">
        <div className="container shop-header-inner">
          <div className="shop-profile-card">
            <div className="shop-avatar">
              <img src={store?.anhDaiDienShop || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120'} alt={store?.tenKho} />
            </div>
            <div className="shop-details">
              <span className="shop-official-badge">✓ GIAN HÀNG CHÍNH HÃNG</span>
              <h2>{store?.tenKho}</h2>
              <p className="shop-desc">{store?.moTaGianHang || 'Chào mừng bạn đến với gian hàng chính thức trên Sàn CTUT Gear.'}</p>
              <div className="shop-quick-stats">
                <span><FiMapPin /> {store?.diaChi || 'Cần Thơ'}</span>
                <span><FiStar className="star-icon" /> Đánh giá: 4.9/5.0</span>
                <span><FiBox /> {products.length} Sản phẩm</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Danh sách Voucher độc quyền của Shop */}
      {vouchers.length > 0 && (
        <section className="container shop-vouchers-section">
          <h3 className="section-title"><FiTag /> Mã Khuyến Mãi Độc Quyền Của Gian Hàng</h3>
          <div className="vouchers-grid">
            {vouchers.map((v) => (
              <div key={v.id} className="voucher-card">
                <div className="voucher-left">
                  <span className="voucher-percent">GIẢM {v.phanTramGiam}%</span>
                  <span className="voucher-max">Tối đa {Number(v.giamToiDa).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="voucher-right">
                  <div className="voucher-code">{v.maVoucher}</div>
                  <div className="voucher-condition">{v.moTa || `Đơn tối thiểu ${Number(v.donHangToiThieu).toLocaleString('vi-VN')} đ`}</div>
                  <button 
                    className="btn-save-voucher"
                    onClick={() => handleCopyVoucher(v.maVoucher)}
                  >
                    {copiedVoucher === v.maVoucher ? <><FiCheck /> Đã Lưu Mã</> : 'Lưu Mã Shop'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Danh sách sản phẩm của Shop */}
      <section className="container shop-products-section">
        <div className="shop-products-header">
          <h3 className="section-title">Tất Cả Sản Phẩm Có Sẵn Tại Shop</h3>
          <span className="product-count-badge">{products.length} sản phẩm</span>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <p>Gian hàng hiện chưa có sản phẩm nào mở bán.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((p) => {
              const price = p.giaBanHienTai || p.giaBan || 0;
              return (
                <div key={`${p.sanPhamId}-${p.khoHangId}`} className="product-card">
                  <Link to={`/products/${p.sanPhamId}`} className="product-card-link">
                    <div className="product-img-wrap">
                      <img src={p.hinhAnh || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500'} alt={p.tenSanPham} />
                    </div>
                    <div className="product-content">
                      <div className="product-sku">Mã: {p.sku}</div>
                      <h4 className="product-name">{p.tenSanPham}</h4>
                      <div className="product-pricing">
                        <span className="sale-price">{Number(price).toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="product-footer-meta">
                        <span className="sold-count">Đã bán {p.soLuongDaBan || 0}</span>
                        <span className="stock-status">Sẵn {p.soLuongThucTe || 0}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="product-action-bar">
                    <button 
                      className="btn-add-cart"
                      onClick={() => addToCart(p, 1)}
                    >
                      <FiShoppingCart size={16} /> Thêm Giỏ Hàng
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ShopPage;

