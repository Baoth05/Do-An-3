// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer'; // <-- 1. Import component Footer mới chuẩn Shopee
import LiveChatWidget from './components/LiveChatWidget';
import MarketplaceHome from './pages/MarketplaceHome';
import ShopPage from './pages/ShopPage';
import ProductDetail from './pages/ProductDetail';
import MultiShopCart from './pages/MultiShopCart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import VouchersPage from './pages/VouchersPage';
import MyOrders from './pages/MyOrders';
import CustomerProfile from './pages/CustomerProfile';
import Login from './pages/Login';
import CustomerRegister from './pages/CustomerRegister';

// Seller Portal Pages
import SellerLayout from './pages/Seller/SellerLayout';
import SellerLogin from './pages/Seller/SellerLogin';
import SellerDashboard from './pages/Seller/SellerDashboard';
import SellerProducts from './pages/Seller/SellerProducts';
import SellerOrders from './pages/Seller/SellerOrders';
import SellerVouchers from './pages/Seller/SellerVouchers';
import SellerShopSettings from './pages/Seller/SellerShopSettings';
import SellerRegister from './pages/Seller/SellerRegister';
import SellerContracts from './pages/Seller/SellerContracts';
import SellerContractCreate from './pages/Seller/SellerContractCreate';
import SellerContractDetail from './pages/Seller/SellerContractDetail';

import './App.css';

function AppContent() {
  const location = useLocation();

  // Kiểm tra xem người dùng có đang ở trong Kênh Người Bán (Dashboard) hay không
  const isSellerPortal =
    location.pathname.startsWith('/seller') &&
    location.pathname !== '/seller/register' &&
    location.pathname !== '/seller/login';

  return (
    <div className={isSellerPortal ? 'seller-root' : 'marketplace-app'}>
      {/* Ẩn Header sàn khi đang ở Kênh Người Bán Dashboard */}
      {!isSellerPortal && <Header />}

      <main className={isSellerPortal ? 'seller-main-body' : 'marketplace-main-body'}>
        <Routes>
          {/* Cụm Trang Sàn Thương Mại Điện Tử (Dành cho Khách Hàng) */}
          <Route path="/" element={<MarketplaceHome />} />
          <Route path="/stores/:storeId" element={<ShopPage />} />
          <Route path="/products/:productId" element={<ProductDetail />} />
          <Route path="/cart" element={<MultiShopCart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/profile" element={<CustomerProfile />} />
          <Route path="/vouchers" element={<VouchersPage />} />

          {/* Cổng Đăng Nhập & Đăng Ký Tài Khoản Khách Hàng Tách Biệt */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<CustomerRegister />} />

          {/* Cổng Đăng Nhập & Đăng Ký Dành Riêng Cho Chủ Cửa Hàng (Seller) */}
          <Route path="/seller/login" element={<SellerLogin />} />
          <Route path="/seller/register" element={<SellerRegister />} />

          {/* Cụm Trang Kênh Người Bán (Chỉ vào được sau khi Đăng Nhập Chủ Shop) */}
          <Route path="/seller" element={<SellerLayout />}>
            <Route index element={<SellerDashboard />} />
            <Route path="contracts" element={<SellerContracts />} />
            <Route path="contracts/create" element={<SellerContractCreate />} />
            <Route path="contracts/:contractId" element={<SellerContractDetail />} />
            <Route path="products" element={<SellerProducts />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="vouchers" element={<SellerVouchers />} />
            <Route path="settings" element={<SellerShopSettings />} />
          </Route>

          <Route path="*" element={<MarketplaceHome />} />
        </Routes>
      </main>

      {/* Bot Chat Hỗ Trợ Tư Vấn Mua Sắm & Khiếu Nại Báo Lỗi Toàn Cục */}
      <LiveChatWidget />

      {/* 2. Hiển thị Footer mới chuẩn Shopee ở toàn bộ trang sàn (tự ẩn ở Kênh Người Bán) */}
      {!isSellerPortal && <Footer />}
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
}

export default App;