// src/pages/OrderSuccess.jsx
import { useLocation, Link } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiTruck, FiHome, FiShoppingBag, FiCreditCard } from 'react-icons/fi';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const location = useLocation();
  const orderData = location.state?.orderData || {
    maGiaoDichGoc: 'CHECKOUT-SAMPLE',
    danhSachDonHang: [
      { id: 1, maDonHang: 'DH-SAMPLE01', cuaHangId: 2, donViVanChuyen: 'GHTK', tongThanhToan: 29490000 },
      { id: 2, maDonHang: 'DH-SAMPLE02', cuaHangId: 3, donViVanChuyen: 'GHTK', tongThanhToan: 2390000 },
    ],
    tongThanhToanGop: 31880000,
  };
  const paymentMethod = location.state?.paymentMethod || 'MOMO';

  return (
    <div className="order-success-page">
      <div className="container">
        <div className="success-card">
          <div className="success-icon-wrap">
            <FiCheckCircle size={64} className="success-icon" />
          </div>

          <h2>Đặt Hàng Thành Công!</h2>
          <p className="success-subtitle">
            Cảm ơn bạn đã mua sắm trên <strong>Sàn TMĐT Tập Trung CTUT Gear</strong>.
          </p>

          <div className="checkout-session-box">
            <span className="session-label">MÃ PHIÊN CHECKOUT GỘP TOÀN SÀN:</span>
            <div className="session-code">{orderData.maGiaoDichGoc}</div>
            <div className="payment-status-badge">
              <FiCreditCard /> Phương thức: <strong>{paymentMethod}</strong> • Trạng thái: <strong className="paid-text">ĐÃ XÁC NHẬN</strong>
            </div>
          </div>

          {/* Danh sách các đơn hàng đã được tách cho từng Gian hàng */}
          <div className="split-orders-section">
            <h4>📦 Danh Sách Đơn Hàng Đã Tách Theo Từng Cửa Hàng:</h4>
            <div className="split-orders-grid">
              {(orderData.danhSachDonHang || []).map((order, idx) => (
                <div key={order.id || idx} className="split-order-item-card">
                  <div className="split-item-header">
                    <span className="order-idx">Gói hàng #{idx + 1}</span>
                    <strong className="order-code">{order.maDonHang}</strong>
                  </div>
                  <div className="split-item-details">
                    <div className="detail-line">
                      <span>Gian hàng:</span>
                      <strong>Shop ID #{order.cuaHangId || idx + 2}</strong>
                    </div>
                    <div className="detail-line">
                      <span>Đơn vị giao vận:</span>
                      <strong><FiTruck /> {order.donViVanChuyen || 'GHTK'}</strong>
                    </div>
                    <div className="detail-line">
                      <span>Tổng tiền đơn con:</span>
                      <strong className="sub-price">{Number(order.tongThanhToan).toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </div>
                  <div className="order-sub-status">
                    <span className="dot-status"></span> Đang chờ Shop xuất kho riêng
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="success-actions">
            <Link to="/" className="btn-back-home">
              <FiHome /> Về Trang Chủ Sàn
            </Link>
            <a 
              href="http://localhost:5173" 
              target="_blank" 
              rel="noreferrer" 
              className="btn-view-wms"
            >
              <FiPackage /> Theo Dõi Tại Portal Quản Trị Kho (WMS)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;

