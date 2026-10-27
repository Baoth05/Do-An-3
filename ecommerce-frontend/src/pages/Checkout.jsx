/**
 * ==============================================================================
 * Module: Checkout.jsx
 * Mô tả: Trang Thanh toán & Điều phối Đơn hàng Đa Shop (Checkout & Payment Gateway).
 * Chức năng: Nhập thông tin giao hàng, chọn ĐVVC, chọn phương thức thanh toán (MoMo VietQR / Crypto Web3 / COD),
 *            thực thi giải thuật Order Splitting qua API /orders/checkout-multishop.
 * ==============================================================================
 */
import { useContext, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { marketplaceService } from '../services/marketplaceService';
import { 
  FiMapPin, FiTruck, FiCreditCard, FiCheckCircle, FiShield, 
  FiLock, FiCopy, FiExternalLink, FiDollarSign 
} from 'react-icons/fi';
import './Checkout.css';

const Checkout = () => {
  const { groupedByShop, totalPrice, clearCart } = useContext(CartContext);
  const location = useLocation();
  const navigate = useNavigate();

  const globalDiscount = location.state?.globalDiscount || 0;
  const shopVouchers = location.state?.shopVouchers || {};

  const [customerInfo, setCustomerInfo] = useState({
    hoTen: 'Trần Minh Quân',
    soDienThoai: '0901234567',
    diaChiGiaoHang: 'Đại học Kỹ Thuật - Công Nghệ Cần Thơ, 256 Nguyễn Văn Cừ, Cần Thơ',
    ghiChu: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('MOMO'); // MOMO, CRYPTO, COD
  const [shippingProvider, setShippingProvider] = useState('GHTK'); // GHTK, GHN, VTPOST
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal MoMo QR & Crypto
  const [paymentModal, setPaymentModal] = useState(null); // { isOpen, qrCodeUrl, payUrl, momoOrderId, maGiaoDichGoc, amount }
  const [cryptoTxHash, setCryptoTxHash] = useState('');

  const finalTotal = Math.max(0, totalPrice - globalDiscount);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!customerInfo.hoTen || !customerInfo.soDienThoai || !customerInfo.diaChiGiaoHang) {
      alert('Vui lòng điền đầy đủ thông tin giao hàng!');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Chuẩn bị Payload Tách Đơn Hàng Đa Shop (Order Splitting)
      const payload = {
        nguoiDungId: 101, // Mock Customer ID
        diaChiGiaoHang: customerInfo.diaChiGiaoHang,
        soDienThoai: customerInfo.soDienThoai,
        phuongThucThanhToan: paymentMethod,
        maVoucherToanSan: globalDiscount > 0 ? 'CTUT50K' : null,
        shopOrders: groupedByShop.map((shop) => ({
          cuaHangId: shop.cuaHangId,
          tenShop: shop.tenShop,
          maVoucherShop: shopVouchers[shop.cuaHangId] || null,
          donViVanChuyen: shippingProvider,
          danhSachHang: shop.items.map((item) => ({
            sanPhamId: item.sanPhamId,
            cuaHangId: shop.cuaHangId,
            maHangHoa: item.sku,
            tenHangHoaSnapshot: item.name,
            giaMuaSnapshot: item.price,
            soLuong: item.quantity,
          })),
        })),
      };

      // 2. Gọi API Tách Đơn sang order-service
      const orderRes = await marketplaceService.checkoutMultiShop(payload);
      const maGiaoDichGoc = orderRes.maGiaoDichGoc;

      // 3. Nếu thanh toán MoMo: Tạo mã QR & Liên kết MoMo
      if (paymentMethod === 'MOMO') {
        const momoRes = await marketplaceService.createPayment({
          maGiaoDichGoc,
          soTien: finalTotal,
          thongTinDonHang: `Thanh toan don hang ${maGiaoDichGoc}`,
        });

        setPaymentModal({
          isOpen: true,
          type: 'MOMO',
          qrCodeUrl: momoRes.qrCodeUrl,
          payUrl: momoRes.paymentUrl,
          momoOrderId: momoRes.momoOrderId,
          accountNumber: momoRes.accountNumber || '0912345678',
          accountName: momoRes.accountName || 'SÀN TMĐT CTUT GEAR',
          amount: finalTotal,
          maGiaoDichGoc,
          orderRes,
        });
        return;
      }

      // 4. Nếu thanh toán Web3 Crypto: Mở Modal nhập TxHash
      if (paymentMethod === 'CRYPTO') {
        setPaymentModal({
          isOpen: true,
          type: 'CRYPTO',
          amount: finalTotal,
          cryptoAmount: (finalTotal / 25000).toFixed(2), // Quy đổi sang USDT tỉ giá 25k
          maGiaoDichGoc,
          orderRes,
        });
        return;
      }

      // 5. COD: Hoàn tất đơn hàng trực tiếp
      clearCart();
      navigate('/order-success', { state: { orderData: orderRes, paymentMethod: 'COD' } });
    } catch (err) {
      alert('Lỗi đặt hàng: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmMoMoPaid = () => {
    clearCart();
    navigate('/order-success', { 
      state: { 
        orderData: paymentModal.orderRes, 
        paymentMethod: 'MOMO', 
        momoOrderId: paymentModal.momoOrderId 
      } 
    });
  };

  const handleConfirmCryptoPaid = async () => {
    if (!cryptoTxHash.trim().startsWith('0x')) {
      alert('Vui lòng nhập TxHash hợp lệ bắt đầu bằng 0x!');
      return;
    }

    try {
      await marketplaceService.submitCryptoPayment({
        maGiaoDichGoc: paymentModal.maGiaoDichGoc,
        txHash: cryptoTxHash.trim(),
        walletAddress: '0x71C...B29',
        soTien: Number(paymentModal.cryptoAmount),
        tokenSymbol: 'USDT',
        chainId: 56,
      });

      clearCart();
      navigate('/order-success', { 
        state: { 
          orderData: paymentModal.orderRes, 
          paymentMethod: 'CRYPTO', 
          txHash: cryptoTxHash 
        } 
      });
    } catch (e) {
      alert('Lỗi xác thực TxHash: ' + e.message);
    }
  };

  if (groupedByShop.length === 0 && !paymentModal) {
    return (
      <div className="container empty-cart-container">
        <p>Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.</p>
        <Link to="/" className="btn-continue-shopping">Về Trang Chủ</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <h2>Thanh Toán Đơn Hàng Đa Gian Hàng</h2>
          <span className="secure-checkout-tag"><FiLock /> Bảo Mật SSL 256-Bit</span>
        </div>

        <form onSubmit={handleSubmitOrder} className="checkout-grid">
          {/* Cột Trái: Thông Tin Giao Hàng & Đơn Vị Vận Chuyển */}
          <div className="checkout-main-column">
            {/* Khối 1: Địa chỉ nhận hàng */}
            <div className="checkout-card">
              <div className="card-header-line">
                <FiMapPin className="card-icon" />
                <h3>Thông Tin Giao Hàng</h3>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Họ và tên người nhận *</label>
                  <input
                    type="text"
                    required
                    value={customerInfo.hoTen}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, hoTen: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại nhận hàng *</label>
                  <input
                    type="tel"
                    required
                    value={customerInfo.soDienThoai}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, soDienThoai: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Địa chỉ nhận hàng chi tiết *</label>
                <input
                  type="text"
                  required
                  value={customerInfo.diaChiGiaoHang}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, diaChiGiaoHang: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Ghi chú cho các shop (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                  value={customerInfo.ghiChu}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, ghiChu: e.target.value })}
                />
              </div>
            </div>

            {/* Khối 2: Đơn vị vận chuyển điều phối */}
            <div className="checkout-card">
              <div className="card-header-line">
                <FiTruck className="card-icon" />
                <h3>Đơn Vị Giao Vận Điều Phối</h3>
              </div>
              <div className="shipping-options-grid">
                {[
                  { id: 'GHTK', name: 'Giao Hàng Tiết Kiệm (GHTK)', time: '1 - 2 ngày', price: 'Miễn phí' },
                  { id: 'GHN', name: 'Giao Hàng Nhanh (GHN Express)', time: '24 giờ nội thành', price: 'Miễn phí' },
                  { id: 'VTPOST', name: 'Viettel Post Bưu Chính', time: '2 - 3 ngày', price: 'Miễn phí' },
                ].map((s) => (
                  <label 
                    key={s.id} 
                    className={`shipping-option-card ${shippingProvider === s.id ? 'active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      value={s.id}
                      checked={shippingProvider === s.id}
                      onChange={() => setShippingProvider(s.id)}
                    />
                    <div className="ship-meta">
                      <strong>{s.name}</strong>
                      <span className="ship-time">Thời gian: {s.time}</span>
                    </div>
                    <span className="ship-price">{s.price}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Khối 3: Phương thức thanh toán (MoMo, Web3 Crypto, COD) */}
            <div className="checkout-card">
              <div className="card-header-line">
                <FiCreditCard className="card-icon" />
                <h3>Phương Thức Thanh Toán</h3>
              </div>
              <div className="payment-methods-list">
                {/* Option 1: MoMo */}
                <label className={`payment-method-item ${paymentMethod === 'MOMO' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="MOMO"
                    checked={paymentMethod === 'MOMO'}
                    onChange={() => setPaymentMethod('MOMO')}
                  />
                  <div className="method-logo-badge momo-badge">MoMo</div>
                  <div className="method-details">
                    <strong>Ví Điện Tử MoMo (Khuyên dùng)</strong>
                    <p>Quét mã VietQR chuyển trực tiếp vào ví MoMo hoặc mở App MoMo thanh toán tức thì.</p>
                  </div>
                </label>

                {/* Option 2: Web3 Crypto */}
                <label className={`payment-method-item ${paymentMethod === 'CRYPTO' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="CRYPTO"
                    checked={paymentMethod === 'CRYPTO'}
                    onChange={() => setPaymentMethod('CRYPTO')}
                  />
                  <div className="method-logo-badge crypto-badge">Web3</div>
                  <div className="method-details">
                    <strong>Thanh Toán Web3 Crypto (USDT / BNB / ETH)</strong>
                    <p>Xác thực giao dịch On-chain chống gian lận qua Blockchain Smart Contract.</p>
                  </div>
                </label>

                {/* Option 3: COD */}
                <label className={`payment-method-item ${paymentMethod === 'COD' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                  />
                  <div className="method-logo-badge cod-badge">COD</div>
                  <div className="method-details">
                    <strong>Thanh Toán Khi Nhận Hàng (COD)</strong>
                    <p>Thanh toán tiền mặt cho nhân viên giao hàng khi nhận kiện hàng từ từng Cửa hàng.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Cột Phải: Kiểm Tra Danh Sách Tách Đơn & Nút Mua */}
          <div className="checkout-side-column">
            <div className="checkout-summary-card">
              <h3>Kiểm Tra Đơn Hàng ({groupedByShop.length} Cửa Hàng)</h3>

              <div className="split-orders-preview">
                {groupedByShop.map((shop, idx) => (
                  <div key={shop.cuaHangId} className="split-shop-item">
                    <div className="split-shop-header">
                      <span className="split-shop-badge">Gói hàng #{idx + 1}</span>
                      <strong>{shop.tenShop}</strong>
                    </div>
                    <ul className="split-items-mini">
                      {shop.items.map((i) => (
                        <li key={i.sku}>
                          <span>{i.name} (x{i.quantity})</span>
                          <span>{Number(i.price * i.quantity).toLocaleString('vi-VN')} đ</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="summary-breakdown">
                <div className="breakdown-row">
                  <span>Tổng tiền hàng:</span>
                  <span>{Number(totalPrice).toLocaleString('vi-VN')} đ</span>
                </div>
                {globalDiscount > 0 && (
                  <div className="breakdown-row discount">
                    <span>Voucher toàn sàn:</span>
                    <span>-{Number(globalDiscount).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="breakdown-row">
                  <span>Phí vận chuyển:</span>
                  <span className="free">MIỄN PHÍ</span>
                </div>
                <div className="summary-divider"></div>
                <div className="breakdown-row total">
                  <span>Tổng Thanh Toán:</span>
                  <span className="total-highlight">{Number(finalTotal).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-submit-order"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang Xử Lý Tách Đơn...' : `Đặt Hàng (${Number(finalTotal).toLocaleString('vi-VN')} đ)`}
              </button>

              <div className="terms-agree">
                Nhấn "Đặt Hàng" đồng nghĩa bạn đồng ý tuân thủ Điều khoản dịch vụ và chính sách phân phối 2 tầng của CTUT Marketplace.
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* MODAL THANH TOÁN MOMO INTERACTIVE */}
      {paymentModal?.isOpen && paymentModal.type === 'MOMO' && (
        <div className="modal-overlay">
          <div className="payment-modal-card">
            <div className="modal-header">
              <div className="momo-modal-badge">MoMo</div>
              <h4>Quét Mã Thanh Toán MoMo</h4>
            </div>

            <div className="qr-container">
              <img src={paymentModal.qrCodeUrl} alt="MoMo VietQR" className="qr-image" />
              <div className="qr-instruction">
                Mở <strong>App MoMo</strong> hoặc <strong>App Ngân Hàng</strong> bất kỳ và quét mã QR để chuyển đúng số tiền.
              </div>
            </div>

            <div className="transfer-info-box">
              <div className="t-row">
                <span>Số điện thoại MoMo:</span>
                <strong>{paymentModal.accountNumber} <button type="button" onClick={() => navigator.clipboard.writeText(paymentModal.accountNumber)}><FiCopy /></button></strong>
              </div>
              <div className="t-row">
                <span>Tên chủ tài khoản:</span>
                <strong>{paymentModal.accountName}</strong>
              </div>
              <div className="t-row">
                <span>Số tiền thanh toán:</span>
                <strong className="amount-highlight">{Number(paymentModal.amount).toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="t-row">
                <span>Nội dung chuyển tiền:</span>
                <strong className="code-highlight">{paymentModal.maGiaoDichGoc}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-confirm-paid"
                onClick={handleConfirmMoMoPaid}
              >
                <FiCheckCircle size={18} /> Tôi Đã Chuyển Tiền / Hoàn Tất
              </button>
              <a 
                href={paymentModal.payUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="btn-open-momo-link"
              >
                Mở Web MoMo <FiExternalLink />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THANH TOÁN WEB3 CRYPTO */}
      {paymentModal?.isOpen && paymentModal.type === 'CRYPTO' && (
        <div className="modal-overlay">
          <div className="payment-modal-card">
            <div className="modal-header">
              <div className="crypto-modal-badge">Web3</div>
              <h4>Thanh Toán On-Chain Crypto</h4>
            </div>

            <div className="crypto-details-box">
              <p>Chuyển USDT (BEP20 / ERC20) đến địa chỉ ví hệ thống:</p>
              <div className="wallet-address-box">
                <code>0x71C2d389F82935D62aA01684305DAbA94B85aB29</code>
              </div>
              <div className="crypto-amount-box">
                Số tiền tương đương: <strong>{paymentModal.cryptoAmount} USDT</strong>
              </div>
            </div>

            <div className="form-group txhash-group">
              <label>Nhập mã giao dịch Blockchain (TxHash) sau khi chuyển: *</label>
              <input
                type="text"
                placeholder="0x4b78c92a..."
                value={cryptoTxHash}
                onChange={(e) => setCryptoTxHash(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-confirm-paid"
                onClick={handleConfirmCryptoPaid}
              >
                <FiCheckCircle size={18} /> Xác Nhận Giao Dịch Web3
              </button>
              <button 
                type="button" 
                className="btn-cancel-modal"
                onClick={() => setPaymentModal(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;

