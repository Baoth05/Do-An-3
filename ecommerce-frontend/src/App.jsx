// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import MarketplaceHome from './pages/MarketplaceHome';
import ShopPage from './pages/ShopPage';
import ProductDetail from './pages/ProductDetail';
import MultiShopCart from './pages/MultiShopCart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import VouchersPage from './pages/VouchersPage';
import './App.css';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="marketplace-app">
          <Header />
          <main className="marketplace-main-body">
            <Routes>
              <Route path="/" element={<MarketplaceHome />} />
              <Route path="/stores/:storeId" element={<ShopPage />} />
              <Route path="/products/:productId" element={<ProductDetail />} />
              <Route path="/cart" element={<MultiShopCart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/vouchers" element={<VouchersPage />} />
              <Route path="*" element={<MarketplaceHome />} />
            </Routes>
          </main>

          <footer className="marketplace-footer">
            <div className="container footer-content">
              <div className="footer-col">
                <h4>CTUT GEAR MARKETPLACE</h4>
                <p>Hệ sinh thái Sàn Thương Mại Điện Tử Tập Trung kết hợp Chuỗi Cung Ứng Kho Vận 2 Tầng (B2B2C).</p>
                <small>© 2026 CTUT Đồ Án 3 - All Rights Reserved.</small>
              </div>
              <div className="footer-col">
                <h5>Kiến Trúc Microservices</h5>
                <ul>
                  <li>• API Gateway: Cổng 8080</li>
                  <li>• WMS Core Service: Cổng 8081</li>
                  <li>• Order Service (Order Splitting): Cổng 8082</li>
                  <li>• Interaction Service: Cổng 8083</li>
                  <li>• Identity Service: Cổng 8084</li>
                  <li>• Payment Service (MoMo & Web3): Cổng 8085</li>
                </ul>
              </div>
              <div className="footer-col">
                <h5>Liên Kết Nhanh</h5>
                <ul>
                  <li><a href="http://localhost:5173" target="_blank" rel="noreferrer">🏢 Portal Quản Trị & Kho Bãi (WMS)</a></li>
                  <li><a href="http://localhost:5174" target="_blank" rel="noreferrer">🛡️ Admin Dashboard (Phân Quyền)</a></li>
                </ul>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
