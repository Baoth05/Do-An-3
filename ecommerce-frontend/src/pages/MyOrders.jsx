/**
 * ==============================================================================
 * Module: MyOrders.jsx
 * Mô tả: Trang Quản lý Đơn Mua Của Khách Hàng (Customer Orders Management CRUD).
 * Chức năng:
 *   - Read: Tra cứu danh sách đơn hàng đã đặt theo User ID từ order-service (port 8082).
 *   - Filter: Lọc đơn theo các trạng thái (Tất cả, Chờ xác nhận, Đang xử lý, Đang giao, Hoàn thành, Đã hủy).
 *   - Cancel (Update/Delete logic): Cho phép khách hàng HỦY đơn hàng khi ở trạng thái PENDING.
 *   - Reorder: Thêm các mặt hàng trong đơn trở lại giỏ hàng để mua lại nhanh chóng.
 * ==============================================================================
 */
import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import { CartContext } from '../context/CartContext';
import { 
  FiPackage, FiTruck, FiClock, FiCheckCircle, FiXCircle, 
  FiAlertCircle, FiArrowRight, FiRotateCcw, FiShoppingBag, FiStar 
} from 'react-icons/fi';
import './MyOrders.css';

const STATUS_TABS = [
  { id: 'ALL', label: 'Tất Cả Đơn' },
  { id: 'PENDING', label: 'Chờ Xác Nhận' },
  { id: 'CONFIRMED', label: 'Đang Xử Lý' },
  { id: 'SHIPPING', label: 'Đang Giao' },
  { id: 'COMPLETED', label: 'Đã Hoàn Thành' },
  { id: 'CANCELLED', label: 'Đã Hủy' },
];

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState(null);
  const [alertNotice, setAlertNotice] = useState('');

  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await marketplaceService.getUserOrders(101);
      setOrders(data);
    } catch (e) {
      console.error('Lỗi tải danh sách đơn hàng:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Xác nhận hủy đơn hàng (Order CRUD - Cancel)
  const handleOpenCancelModal = (order) => {
    setSelectedOrderToCancel(order);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrderToCancel) return;
    setCancellingId(selectedOrderToCancel.id);
    try {
      await marketplaceService.cancelOrder(selectedOrderToCancel.id);
      setAlertNotice(`Đã hủy thành công đơn hàng #${selectedOrderToCancel.maDonHang}`);
      setCancelModalOpen(false);
      setSelectedOrderToCancel(null);
      // Cập nhật lại danh sách đơn hàng
      await fetchOrders();
    } catch (err) {
      alert('Không thể hủy đơn hàng: ' + (err.message || 'Vui lòng thử lại'));
    } finally {
      setCancellingId(null);
      setTimeout(() => setAlertNotice(''), 3500);
    }
  };

  // Mua lại đơn hàng
  const handleReorder = (order) => {
    if (order.danhSachHang && order.danhSachHang.length > 0) {
      order.danhSachHang.forEach((item) => {
        addToCart({
          id: item.sanPhamId,
          sanPhamId: item.sanPhamId,
          sku: item.maHangHoa,
          tenSanPham: item.tenHangHoaSnapshot,
          giaBanHienTai: item.giaMuaSnapshot,
          khoHangId: order.cuaHangId,
          tenShop: order.tenShop || `Gian hàng #${order.cuaHangId}`,
        }, item.soLuong || 1);
      });
      navigate('/cart');
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'SHIPPING') {
      return order.trangThaiDonHang === 'SHIPPING' || order.trangThaiGiaoHang === 'DELIVERING' || order.trangThaiDonHang === 'DANG_GIAO';
    }
    return order.trangThaiDonHang === activeTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="status-badge badge-pending"><FiClock /> Chờ xác nhận</span>;
      case 'CONFIRMED':
        return <span className="status-badge badge-confirmed"><FiCheckCircle /> Đã tiếp nhận & soạn kho</span>;
      case 'SHIPPING':
      case 'DELIVERING':
      case 'DANG_GIAO':
        return <span className="status-badge badge-shipping"><FiTruck /> Đang giao bưu tá</span>;
      case 'COMPLETED':
      case 'HOAN_THANH':
        return <span className="status-badge badge-completed"><FiCheckCircle /> Đã giao thành công</span>;
      case 'CANCELLED':
      case 'DA_HUY':
        return <span className="status-badge badge-cancelled"><FiXCircle /> Đã hủy đơn</span>;
      default:
        return <span className="status-badge badge-pending">{status}</span>;
    }
  };

  return (
    <div className="my-orders-page">
      <div className="container">
        {/* Banner thông báo thao tác */}
        {alertNotice && (
          <div className="orders-toast-alert">
            <FiCheckCircle size={18} /> {alertNotice}
          </div>
        )}

        <div className="orders-header">
          <div className="orders-title-wrap">
            <FiPackage className="orders-main-icon" />
            <div>
              <h2>Đơn Mua Của Tôi</h2>
              <p>Quản lý, theo dõi tiến độ vận chuyển và xử lý đơn hàng đa gian hàng CTUT Gear</p>
            </div>
          </div>
          <Link to="/" className="btn-continue-shopping-top">
            <FiShoppingBag /> Mua Thêm Sản Phẩm
          </Link>
        </div>

        {/* Thanh Tabs Lọc Trạng Thái Đơn Hàng */}
        <div className="status-tabs-bar">
          {STATUS_TABS.map((tab) => {
            const count = tab.id === 'ALL' 
              ? orders.length 
              : orders.filter((o) => {
                  if (tab.id === 'SHIPPING') return o.trangThaiDonHang === 'SHIPPING' || o.trangThaiGiaoHang === 'DELIVERING';
                  return o.trangThaiDonHang === tab.id;
                }).length;

            return (
              <button
                key={tab.id}
                className={`tab-item-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                {count > 0 && <span className="tab-count-pill">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Danh sách đơn hàng */}
        {loading ? (
          <div className="orders-loading-card">
            <div className="spinner"></div>
            <p>Đang đồng bộ danh sách đơn mua từ hệ thống...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty-state">
            <FiShoppingBag size={54} className="empty-icon" />
            <h3>Chưa có đơn hàng nào ở trạng thái này</h3>
            <p>Hãy khám phá gian hàng và chọn mua những sản phẩm công nghệ bạn yêu thích!</p>
            <Link to="/" className="btn-go-shopping">Khám Phá Sàn Ngay</Link>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div key={order.id || order.maDonHang} className="order-card-item">
                {/* Header của thẻ đơn hàng */}
                <div className="order-card-header">
                  <div className="order-header-left">
                    <span className="order-shop-name">🏪 {order.tenShop || `Gian Hàng Shop #${order.cuaHangId}`}</span>
                    <span className="order-code-badge">Mã đơn: <strong>{order.maDonHang}</strong></span>
                    {order.maGiaoDichGoc && (
                      <span className="order-session-badge">Phiên gộp: {order.maGiaoDichGoc}</span>
                    )}
                  </div>
                  <div className="order-header-right">
                    {getStatusBadge(order.trangThaiDonHang)}
                  </div>
                </div>

                {/* Danh sách sản phẩm trong đơn */}
                <div className="order-products-container">
                  {(order.danhSachHang || []).map((prod, idx) => (
                    <div key={idx} className="order-prod-row">
                      <div className="prod-thumb">
                        <img 
                          src="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100" 
                          alt={prod.tenHangHoaSnapshot} 
                        />
                      </div>
                      <div className="prod-details">
                        <h4 className="prod-name">{prod.tenHangHoaSnapshot || 'Sản phẩm chính hãng CTUT'}</h4>
                        <div className="prod-sku">Mã SKU: {prod.maHangHoa}</div>
                        <div className="prod-qty">Số lượng: x{prod.soLuong || 1}</div>
                      </div>
                      <div className="prod-price-col">
                        <span className="unit-price">{Number(prod.giaMuaSnapshot || 0).toLocaleString('vi-VN')} đ</span>
                        <span className="line-total">{Number((prod.giaMuaSnapshot || 0) * (prod.soLuong || 1)).toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer thông tin vận chuyển, thanh toán & hành động */}
                <div className="order-card-footer">
                  <div className="footer-meta-info">
                    <div className="meta-line">
                      <FiTruck /> Đơn vị giao vận: <strong>{order.donViVanChuyen || 'GHTK'}</strong>
                    </div>
                    <div className="meta-line">
                      <span>Thanh toán:</span>
                      <strong className={order.trangThaiThanhToan === 'PAID' ? 'text-paid' : 'text-unpaid'}>
                        {order.trangThaiThanhToan === 'PAID' ? '✓ Đã Thanh Toán' : 'Chờ Thanh Toán'} ({order.phuongThucThanhToan || 'COD'})
                      </strong>
                    </div>
                    {order.createdAt && (
                      <div className="meta-line text-muted">
                        <FiClock /> Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </div>

                  <div className="footer-payment-actions">
                    <div className="order-total-block">
                      <span className="total-label">Thành tiền:</span>
                      <span className="total-amount-strong">{Number(order.tongThanhToan || 0).toLocaleString('vi-VN')} đ</span>
                    </div>

                    <div className="actions-buttons-row">
                      {/* Cho phép HỦY ĐƠN HÀNG khi trạng thái PENDING */}
                      {(order.trangThaiDonHang === 'PENDING' || !order.trangThaiDonHang) && (
                        <button
                          className="btn-cancel-order"
                          onClick={() => handleOpenCancelModal(order)}
                          disabled={cancellingId === order.id}
                        >
                          <FiXCircle /> Hủy Đơn Hàng
                        </button>
                      )}

                      {/* Mua lại đơn hàng */}
                      <button 
                        className="btn-reorder"
                        onClick={() => handleReorder(order)}
                        title="Thêm các món vào giỏ hàng để mua lại"
                      >
                        <FiRotateCcw /> Mua Lại
                      </button>

                      {/* Đánh giá sản phẩm */}
                      {order.trangThaiDonHang === 'COMPLETED' && (
                        <Link 
                          to={`/products/${order.danhSachHang?.[0]?.sanPhamId || 1}`} 
                          className="btn-rate-order"
                        >
                          <FiStar /> Đánh Giá
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Xác Nhận Hủy Đơn Hàng */}
        {cancelModalOpen && selectedOrderToCancel && (
          <div className="modal-backdrop-overlay" onClick={() => setCancelModalOpen(false)}>
            <div className="cancel-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-icon-alert">
                <FiAlertCircle size={44} />
              </div>
              <h3>Xác Nhận Hủy Đơn Hàng?</h3>
              <p>
                Bạn có chắc chắn muốn hủy đơn hàng <strong>#{selectedOrderToCancel.maDonHang}</strong> từ{' '}
                <strong>{selectedOrderToCancel.tenShop || 'Gian hàng'}</strong> không?
              </p>
              <div className="modal-actions-buttons">
                <button 
                  className="btn-abort" 
                  onClick={() => setCancelModalOpen(false)}
                >
                  Không Hủy
                </button>
                <button 
                  className="btn-confirm-delete" 
                  onClick={handleConfirmCancel}
                  disabled={cancellingId === selectedOrderToCancel.id}
                >
                  {cancellingId === selectedOrderToCancel.id ? 'Đang Xử Lý...' : 'Đồng Ý Hủy Đơn'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;

