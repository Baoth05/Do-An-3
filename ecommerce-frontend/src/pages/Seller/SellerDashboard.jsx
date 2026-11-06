// src/pages/Seller/SellerDashboard.jsx
import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { 
  FiDollarSign, FiShoppingBag, FiBox, FiCheckCircle, 
  FiClock, FiTruck, FiAlertCircle, FiArrowRight 
} from 'react-icons/fi';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const { storeId, currentStore } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [ordersData, invData] = await Promise.all([
          marketplaceService.getStoreOrders(storeId),
          marketplaceService.getSellerInventory(storeId),
        ]);
        setOrders(ordersData);
        setInventory(invData);
      } catch (err) {
        console.error('Lỗi tải dữ liệu Dashboard seller:', err);
      } finally {
        setLoading(false);
      }
    };
    if (storeId) {
      fetchDashboardData();
    }
  }, [storeId]);

  // Tính toán số liệu thống kê
  const totalRevenue = orders
    .filter((o) => o.trangThaiDonHang !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.tongThanhToan || 0), 0);

  const pendingOrders = orders.filter((o) => o.trangThaiDonHang === 'PENDING' || !o.trangThaiDonHang);
  const shippingOrders = orders.filter((o) => o.trangThaiDonHang === 'SHIPPING' || o.trangThaiGiaoHang === 'DELIVERING');
  const completedOrders = orders.filter((o) => o.trangThaiDonHang === 'COMPLETED');

  const publishedProds = inventory.filter((i) => i.dangBan === true);
  const lowStockProds = inventory.filter((i) => i.soLuongThucTe <= (i.soLuongToiThieu || 5));

  return (
    <div className="seller-dashboard-page">
      <div className="dashboard-welcome-banner">
        <div>
          <h2>Xin chào, Chủ Cửa Hàng! 👋</h2>
          <p>
            Chào mừng bạn đến với Kênh Quản Trị Gian Hàng <strong>{currentStore?.tenKho || 'CTUT Gear'}</strong>.
            Dưới đây là tình hình kinh doanh và các đơn hàng cần bạn xử lý.
          </p>
        </div>
        <Link to="/seller/products" className="btn-go-publish">
          <FiBox /> Đăng Bán Sản Phẩm Mới
        </Link>
      </div>

      {/* 4 Chỉ Số Kinh Doanh Quan Trọng */}
      <div className="kpi-metrics-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald"><FiDollarSign /></div>
          <div>
            <span className="kpi-label">Doanh Thu Tích Lũy</span>
            <strong className="kpi-val">{Number(totalRevenue).toLocaleString('vi-VN')} đ</strong>
            <small className="kpi-sub">Từ {orders.length} đơn hàng</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-amber"><FiClock /></div>
          <div>
            <span className="kpi-label">Đơn Chờ Tiếp Nhận</span>
            <strong className="kpi-val">{pendingOrders.length} đơn</strong>
            <small className="kpi-sub text-warn">Cần shop xác nhận & soạn kho</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-indigo"><FiTruck /></div>
          <div>
            <span className="kpi-label">Đang Giao Vận</span>
            <strong className="kpi-val">{shippingOrders.length} kiện</strong>
            <small className="kpi-sub">Đang được bưu tá điều phối</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-blue"><FiBox /></div>
          <div>
            <span className="kpi-label">Sản Phẩm Đang Mở Bán</span>
            <strong className="kpi-val">{publishedProds.length} / {inventory.length}</strong>
            <small className="kpi-sub">Khách hàng nhìn thấy trên sàn</small>
          </div>
        </div>
      </div>

      {/* Cảnh Báo Tồn Kho Thấp */}
      {lowStockProds.length > 0 && (
        <div className="low-stock-alert-box">
          <div className="alert-title">
            <FiAlertCircle /> Cảnh báo tồn kho sắp hết ({lowStockProds.length} mặt hàng)
          </div>
          <p>
            Có {lowStockProds.length} sản phẩm trong kho của bạn chạm ngưỡng cảnh báo tồn kho. Hãy nhập thêm
            hàng qua Portal Kho WMS hoặc điều chỉnh lại ngưỡng bán trên sàn.
          </p>
          <div className="low-stock-tags">
            {lowStockProds.slice(0, 4).map((p) => (
              <span key={p.id} className="low-prod-pill">
                {p.tenSanPham}: còn {p.soLuongThucTe} cái
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bảng Đơn Hàng Cần Xử Lý Gần Đây */}
      <div className="recent-orders-card">
        <div className="card-header-flex">
          <div>
            <h3>Đơn Hàng Gần Đây Của Gian Hàng</h3>
            <p>Danh sách các đơn khách vừa đặt qua Sàn TMĐT cần chuẩn bị xuất kho</p>
          </div>
          <Link to="/seller/orders" className="link-view-all">
            Xem Tất Cả Đơn Hàng <FiArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className="dashboard-loading">Đang tải dữ liệu...</div>
        ) : orders.length === 0 ? (
          <div className="no-data-notice">Gian hàng chưa có đơn hàng nào từ khách.</div>
        ) : (
          <div className="table-responsive">
            <table className="seller-simple-table">
              <thead>
                <tr>
                  <th>Mã Đơn</th>
                  <th>Khách Hàng</th>
                  <th>Tổng Tiền</th>
                  <th>ĐVVC</th>
                  <th>Thanh Toán</th>
                  <th>Trạng Thái</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id}>
                    <td><strong>{ord.maDonHang}</strong></td>
                    <td>
                      <div>{ord.hoTen || 'Khách Vãng Lai'}</div>
                      <small className="text-muted">{ord.soDienThoai}</small>
                    </td>
                    <td><strong className="text-danger">{Number(ord.tongThanhToan || 0).toLocaleString('vi-VN')} đ</strong></td>
                    <td>{ord.donViVanChuyen || 'GHTK'}</td>
                    <td>
                      <span className={`badge-payment ${ord.trangThaiThanhToan === 'PAID' ? 'paid' : 'unpaid'}`}>
                        {ord.trangThaiThanhToan === 'PAID' ? 'Đã Thanh Toán' : 'COD'}
                      </span>
                    </td>
                    <td>
                      <span className="badge-ord-status">{ord.trangThaiDonHang || 'PENDING'}</span>
                    </td>
                    <td>
                      <Link to="/seller/orders" className="btn-detail-sm">
                        Xử Lý
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;

