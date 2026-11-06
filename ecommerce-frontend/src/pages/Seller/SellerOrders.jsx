// src/pages/Seller/SellerOrders.jsx
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { 
  FiShoppingBag, FiTruck, FiCheckCircle, FiXCircle, 
  FiClock, FiPackage, FiFilter, FiSearch, FiCheck, FiSend 
} from 'react-icons/fi';
import './SellerOrders.css';

const SELLER_ORDER_TABS = [
  { id: 'ALL', label: 'Tất Cả Đơn' },
  { id: 'PENDING', label: 'Chờ Tiếp Nhận' },
  { id: 'CONFIRMED', label: 'Đã Tiếp Nhận & Soạn Kho' },
  { id: 'SHIPPING', label: 'Đang Giao Bưu Tá' },
  { id: 'COMPLETED', label: 'Giao Thành Công' },
  { id: 'CANCELLED', label: 'Đã Hủy' },
];

const SellerOrders = () => {
  const { storeId, currentStore } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchKey, setSearchKey] = useState('');
  const [alertNotice, setAlertNotice] = useState('');

  // Modal cập nhật giao vận
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shippingProvider, setShippingProvider] = useState('GHTK');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await marketplaceService.getStoreOrders(storeId);
      setOrders(data);
    } catch (err) {
      console.error('Lỗi tải đơn hàng shop:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchOrders();
    }
  }, [storeId]);

  // Cập nhật trạng thái đơn hàng (CONFIRMED, COMPLETED, CANCELLED)
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await marketplaceService.updateStoreOrderStatus(orderId, newStatus);
      setAlertNotice(`Đã cập nhật trạng thái đơn sang "${newStatus}"!`);
      setTimeout(() => setAlertNotice(''), 3000);
      await fetchOrders();
    } catch (err) {
      alert('Lỗi cập nhật: ' + (err.response?.data || err.message));
    }
  };

  // Mở modal bàn giao bưu tá
  const handleOpenShippingModal = (order) => {
    setSelectedOrder(order);
    setShippingProvider(order.donViVanChuyen || 'GHTK');
    setShippingModalOpen(true);
  };

  // Lưu giao vận cho bưu tá
  const handleConfirmShipping = async () => {
    if (!selectedOrder) return;
    try {
      await marketplaceService.updateShippingStatus(selectedOrder.id, 'DELIVERING', shippingProvider);
      setAlertNotice(`Đã bàn giao đơn hàng #${selectedOrder.maDonHang} cho đơn vị ${shippingProvider}!`);
      setShippingModalOpen(false);
      setSelectedOrder(null);
      setTimeout(() => setAlertNotice(''), 3000);
      await fetchOrders();
    } catch (err) {
      alert('Lỗi điều phối giao vận: ' + (err.response?.data || err.message));
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = 
      activeTab === 'ALL' ||
      (activeTab === 'PENDING' && (o.trangThaiDonHang === 'PENDING' || !o.trangThaiDonHang)) ||
      (activeTab === 'SHIPPING' && (o.trangThaiDonHang === 'SHIPPING' || o.trangThaiGiaoHang === 'DELIVERING')) ||
      o.trangThaiDonHang === activeTab;

    const q = searchKey.toLowerCase().trim();
    const matchSearch = 
      !q || 
      (o.maDonHang || '').toLowerCase().includes(q) ||
      (o.hoTen || '').toLowerCase().includes(q) ||
      (o.soDienThoai || '').includes(q);

    return matchStatus && matchSearch;
  });

  return (
    <div className="seller-orders-page">
      {alertNotice && (
        <div className="seller-toast-alert">
          <FiCheckCircle size={18} /> {alertNotice}
        </div>
      )}

      <div className="seller-page-header">
        <div>
          <h2>Quản Lý Đơn Hàng Của Gian Hàng</h2>
          <p>
            Tiếp nhận, đóng gói và điều phối bưu tá xuất kho cho các đơn hàng của shop 
            <strong> {currentStore?.tenKho || 'CTUT Gear'}</strong>
          </p>
        </div>
      </div>

      {/* Tabs trạng thái */}
      <div className="seller-order-tabs">
        {SELLER_ORDER_TABS.map((tab) => {
          const count = tab.id === 'ALL' 
            ? orders.length 
            : orders.filter((o) => {
                if (tab.id === 'PENDING') return o.trangThaiDonHang === 'PENDING' || !o.trangThaiDonHang;
                if (tab.id === 'SHIPPING') return o.trangThaiDonHang === 'SHIPPING' || o.trangThaiGiaoHang === 'DELIVERING';
                return o.trangThaiDonHang === tab.id;
              }).length;

          return (
            <button
              key={tab.id}
              className={`seller-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
              {count > 0 && <span className="tab-pill">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Tìm kiếm */}
      <div className="orders-search-bar">
        <FiSearch />
        <input
          type="text"
          placeholder="Tìm theo mã đơn hàng, tên khách hàng, số điện thoại..."
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
        />
      </div>

      {/* Danh sách đơn hàng */}
      {loading ? (
        <div className="seller-loading-state">
          <div className="spinner"></div>
          <p>Đang tải danh sách đơn hàng...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="seller-empty-state">
          <FiShoppingBag size={48} className="empty-icon" />
          <h3>Không có đơn hàng nào trong mục này</h3>
          <p>Các đơn hàng mới của khách sẽ hiển thị ngay tại đây khi có người mua.</p>
        </div>
      ) : (
        <div className="seller-orders-list">
          {filteredOrders.map((ord) => (
            <div key={ord.id} className="seller-order-card">
              <div className="order-card-top">
                <div>
                  <span className="order-code-lg">#{ord.maDonHang}</span>
                  <span className="order-date-text">
                    {ord.createdAt ? new Date(ord.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}
                  </span>
                  {ord.maGiaoDichGoc && (
                    <span className="session-tag">Phiên gộp: {ord.maGiaoDichGoc}</span>
                  )}
                </div>

                <div className="status-badge-wrap">
                  <span className={`status-pill pill-${(ord.trangThaiDonHang || 'PENDING').toLowerCase()}`}>
                    {ord.trangThaiDonHang || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Thông tin khách hàng & Giao hàng */}
              <div className="order-recipient-info">
                <div className="recipient-col">
                  <span className="label-s">Khách nhận:</span>
                  <strong>{ord.hoTen || 'Khách Hàng'} ({ord.soDienThoai || '0901234567'})</strong>
                  <p className="address-text">📍 {ord.diaChiGiaoHang || 'Địa chỉ nhận hàng'}</p>
                </div>
                <div className="shipping-col">
                  <span className="label-s">Vận chuyển:</span>
                  <div><FiTruck /> {ord.donViVanChuyen || 'GHTK'} • {ord.trangThaiGiaoHang || 'WAITING'}</div>
                  <span className="label-s" style={{ marginTop: '6px' }}>Thanh toán:</span>
                  <strong className={ord.trangThaiThanhToan === 'PAID' ? 'text-green' : 'text-amber'}>
                    {ord.trangThaiThanhToan === 'PAID' ? '✓ Đã Thanh Toán' : 'Chờ Thanh Toán COD'} ({ord.phuongThucThanhToan || 'COD'})
                  </strong>
                </div>
              </div>

              {/* Danh sách hàng trong kiện của Shop */}
              <div className="order-items-table">
                {(ord.danhSachHang || []).map((prod, idx) => (
                  <div key={idx} className="item-row">
                    <span className="item-name">{prod.tenHangHoaSnapshot || 'Sản phẩm'}</span>
                    <span className="item-sku">SKU: {prod.maHangHoa}</span>
                    <span className="item-qty">x{prod.soLuong || 1}</span>
                    <span className="item-price">{Number(prod.giaMuaSnapshot || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                ))}
              </div>

              {/* Footer Thao Tác & Tổng Tiền */}
              <div className="order-card-bottom">
                <div className="total-amount-box">
                  <span>Tổng tiền đơn shop thu:</span>
                  <strong>{Number(ord.tongThanhToan || 0).toLocaleString('vi-VN')} đ</strong>
                </div>

                <div className="seller-action-buttons">
                  {/* Chờ tiếp nhận -> Bấm xác nhận */}
                  {(ord.trangThaiDonHang === 'PENDING' || !ord.trangThaiDonHang) && (
                    <>
                      <button 
                        className="btn-confirm-order"
                        onClick={() => handleUpdateStatus(ord.id, 'CONFIRMED')}
                      >
                        <FiCheck /> Tiếp Nhận & Soạn Hàng
                      </button>
                      <button 
                        className="btn-cancel-seller"
                        onClick={() => handleUpdateStatus(ord.id, 'CANCELLED')}
                      >
                        <FiXCircle /> Hủy Đơn
                      </button>
                    </>
                  )}

                  {/* Đã xác nhận -> Bấm giao cho bưu tá */}
                  {ord.trangThaiDonHang === 'CONFIRMED' && (
                    <button 
                      className="btn-dispatch-shipping"
                      onClick={() => handleOpenShippingModal(ord)}
                    >
                      <FiSend /> Bàn Giao Cho Bưu Tá
                    </button>
                  )}

                  {/* Đang giao -> Bấm hoàn thành */}
                  {(ord.trangThaiDonHang === 'SHIPPING' || ord.trangThaiGiaoHang === 'DELIVERING') && (
                    <button 
                      className="btn-complete-order"
                      onClick={() => handleUpdateStatus(ord.id, 'COMPLETED')}
                    >
                      <FiCheckCircle /> Đã Giao Thành Công
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Bàn Giao Bưu Tá */}
      {shippingModalOpen && selectedOrder && (
        <div className="modal-backdrop-overlay" onClick={() => setShippingModalOpen(false)}>
          <div className="publish-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚚 Điều Phối Bưu Tá Cho Đơn #{selectedOrder.maDonHang}</h3>
              <span className="btn-close-modal" onClick={() => setShippingModalOpen(false)}>✕</span>
            </div>
            
            <p className="modal-sub">
              Xác nhận kiện hàng đã được Shop đóng gói hoàn tất và bàn giao cho tài xế giao vận:
            </p>

            <div className="form-group-seller">
              <label>Chọn Đơn Vị Giao Vận Đối Tác:</label>
              <select 
                value={shippingProvider} 
                onChange={(e) => setShippingProvider(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="GHTK">Giao Hàng Tiết Kiệm (GHTK Express)</option>
                <option value="GHN">Giao Hàng Nhanh (GHN)</option>
                <option value="VTPOST">Viettel Post Bưu Chính</option>
              </select>
            </div>

            <div className="modal-actions-footer">
              <button className="btn-cancel" onClick={() => setShippingModalOpen(false)}>Hủy</button>
              <button className="btn-save-publish" onClick={handleConfirmShipping}>
                Xác Nhận Xuất Kho & Giao Bưu Tá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrders;

