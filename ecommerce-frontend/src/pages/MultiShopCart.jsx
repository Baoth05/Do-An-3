/**
 * ==============================================================================
 * Module: MultiShopCart.jsx
 * Mô tả: Giỏ hàng đa gian hàng (Multi-Shop Cart Block kiểu Shopee Mall).
 * Chức năng: Gom nhóm sản phẩm theo từng Shop, áp dụng Voucher riêng của Shop & Voucher toàn sàn, tóm tắt tách đơn.
 * ==============================================================================
 */
import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { FiTrash2, FiShoppingBag, FiArrowRight, FiTag, FiTruck, FiShield } from 'react-icons/fi';
import './MultiShopCart.css';

const MultiShopCart = () => {
  const { groupedByShop, totalQuantity, totalPrice, updateQuantity, removeFromCart } = useContext(CartContext);
  const [globalVoucher, setGlobalVoucher] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [shopVouchers, setShopVouchers] = useState({});
  const navigate = useNavigate();

  const handleApplyGlobalVoucher = (e) => {
    e.preventDefault();
    if (globalVoucher.trim().toUpperCase() === 'CTUT50K') {
      setGlobalDiscount(50000);
      alert('Áp dụng thành công Voucher Toàn Sàn: Giảm 50.000 đ!');
    } else {
      alert('Mã giảm giá toàn sàn không hợp lệ hoặc đã hết hạn!');
    }
  };

  const handleApplyShopVoucher = (shopId, code) => {
    setShopVouchers((prev) => ({
      ...prev,
      [shopId]: code.trim().toUpperCase(),
    }));
    alert(`Đã gắn mã giảm giá "${code}" cho gian hàng!`);
  };

  const finalTotal = Math.max(0, totalPrice - globalDiscount);

  if (groupedByShop.length === 0) {
    return (
      <div className="container empty-cart-container">
        <div className="empty-cart-card">
          <FiShoppingBag size={64} className="empty-cart-icon" />
          <h3>Giỏ hàng của bạn đang trống!</h3>
          <p>Hãy khám phá các sản phẩm công nghệ chính hãng từ các Gian hàng trên Sàn.</p>
          <Link to="/" className="btn-continue-shopping">
            Tiếp Tục Mua Sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="multi-shop-cart-page">
      <div className="container">
        <div className="cart-page-header">
          <h2>Giỏ Hàng Thông Minh Đa Gian Hàng</h2>
          <span className="cart-items-tag">{totalQuantity} món hàng từ {groupedByShop.length} cửa hàng</span>
        </div>

        <div className="cart-layout-grid">
          {/* Cột Trái: Danh sách Khối Giỏ Hàng theo từng Shop */}
          <div className="cart-shops-column">
            {groupedByShop.map((shopBlock) => {
              const shopSubtotal = shopBlock.items.reduce((s, i) => s + i.price * i.quantity, 0);

              return (
                <div key={shopBlock.cuaHangId} className="shop-cart-block">
                  {/* Shop Block Header */}
                  <div className="shop-block-header">
                    <div className="shop-title-wrap">
                      <span className="shop-icon-badge">🏪</span>
                      <Link to={`/stores/${shopBlock.cuaHangId}`} className="shop-name-link">
                        {shopBlock.tenShop}
                      </Link>
                    </div>
                    <span className="shop-split-badge">📦 Đơn hàng riêng biệt #{shopBlock.cuaHangId}</span>
                  </div>

                  {/* Danh sách sản phẩm của shop */}
                  <div className="shop-items-list">
                    {shopBlock.items.map((item) => (
                      <div key={`${item.sanPhamId}-${item.khoHangId}`} className="cart-item-row">
                        <img src={item.image || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=120'} alt={item.name} className="cart-item-img" />
                        
                        <div className="cart-item-info">
                          <span className="cart-item-sku">SKU: {item.sku}</span>
                          <h4 className="cart-item-name">{item.name}</h4>
                          <div className="cart-item-unit-price">
                            Đơn giá: {Number(item.price).toLocaleString('vi-VN')} đ
                          </div>
                        </div>

                        <div className="cart-item-actions">
                          <div className="qty-control">
                            <button onClick={() => updateQuantity(item.sanPhamId, item.khoHangId, -1)}>-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.sanPhamId, item.khoHangId, 1)}>+</button>
                          </div>
                          <div className="cart-item-subtotal">
                            {Number(item.price * item.quantity).toLocaleString('vi-VN')} đ
                          </div>
                          <button 
                            className="btn-remove-item"
                            onClick={() => removeFromCart(item.sanPhamId, item.khoHangId)}
                            title="Xóa sản phẩm"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shop Block Footer: Voucher Shop & Tạm tính */}
                  <div className="shop-block-footer">
                    <div className="shop-voucher-input-wrap">
                      <FiTag className="voucher-icon" />
                      <input 
                        type="text" 
                        placeholder="Mã giảm giá của Shop..."
                        defaultValue={shopVouchers[shopBlock.cuaHangId] || ''}
                        onBlur={(e) => {
                          if (e.target.value) handleApplyShopVoucher(shopBlock.cuaHangId, e.target.value);
                        }}
                      />
                    </div>
                    <div className="shop-subtotal-text">
                      Tạm tính ({shopBlock.items.length} món): <strong>{Number(shopSubtotal).toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cột Phải: Bảng Tổng Kết Thanh Toán & Tách Đơn */}
          <div className="cart-summary-column">
            <div className="cart-summary-card">
              <h3>Tổng Kết Đơn Hàng</h3>

              {/* Ô nhập Voucher Toàn Sàn */}
              <form className="global-voucher-form" onSubmit={handleApplyGlobalVoucher}>
                <div className="voucher-field">
                  <FiTag />
                  <input
                    type="text"
                    placeholder="Mã giảm giá Toàn Sàn..."
                    value={globalVoucher}
                    onChange={(e) => setGlobalVoucher(e.target.value)}
                  />
                  <button type="submit" className="btn-apply-voucher">Áp Dụng</button>
                </div>
                <small className="voucher-hint">Gợi ý mã: CTUT50K (Giảm 50.000 đ)</small>
              </form>

              {/* Chi tiết tách đơn Order Splitting */}
              <div className="order-splitting-info">
                <div className="split-badge-title">
                  <FiTruck /> Thuật toán Tách Đơn Shopee:
                </div>
                <p>
                  Hệ thống sẽ tự động tách thành <strong>{groupedByShop.length} đơn hàng độc lập</strong> cho từng Cửa hàng để xuất kho riêng và điều phối bưu tá.
                </p>
              </div>

              {/* Dòng tiền */}
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Tổng tiền hàng gộp:</span>
                  <span>{Number(totalPrice).toLocaleString('vi-VN')} đ</span>
                </div>
                {globalDiscount > 0 && (
                  <div className="summary-row discount-row">
                    <span>Voucher toàn sàn:</span>
                    <span>-{Number(globalDiscount).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Phí vận chuyển:</span>
                  <span className="free-shipping">MIỄN PHÍ</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total-row">
                  <span>Tổng thanh toán 1 lần:</span>
                  <span className="total-amount">{Number(finalTotal).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <button 
                className="btn-proceed-checkout"
                onClick={() => navigate('/checkout', { state: { globalDiscount, shopVouchers } })}
              >
                Tiến Hành Mua Hàng <FiArrowRight size={18} />
              </button>

              <div className="secure-badge">
                <FiShield /> Thanh toán bảo mật qua MoMo Gateway & Web3 Crypto
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiShopCart;

