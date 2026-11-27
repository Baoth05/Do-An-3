// src/pages/MultiShopCart.jsx
import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { marketplaceService } from '../services/marketplaceService';
import { authService } from '../services/authService';
import { 
  FiTrash2, FiShoppingBag, FiArrowRight, FiCheckSquare, 
  FiSquare, FiTag, FiCheck, FiX, FiTruck, FiShield, FiGift, FiAlertCircle 
} from 'react-icons/fi';
import './MultiShopCart.css';

const MultiShopCart = () => {
  const {
    cartItems,
    groupedByShop,
    selectedTotalPrice,
    selectedTotalQuantity,
    selectedItems,
    isAllSelected,
    updateQuantity,
    removeFromCart,
    removeShopItems,
    clearCart,
    toggleSelectItem,
    toggleSelectShop,
    toggleSelectAll
  } = useContext(CartContext);

  const [globalVoucherCode, setGlobalVoucherCode] = useState('');
  const [appliedGlobalVoucher, setAppliedGlobalVoucher] = useState(null);
  const [shopVouchers, setShopVouchers] = useState({});
  const [voucherError, setVoucherError] = useState('');
  const [availableShopVouchers, setAvailableShopVouchers] = useState({}); // { [shopId]: Voucher[] }
  const [userSavedVouchers, setUserSavedVouchers] = useState([]);
  const [showSavedVoucherDropdown, setShowSavedVoucherDropdown] = useState(false);
  const [toastNotice, setToastNotice] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Tải danh sách voucher của các shop có hàng trong giỏ và voucher người dùng đã lưu
  useEffect(() => {
    const loadVouchersData = async () => {
      // 1. Voucher người dùng đã lưu
      const saved = await marketplaceService.getUserSavedVouchers();
      setUserSavedVouchers(saved);

      // 2. Voucher cho từng shop hiện diện trong giỏ
      const map = {};
      for (const shop of groupedByShop) {
        try {
          const vList = await marketplaceService.getStoreVouchers(shop.cuaHangId);
          map[shop.cuaHangId] = vList || [];
        } catch (e) {
          map[shop.cuaHangId] = [];
        }
      }
      setAvailableShopVouchers(map);
    };

    if (groupedByShop.length > 0) {
      loadVouchersData();
    }
  }, [groupedByShop]);

  // Áp dụng Voucher toàn sàn
  const applyGlobalVoucherByCode = async (code) => {
    setVoucherError('');
    if (!code || !code.trim()) return;

    try {
      const v = await marketplaceService.checkVoucher(code.trim());
      if (v.cuaHangId) {
        setVoucherError('Mã này là mã giảm giá riêng của Shop, vui lòng áp dụng ở phần Kiện Hàng Shop tương ứng!');
        return;
      }
      setAppliedGlobalVoucher(v);
      setGlobalVoucherCode(v.maVoucher);
      setShowSavedVoucherDropdown(false);
      setToastNotice(`🎉 Đã áp dụng mã "${v.maVoucher}"!`);
      setTimeout(() => setToastNotice(''), 2500);
    } catch (err) {
      setVoucherError(err.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn!');
    }
  };

  const handleApplyGlobalVoucher = (e) => {
    e.preventDefault();
    applyGlobalVoucherByCode(globalVoucherCode);
  };

  const handleRemoveGlobalVoucher = () => {
    setAppliedGlobalVoucher(null);
    setGlobalVoucherCode('');
    setVoucherError('');
  };

  // Áp dụng voucher riêng của shop
  const handleApplyShopVoucher = async (shopId, code, shopSubtotal) => {
    if (!code || !code.trim()) {
      handleRemoveShopVoucher(shopId);
      return;
    }

    try {
      const v = await marketplaceService.checkVoucher(code.trim());
      const minOrder = Number(v.donHangToiThieu || 0);

      let discountVal = Number(v.giamToiDa || 30000);
      if (v.phanTramGiam) {
        const calculated = (shopSubtotal * v.phanTramGiam) / 100;
        discountVal = Math.min(calculated, discountVal);
      }

      setShopVouchers((prev) => ({
        ...prev,
        [shopId]: {
          code: v.maVoucher,
          discount: Math.round(discountVal),
          minOrder,
          phanTramGiam: v.phanTramGiam,
          giamToiDa: Number(v.giamToiDa || 30000)
        },
      }));

      setToastNotice(`🏪 Đã áp dụng mã shop "${v.maVoucher}"!`);
      setTimeout(() => setToastNotice(''), 2500);
    } catch (err) {
      setToastNotice(`❌ ${err.message || 'Mã không hợp lệ'}`);
      setTimeout(() => setToastNotice(''), 2500);
    }
  };

  const handleRemoveShopVoucher = (shopId) => {
    setShopVouchers((prev) => {
      const next = { ...prev };
      delete next[shopId];
      return next;
    });
  };

  // Tự động áp dụng mã khi chuyển từ trang Voucher / Shop / Profile sang Cart
  useEffect(() => {
    if (location.state?.autoApplyCode) {
      const code = location.state.autoApplyCode;
      const targetShopId = location.state.targetShopId;
      if (targetShopId) {
        handleApplyShopVoucher(targetShopId, code, selectedTotalPrice);
      } else {
        applyGlobalVoucherByCode(code);
      }
    }
  }, [location.state]);

  // Kiểm tra điều kiện Voucher Toàn Sàn & tính tiền giảm
  let globalDiscount = 0;
  let globalVoucherConditionMet = true;
  let globalVoucherShortage = 0;

  if (appliedGlobalVoucher && selectedTotalPrice > 0) {
    const minOrder = Number(appliedGlobalVoucher.donHangToiThieu || 0);
    if (minOrder > 0 && selectedTotalPrice < minOrder) {
      globalVoucherConditionMet = false;
      globalVoucherShortage = minOrder - selectedTotalPrice;
      globalDiscount = 0;
    } else {
      globalVoucherConditionMet = true;
      const percent = appliedGlobalVoucher.phanTramGiam || 10;
      const calculated = (selectedTotalPrice * percent) / 100;
      const maxDiscount = Number(appliedGlobalVoucher.giamToiDa || 50000);
      globalDiscount = Math.min(calculated, maxDiscount);
    }
  }

  // Tính tiền giảm từ Voucher các Shop (Có kiểm tra điều kiện từng shop)
  let totalShopDiscounts = 0;
  groupedByShop.forEach((shopBlock) => {
    const applied = shopVouchers[shopBlock.cuaHangId];
    if (applied) {
      const shopSubtotal = shopBlock.items.reduce((s, i) => s + (i.selected ? i.price * i.quantity : 0), 0);
      if (applied.minOrder && shopSubtotal < applied.minOrder) {
        // Chưa đủ đơn tối thiểu shop, tạm thời không trừ
      } else {
        let disc = applied.giamToiDa || 30000;
        if (applied.phanTramGiam && shopSubtotal > 0) {
          disc = Math.min((shopSubtotal * applied.phanTramGiam) / 100, disc);
        }
        totalShopDiscounts += Math.round(disc);
      }
    }
  });

  const finalTotal = Math.max(0, selectedTotalPrice - globalDiscount - totalShopDiscounts);

  if (cartItems.length === 0) {
    return (
      <div className="container empty-cart-container">
        <div className="empty-cart-card">
          <FiShoppingBag size={64} className="empty-cart-icon" />
          <h3>Giỏ hàng của bạn đang trống!</h3>
          <p>Hãy khám phá các sản phẩm công nghệ chính hãng từ các Gian hàng trên Sàn CTUT Gear.</p>
          <Link to="/" className="btn-continue-shopping">
            Tiếp Tục Mua Sắm
          </Link>
        </div>
      </div>
    );
  }

  const handleProceedCheckout = () => {
    if (!authService.isCustomerAuthenticated()) {
      navigate('/login', {
        state: {
          from: location,
          message: 'Vui lòng đăng nhập tài khoản khách hàng trước khi tiến hành mua hàng!',
        },
      });
      return;
    }
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm để tiến hành thanh toán!');
      return;
    }
    navigate('/checkout', { 
      state: { 
        globalDiscount, 
        appliedVoucherCode: appliedGlobalVoucher?.maVoucher,
        shopVouchers,
        totalShopDiscounts,
        finalTotal
      } 
    });
  };

  return (
    <div className="multi-shop-cart-page">
      {toastNotice && (
        <div className="cart-toast-notification">
          {toastNotice}
        </div>
      )}

      <div className="container">
        <div className="cart-page-header">
          <div>
            <h2>Giỏ Hàng Thông Minh Đa Gian Hàng</h2>
            <span className="cart-items-tag">
              Tổng {cartItems.length} sản phẩm • Đã chọn {selectedTotalQuantity} món để thanh toán
            </span>
          </div>

          <button className="btn-clear-all-cart" onClick={clearCart} title="Xóa toàn bộ giỏ hàng">
            <FiTrash2 /> Xóa sạch giỏ
          </button>
        </div>

        {/* Header Chọn Tất Cả Toàn Sàn */}
        <div className="cart-select-all-bar">
          <label className="checkbox-label" onClick={() => toggleSelectAll()}>
            {isAllSelected ? <FiCheckSquare className="check-icon checked" /> : <FiSquare className="check-icon" />}
            <span>Chọn tất cả ({cartItems.length} sản phẩm)</span>
          </label>
          <span className="cart-col-price">Đơn Giá</span>
          <span className="cart-col-qty">Số Lượng</span>
          <span className="cart-col-subtotal">Số Tiền</span>
          <span className="cart-col-action">Thao Tác</span>
        </div>

        {/* Thân Giỏ Hàng: Chia Cột Trái (Danh Sách Kiện Hàng Shop) & Cột Phải (Thanh Toán) */}
        <div className="cart-layout-grid">
          {/* Cột Trái: Kiện Hàng Của Từng Shop */}
          <div className="cart-shops-column">
            {groupedByShop.map((shopBlock) => {
              const shopSubtotal = shopBlock.items.reduce((s, i) => s + (i.selected ? i.price * i.quantity : 0), 0);
              const appliedShopVoucher = shopVouchers[shopBlock.cuaHangId];
              const shopVList = availableShopVouchers[shopBlock.cuaHangId] || [];
              const isShopConditionMet = !appliedShopVoucher || !appliedShopVoucher.minOrder || shopSubtotal >= appliedShopVoucher.minOrder;

              return (
                <div key={shopBlock.cuaHangId} className="shop-cart-block">
                  {/* Shop Block Header */}
                  <div className="shop-block-header">
                    <div className="shop-title-wrap">
                      <label 
                        className="checkbox-label" 
                        onClick={() => toggleSelectShop(shopBlock.cuaHangId)}
                      >
                        {shopBlock.allSelected ? (
                          <FiCheckSquare className="check-icon checked" />
                        ) : (
                          <FiSquare className="check-icon" />
                        )}
                      </label>
                      <span className="shop-icon-badge">🏪</span>
                      <Link to={`/stores/${shopBlock.cuaHangId}`} className="shop-name-link">
                        {shopBlock.tenShop}
                      </Link>
                    </div>

                    <div className="shop-header-actions">
                      <span className="shop-split-badge">📦 Kiện hàng Shop #{shopBlock.cuaHangId}</span>
                      <button 
                        className="btn-remove-shop" 
                        onClick={() => removeShopItems(shopBlock.cuaHangId)}
                        title="Xóa tất cả món của shop này"
                      >
                        Xóa shop
                      </button>
                    </div>
                  </div>

                  {/* Danh sách sản phẩm của shop */}
                  <div className="shop-items-list">
                    {shopBlock.items.map((item) => {
                      const max = item.maxStock || 999;
                      return (
                        <div 
                          key={`${item.sanPhamId}-${item.khoHangId}`} 
                          className={`cart-item-row ${item.selected ? 'item-selected' : ''}`}
                        >
                          <label 
                            className="checkbox-label" 
                            onClick={() => toggleSelectItem(item.sanPhamId, item.khoHangId)}
                          >
                            {item.selected ? (
                              <FiCheckSquare className="check-icon checked" />
                            ) : (
                              <FiSquare className="check-icon" />
                            )}
                          </label>

                          <img 
                            src={item.image || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=120'} 
                            alt={item.name} 
                            className="cart-item-img" 
                          />
                          
                          <div className="cart-item-info">
                            <span className="cart-item-sku">SKU: {item.sku}</span>
                            <Link to={`/products/${item.sanPhamId}`} className="cart-item-name-link">
                              <h4 className="cart-item-name">{item.name}</h4>
                            </Link>
                            <div className="cart-item-unit-price">
                              {Number(item.price).toLocaleString('vi-VN')} đ
                            </div>
                          </div>

                          <div className="cart-item-actions">
                            <div className="qty-control">
                              <button 
                                onClick={() => updateQuantity(item.sanPhamId, item.khoHangId, -1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <span>{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.sanPhamId, item.khoHangId, 1)}
                                disabled={item.quantity >= max}
                              >
                                +
                              </button>
                            </div>
                            
                            <div className="cart-item-subtotal">
                              {Number(item.price * item.quantity).toLocaleString('vi-VN')} đ
                            </div>

                            <button 
                              className="btn-remove-item"
                              onClick={() => removeFromCart(item.sanPhamId, item.khoHangId)}
                              title="Xóa sản phẩm này"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Shop Block Footer: Voucher Shop & Tạm tính */}
                  <div className="shop-block-footer">
                    <div className="shop-voucher-interactive-wrap">
                      <div className="shop-v-title">
                        <FiTag className="voucher-icon" />
                        <span>Mã giảm giá độc quyền của Shop:</span>
                      </div>

                      {/* Danh sách pill voucher 1 chạm của shop */}
                      <div className="shop-voucher-pills-row">
                        {shopVList.map((sv) => {
                          const isApplied = appliedShopVoucher?.code === sv.maVoucher;
                          return (
                            <button
                              key={sv.maVoucher}
                              type="button"
                              className={`shop-v-pill ${isApplied ? 'applied' : ''}`}
                              onClick={() => {
                                if (isApplied) {
                                  handleRemoveShopVoucher(shopBlock.cuaHangId);
                                } else {
                                  handleApplyShopVoucher(shopBlock.cuaHangId, sv.maVoucher, shopSubtotal);
                                }
                              }}
                              title={sv.moTa}
                            >
                              🏷️ {sv.maVoucher} (-{Number(sv.giamToiDa || 30000).toLocaleString('vi-VN')}đ)
                              {isApplied && <FiCheck className="pill-check" />}
                            </button>
                          );
                        })}
                      </div>

                      {appliedShopVoucher && (
                        <div className="shop-voucher-status-area">
                          {isShopConditionMet ? (
                            <div className="shop-voucher-applied-tag">
                              <span>✓ Đã áp dụng <strong>{appliedShopVoucher.code}</strong>: Giảm -{Number(appliedShopVoucher.discount).toLocaleString('vi-VN')} đ</span>
                              <FiX className="btn-remove-shop-v" onClick={() => handleRemoveShopVoucher(shopBlock.cuaHangId)} title="Gỡ mã" />
                            </div>
                          ) : (
                            <div className="shop-voucher-warning-tag">
                              <FiAlertCircle size={14} />
                              <span>Đơn shop chưa đạt {appliedShopVoucher.minOrder?.toLocaleString('vi-VN')}đ (cần thêm {(appliedShopVoucher.minOrder - shopSubtotal).toLocaleString('vi-VN')}đ để kích hoạt mã)</span>
                              <FiX className="btn-remove-shop-v" onClick={() => handleRemoveShopVoucher(shopBlock.cuaHangId)} title="Gỡ mã" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="shop-subtotal-text">
                      Tạm tính hàng đã chọn: <strong>{Number(shopSubtotal).toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cột Phải: Bảng Tổng Kết Thanh Toán & Tách Đơn */}
          <div className="cart-summary-column">
            <div className="cart-summary-card">
              <h3>Tổng Kết Thanh Toán</h3>

              {/* Ô nhập Voucher Toàn Sàn & Danh Sách Mã Đã Lưu */}
              <div className="global-voucher-section">
                <form className="global-voucher-form" onSubmit={handleApplyGlobalVoucher}>
                  <div className="voucher-field">
                    <FiTag />
                    <input
                      type="text"
                      placeholder="Nhập mã Voucher Toàn Sàn..."
                      value={globalVoucherCode}
                      onChange={(e) => setGlobalVoucherCode(e.target.value)}
                    />
                    <button type="submit" className="btn-apply-voucher">Áp Dụng</button>
                  </div>
                </form>

                {voucherError && <div className="voucher-error-msg">{voucherError}</div>}

                {/* Nút bấm xem và chọn nhanh mã toàn sàn đã lưu */}
                {userSavedVouchers.length > 0 && (
                  <div className="saved-vouchers-dropdown-wrap">
                    <button 
                      type="button"
                      className="btn-toggle-saved-v"
                      onClick={() => setShowSavedVoucherDropdown(!showSavedVoucherDropdown)}
                    >
                      <FiGift /> Chọn từ Kho Voucher đã lưu ({userSavedVouchers.filter((v) => !v.cuaHangId).length} mã toàn sàn)
                    </button>

                    {showSavedVoucherDropdown && (
                      <div className="saved-v-dropdown-menu">
                        {userSavedVouchers.filter((v) => !v.cuaHangId).map((v) => (
                          <div 
                            key={v.maVoucher}
                            className="saved-v-item"
                            onClick={() => applyGlobalVoucherByCode(v.maVoucher)}
                          >
                            <div className="v-item-code">{v.maVoucher}</div>
                            <small>{v.moTa || `Giảm ${v.phanTramGiam}% tối đa ${Number(v.giamToiDa).toLocaleString('vi-VN')}đ`}</small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {appliedGlobalVoucher && (
                  globalVoucherConditionMet ? (
                    <div className="applied-voucher-tag">
                      <span>🎉 Đã áp dụng mã: <strong>{appliedGlobalVoucher.maVoucher}</strong> (-{Number(globalDiscount).toLocaleString('vi-VN')} đ)</span>
                      <FiX className="remove-voucher-btn" onClick={handleRemoveGlobalVoucher} title="Gỡ mã" />
                    </div>
                  ) : (
                    <div className="voucher-shortage-alert">
                      <FiAlertCircle size={14} />
                      <span>Cần mua thêm <strong>{globalVoucherShortage.toLocaleString('vi-VN')} đ</strong> để kích hoạt mã <strong>{appliedGlobalVoucher.maVoucher}</strong>!</span>
                      <FiX className="remove-voucher-btn" onClick={handleRemoveGlobalVoucher} title="Gỡ mã" />
                    </div>
                  )
                )}

                {!appliedGlobalVoucher && (
                  <small className="voucher-hint">Gợi ý mã: <strong>CTUT50K</strong> (Giảm 10% tối đa 50K) hoặc <strong>FREESHIP</strong></small>
                )}
              </div>

              {/* Chi tiết tách đơn Order Splitting */}
              <div className="order-splitting-info">
                <div className="split-badge-title">
                  <FiTruck /> Thuật toán Tách Đơn Shopee Mall:
                </div>
                <p>
                  Hệ thống tự động tách thành <strong>{groupedByShop.length} đơn hàng độc lập</strong> cho từng Cửa hàng để xuất kho riêng và điều phối bưu tá.
                </p>
              </div>

              {/* Dòng tiền */}
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Tiền hàng đã chọn ({selectedTotalQuantity} món):</span>
                  <span>{Number(selectedTotalPrice).toLocaleString('vi-VN')} đ</span>
                </div>

                {globalDiscount > 0 && (
                  <div className="summary-row discount-row">
                    <span>Voucher toàn sàn {appliedGlobalVoucher?.maVoucher ? `(${appliedGlobalVoucher.maVoucher})` : ''}:</span>
                    <span>-{Number(globalDiscount).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                {totalShopDiscounts > 0 && (
                  <div className="summary-row discount-row">
                    <span>Voucher từ các shop:</span>
                    <span>-{Number(totalShopDiscounts).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                <div className="summary-row">
                  <span>Phí vận chuyển:</span>
                  <span className="free-shipping">MIỄN PHÍ VẬN CHUYỂN</span>
                </div>

                <div className="summary-divider"></div>
                
                <div className="summary-row total-row">
                  <span>Tổng thanh toán:</span>
                  <span className="total-amount">{Number(finalTotal).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <button 
                className="btn-proceed-checkout"
                onClick={handleProceedCheckout}
                disabled={selectedItems.length === 0}
              >
                Tiến Hành Mua Hàng ({selectedTotalQuantity}) <FiArrowRight size={18} />
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
