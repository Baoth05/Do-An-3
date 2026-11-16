// src/pages/ShopPage.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import { CartContext } from '../context/CartContext';
import { 
  FiCheck, FiShoppingCart, FiStar, FiMapPin, FiTag, 
  FiBox, FiMessageSquare, FiCopy, FiArrowRight 
} from 'react-icons/fi';
import './ShopPage.css';

const ShopPage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [savedCodes, setSavedCodes] = useState([]);
  const [copiedVoucher, setCopiedVoucher] = useState('');
  const [addedNotice, setAddedNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const { addToCart } = useContext(CartContext);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setAddedNotice(`Đã thêm "${product.tenSanPham}" vào giỏ hàng!`);
    setTimeout(() => setAddedNotice(''), 2500);
  };

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const [storeRes, prodsRes, vouchersRes, savedRes] = await Promise.all([
        marketplaceService.getStoreById(storeId),
        marketplaceService.getProductsByStore(storeId),
        marketplaceService.getStoreVouchers(storeId),
        marketplaceService.getUserSavedVouchers()
      ]);
      setStore(storeRes);
      setProducts(prodsRes);
      setVouchers(Array.isArray(vouchersRes) ? vouchersRes : []);
      setSavedCodes(savedRes.map((v) => v.maVoucher));
    } catch (err) {
      console.error('Lỗi tải dữ liệu shop:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchStoreData();
    }
  }, [storeId]);

  const handleSaveVoucher = async (voucher) => {
    navigator.clipboard?.writeText(voucher.maVoucher);
    setCopiedVoucher(voucher.maVoucher);

    try {
      await marketplaceService.saveUserVoucher(voucher);
    } catch (err) {
      alert(err.message);
      return;
    }
    const updated = await marketplaceService.getUserSavedVouchers();
    setSavedCodes(updated.map((v) => v.maVoucher));
    setAddedNotice(`Đã lưu mã giảm giá "${voucher.maVoucher}" vào ví ưu đãi!`);

    setTimeout(() => {
      setCopiedVoucher('');
      setAddedNotice('');
    }, 2500);
  };

  const handleOpenStoreChat = () => {
    navigate('/profile', { state: { activeTab: 'chat', targetStoreId: storeId, storeName: store?.tenKho } });
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
      {/* Toast thông báo */}
      {addedNotice && (
        <div className="toast-notification">
          <FiCheck size={18} /> {addedNotice}
        </div>
      )}

      {/* Header Hồ Sơ Gian Hàng */}
      <section className="shop-banner-header">
        <div className="container shop-header-inner">
          <div className="shop-profile-card">
            <div className="shop-avatar">
              <img src={store?.anhDaiDienShop || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120'} alt={store?.tenKho} />
            </div>
            <div className="shop-details">
              <div className="shop-badges-row">
                <span className="shop-official-badge">✓ GIAN HÀNG CHÍNH HÃNG</span>
                <span className="shop-code-pill">Mã Kho: #{store?.maKho || `STORE-${storeId}`}</span>
              </div>
              <h2>{store?.tenKho || `Gian Hàng Đối Tác #${storeId}`}</h2>
              <p className="shop-desc">{store?.moTaGianHang || 'Chào mừng bạn đến với gian hàng chính thức trên Sàn CTUT Gear.'}</p>
              <div className="shop-quick-stats">
                <span><FiMapPin /> {store?.diaChi || 'Chưa cập nhật địa chỉ'}</span>
                <span><FiStar className="star-icon" /> Đánh giá: 4.9/5.0</span>
                <span><FiBox /> {products.length} Sản phẩm mở bán</span>
              </div>
            </div>
            <div className="shop-header-actions">
              <button className="btn-chat-with-shop" onClick={handleOpenStoreChat}>
                <FiMessageSquare size={16} /> Chat Với Cửa Hàng
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Danh sách Voucher độc quyền của Shop */}
      <section className="container shop-vouchers-section">
        <div className="section-title-wrap">
          <h3 className="section-title"><FiTag /> Mã Khuyến Mãi Độc Quyền Của Gian Hàng</h3>
          <span className="voucher-note">Áp dụng trực tiếp khi thanh toán đơn hàng của shop này</span>
        </div>

        {vouchers.length === 0 ? (
          <div className="no-vouchers-notice">
            <p>Hiện gian hàng đang cập nhật thêm mã giảm giá mới. Bạn có thể sử dụng các Voucher toàn sàn khi thanh toán!</p>
            <Link to="/vouchers" className="btn-view-global-vouchers">Xem Kho Voucher Toàn Sàn →</Link>
          </div>
        ) : (
          <div className="vouchers-grid">
            {vouchers.map((v) => {
              const isSaved = savedCodes.includes(v.maVoucher);
              return (
                <div key={v.id || v.maVoucher} className="voucher-card">
                  <div className="voucher-left">
                    <span className="voucher-percent">GIẢM {v.phanTramGiam}%</span>
                    <span className="voucher-max">Tối đa {Number(v.giamToiDa || 50000).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="voucher-right">
                    <div className="voucher-code">{v.maVoucher}</div>
                    <div className="voucher-condition">{v.moTa || `Đơn tối thiểu ${Number(v.donHangToiThieu || 150000).toLocaleString('vi-VN')} đ`}</div>
                    <div className="voucher-card-actions">
                      <button 
                        className={`btn-save-voucher ${isSaved ? 'saved' : ''}`}
                        onClick={() => handleSaveVoucher(v)}
                      >
                        {copiedVoucher === v.maVoucher ? (
                          <><FiCheck /> Đã Lưu & Copy</>
                        ) : isSaved ? (
                          <><FiCheck /> Đã Lưu Vào Ví</>
                        ) : (
                          <><FiCopy /> Lưu Mã Shop</>
                        )}
                      </button>
                      <Link 
                        to="/cart" 
                        state={{ autoApplyCode: v.maVoucher, targetShopId: v.cuaHangId || Number(storeId) }}
                        className="btn-shop-voucher-use"
                      >
                        Dùng Ngay <FiArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

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
                        {p.giaGoc && <span className="original-price">{Number(p.giaGoc).toLocaleString('vi-VN')} đ</span>}
                      </div>
                    </div>
                  </Link>

                  <div className="product-card-footer">
                    <button 
                      className="btn-add-cart"
                      onClick={() => handleAddToCart(p)}
                    >
                      <FiShoppingCart /> Thêm Vào Giỏ
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
