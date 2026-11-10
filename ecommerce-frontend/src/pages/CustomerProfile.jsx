// src/pages/CustomerProfile.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { marketplaceService } from '../services/marketplaceService';
import { 
  FiUser, FiCreditCard, FiPackage, FiTag, FiMessageSquare, 
  FiShield, FiEdit3, FiLock, FiCheckCircle, FiClock, FiPlusCircle, 
  FiSend, FiShoppingBag, FiTruck, FiAlertCircle, FiArrowRight, FiCopy, FiDollarSign, FiTrash2 
} from 'react-icons/fi';
import './CustomerProfile.css';

const DEFAULT_STORES_CHAT = [
  {
    id: 1,
    name: 'Apple Store Chính Hãng CTUT',
    avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120',
    status: 'Trực tuyến 24/7',
    introMsg: '👋 Chào bạn! Cảm ơn bạn đã quan tâm đến Apple Store CTUT. Chúng mình có thể tư vấn dòng iPhone, iPad, Mac hay phụ kiện chính hãng nào cho bạn?'
  },
  {
    id: 2,
    name: 'CTUT Gaming & Gear Hub',
    avatar: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=120',
    status: 'Phản hồi trong 5 phút',
    introMsg: '🎮 Xin chào game thủ! Bạn cần tư vấn cấu hình VGA RTX, linh kiện PC Master Catalog hay phụ kiện Gaming Gear?'
  },
  {
    id: 3,
    name: 'ASUS ROG Official Store',
    avatar: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=120',
    status: 'Trực tuyến',
    introMsg: '⚡ Chào bạn! ASUS ROG Store CTUT cam kết bảo hành 1 đổi 1 trong 30 ngày tại Kho Tổng. Bạn muốn kiểm tra tồn kho mã laptop hay mainboard nào?'
  },
  {
    id: 0,
    name: '🤖 Trợ Lý AI Toàn Sàn (Hỗ Trợ Khẩn)',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120',
    status: 'AI Tự Động 24/7',
    introMsg: 'Xin chào! Mình là Trợ lý AI toàn sàn CTUT Gear, hỗ trợ tra cứu đơn hàng, giải quyết khiếu nại bưu tá và chính sách bảo hành.'
  }
];

const QUICK_CHAT_PROMPTS = [
  'Shop ơi sản phẩm này còn hàng sẵn trong kho không?',
  'Bao lâu shop soạn hàng và bàn giao cho bưu tá ạ?',
  'Sản phẩm này có được bảo hành 1 đổi 1 chính hãng không?',
  'Shop có mã giảm giá riêng độc quyền nào cho mình xin với!'
];

const CustomerProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [customer, setCustomer] = useState(() => authService.getCurrentCustomer());
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'info');
  const [toastMsg, setToastMsg] = useState('');

  // 1. Profile Info Form
  const [profileForm, setProfileForm] = useState({
    hoTen: customer?.hoTen || '',
    email: customer?.email || '',
    soDienThoai: customer?.soDienThoai || '',
    diaChi: customer?.diaChi || '',
    gioiTinh: 'Nam',
    ngaySinh: '2000-01-01'
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Đổi mật khẩu
  const [passwordForm, setPasswordForm] = useState({
    matKhauCu: '',
    matKhauMoi: '',
    xacNhanMatKhau: ''
  });

  // 2. Virtual Wallet (Ví ảo CTUT Pay)
  const [walletBalance, setWalletBalance] = useState(() => {
    const saved = localStorage.getItem(`customer_wallet_${customer?.taiKhoan}`);
    return saved !== null ? Number(saved) : 5000000;
  });
  const [walletHistory, setWalletHistory] = useState(() => {
    const saved = localStorage.getItem(`customer_wallet_history_${customer?.taiKhoan}`);
    return saved ? JSON.parse(saved) : [
      { id: 1, type: 'DEPOSIT', title: 'Tặng vốn khởi tạo thành viên mới', amount: 5000000, time: 'Hôm nay', status: 'Thành công' }
    ];
  });

  // 3. Orders (Đơn hàng đã mua)
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [loadingOrders, setLoadingOrders] = useState(false);

  // 4. Vouchers
  const [savedVouchers, setSavedVouchers] = useState([]);

  // 5. Shopee-like Store Chat
  const [chatStores, setChatStores] = useState(DEFAULT_STORES_CHAT);
  const [selectedChatStore, setSelectedChatStore] = useState(() => {
    if (location.state?.targetStoreId) {
      const targetId = Number(location.state.targetStoreId);
      const found = DEFAULT_STORES_CHAT.find((s) => s.id === targetId);
      if (found) return found;
      return {
        id: targetId,
        name: location.state.storeName || `Gian hàng đối tác #${targetId}`,
        avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120',
        status: 'Trực tuyến',
        introMsg: `👋 Chào bạn! Cảm ơn bạn đã nhắn tin cho ${location.state.storeName || 'shop'}. Shop có thể hỗ trợ gì cho bạn?`
      };
    }
    return DEFAULT_STORES_CHAT[0];
  });
  const [chatMessages, setChatMessages] = useState({});
  const [inputMessage, setInputMessage] = useState('');
  const [isStoreTyping, setIsStoreTyping] = useState(false);

  // 6. Feedback & Tickets
  const [supportTickets, setSupportTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('support_tickets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Check auth
  useEffect(() => {
    const cur = authService.getCurrentCustomer();
    if (!cur) {
      navigate('/login', { state: { from: location } });
    } else {
      setCustomer(cur);
    }
  }, [navigate, location]);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    if (location.state?.targetStoreId) {
      const targetId = Number(location.state.targetStoreId);
      const found = DEFAULT_STORES_CHAT.find((s) => s.id === targetId);
      if (found) {
        setSelectedChatStore(found);
      } else {
        setSelectedChatStore({
          id: targetId,
          name: location.state.storeName || `Gian hàng đối tác #${targetId}`,
          avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120',
          status: 'Trực tuyến',
          introMsg: `👋 Chào bạn! Cảm ơn bạn đã nhắn tin cho ${location.state.storeName || 'shop'}. Shop có thể hỗ trợ gì cho bạn?`
        });
      }
    }
  }, [location.state]);

  // Load orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!customer) return;
      setLoadingOrders(true);
      try {
        const data = await marketplaceService.getUserOrders(customer.id);
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOrders(false);
      }
    };
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, customer]);

  // Load vouchers
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const saved = await marketplaceService.getUserSavedVouchers();
        setSavedVouchers(saved);
      } catch (e) {
        console.warn(e);
      }
    };
    if (activeTab === 'vouchers') {
      fetchVouchers();
    }
  }, [activeTab]);

  const handleRemoveSavedVoucher = async (code) => {
    const nextList = await marketplaceService.removeUserSavedVoucher(code);
    setSavedVouchers(nextList);
    setToastMsg(`Đã gỡ mã "${code}" khỏi ví voucher!`);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleCopyVoucher = (code) => {
    navigator.clipboard?.writeText(code);
    setToastMsg(`Đã sao chép mã "${code}" vào bộ nhớ tạm!`);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Load chat messages from localStorage
  useEffect(() => {
    if (!customer) return;
    try {
      const savedChat = localStorage.getItem(`customer_chat_history_${customer.taiKhoan}`);
      if (savedChat) {
        setChatMessages(JSON.parse(savedChat));
      } else {
        // Khởi tạo tin nhắn chào mừng cho từng shop
        const initial = {};
        DEFAULT_STORES_CHAT.forEach((s) => {
          initial[s.id] = [
            {
              id: Date.now() + s.id,
              sender: 'store',
              senderName: s.name,
              text: s.introMsg,
              time: 'Vừa xong'
            }
          ];
        });
        setChatMessages(initial);
      }
    } catch (e) {
      console.warn(e);
    }
  }, [customer]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Cập nhật thông tin cá nhân
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const updatedUser = {
        ...customer,
        hoTen: profileForm.hoTen.trim(),
        email: profileForm.email.trim(),
        soDienThoai: profileForm.soDienThoai.trim(),
        diaChi: profileForm.diaChi.trim(),
        gioiTinh: profileForm.gioiTinh,
        ngaySinh: profileForm.ngaySinh
      };

      await marketplaceService.updateUserProfile(customer.id, updatedUser);
      localStorage.setItem('customer_user', JSON.stringify(updatedUser));
      setCustomer(updatedUser);
      showToast('🎉 Đã cập nhật thông tin cá nhân thành công!');
    } catch (err) {
      showToast('Lỗi cập nhật: ' + err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.matKhauMoi.length < 6) {
      alert('Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return;
    }
    if (passwordForm.matKhauMoi !== passwordForm.xacNhanMatKhau) {
      alert('Xác nhận mật khẩu không khớp!');
      return;
    }

    try {
      await marketplaceService.changePassword(customer.taiKhoan, {
        matKhauCu: passwordForm.matKhauCu,
        matKhauMoi: passwordForm.matKhauMoi
      });
      alert('✅ Đổi mật khẩu thành công!');
      setPasswordForm({ matKhauCu: '', matKhauMoi: '', xacNhanMatKhau: '' });
    } catch (err) {
      alert('Lỗi đổi mật khẩu: ' + (err.response?.data?.message || err.message));
    }
  };

  // Nạp tiền ví ảo
  const handleDepositWallet = (amount) => {
    const newBal = walletBalance + amount;
    setWalletBalance(newBal);
    localStorage.setItem(`customer_wallet_${customer?.taiKhoan}`, String(newBal));

    const newTx = {
      id: Date.now(),
      type: 'DEPOSIT',
      title: `Nạp tiền ví ảo qua cổng thanh toán liên kết`,
      amount: amount,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      status: 'Thành công'
    };

    const updatedHistory = [newTx, ...walletHistory];
    setWalletHistory(updatedHistory);
    localStorage.setItem(`customer_wallet_history_${customer?.taiKhoan}`, JSON.stringify(updatedHistory));
    showToast(`✅ Đã nạp thành công +${Number(amount).toLocaleString('vi-VN')} đ vào ví CTUT Pay!`);
  };

  // Gửi tin nhắn chat tới Shop
  const handleSendChatMessage = (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || !selectedChatStore) return;

    const currentStoreId = selectedChatStore.id;
    const storeMsgs = chatMessages[currentStoreId] || [];

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      senderName: customer?.hoTen || customer?.taiKhoan || 'Bạn',
      text: text.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = {
      ...chatMessages,
      [currentStoreId]: [...storeMsgs, userMsg]
    };

    setChatMessages(updated);
    if (!textToSend) setInputMessage('');
    localStorage.setItem(`customer_chat_history_${customer.taiKhoan}`, JSON.stringify(updated));

    // Shop tự động trả lời
    setIsStoreTyping(true);
    setTimeout(() => {
      let reply = `Dạ ${selectedChatStore.name} xin chào bạn! Cảm ơn bạn đã nhắn tin. Chúng mình đã nhận câu hỏi: "${text.trim()}". Sản phẩm hiện đang có sẵn trong kho, bạn có thể bấm đặt hàng ngay để được giao hỏa tốc 2H nhé!`;
      
      const q = text.toLowerCase();
      if (q.includes('còn hàng')) {
        reply = `Dạ sản phẩm này bên kho của ${selectedChatStore.name} còn hàng sẵn bạn nha! Hàng mới 100% nguyên seal chuẩn Master Catalog ạ.`;
      } else if (q.includes('bảo hành')) {
        reply = `Dạ chính sách của shop là 1 ĐỔI 1 trực tiếp tại Kho Tổng trong 30 ngày đầu tiên nếu phát sinh lỗi phần cứng, và bảo hành hãng từ 12 đến 36 tháng bạn nhé!`;
      } else if (q.includes('voucher') || q.includes('giảm giá')) {
        reply = `Dạ shop gửi bạn mã ưu đãi [SHOP${currentStoreId || '10'}OFF] giảm ngay 10% tại shop nha! Bạn có thể lưu mã ngay tại mục Kho Voucher của shop ạ.`;
      }

      const storeReplyMsg = {
        id: Date.now() + 1,
        sender: 'store',
        senderName: selectedChatStore.name,
        text: reply,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };

      const finalUpdated = {
        ...updated,
        [currentStoreId]: [...updated[currentStoreId], storeReplyMsg]
      };
      setChatMessages(finalUpdated);
      setIsStoreTyping(false);
      localStorage.setItem(`customer_chat_history_${customer.taiKhoan}`, JSON.stringify(finalUpdated));
    }, 1000);
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'ALL') return true;
    return o.trangThai === orderFilter;
  });

  return (
    <div className="customer-profile-page">
      {/* Toast thông báo */}
      {toastMsg && (
        <div className="profile-toast">
          <FiCheckCircle size={18} /> {toastMsg}
        </div>
      )}

      <div className="container profile-container">
        {/* Sidebar Menu Cá Nhân Kiểu Shopee */}
        <aside className="profile-sidebar">
          <div className="profile-user-summary">
            <div className="profile-avatar-box">
              <span className="avatar-letter">
                {(customer?.hoTen || customer?.taiKhoan || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="profile-user-meta">
              <h4>{customer?.hoTen || customer?.taiKhoan}</h4>
              <span className="user-vip-pill">✨ KHÁCH HÀNG THÀNH VIÊN</span>
              <small className="user-login-id">@{customer?.taiKhoan}</small>
            </div>
          </div>

          <div className="profile-balance-glance">
            <span className="bal-label">Số dư Ví CTUT Pay:</span>
            <strong className="bal-num">{Number(walletBalance).toLocaleString('vi-VN')} đ</strong>
          </div>

          <nav className="profile-nav-tabs">
            <button 
              className={`p-nav-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <FiUser /> Hồ Sơ Cá Nhân & Đổi Thông Tin
            </button>
            <button 
              className={`p-nav-btn ${activeTab === 'wallet' ? 'active' : ''}`}
              onClick={() => setActiveTab('wallet')}
            >
              <FiCreditCard /> Ví Ảo CTUT Pay & Nạp Tiền
            </button>
            <button 
              className={`p-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <FiPackage /> Đơn Mua Của Tôi ({orders.length})
            </button>
            <button 
              className={`p-nav-btn ${activeTab === 'vouchers' ? 'active' : ''}`}
              onClick={() => setActiveTab('vouchers')}
            >
              <FiTag /> Kho Voucher & Ưu Đãi Đã Lưu
            </button>
            <button 
              className={`p-nav-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <FiMessageSquare /> Trò Chuyện Với Cửa Hàng (Shopee Chat)
            </button>
            <button 
              className={`p-nav-btn ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedback')}
            >
              <FiShield /> Khiếu Nại & Báo Lỗi ({supportTickets.length})
            </button>
          </nav>
        </aside>

        {/* Khung Nội Dung Chính Của Tab */}
        <main className="profile-main-content">
          {/* TAB 1: THÔNG TIN CÁ NHÂN & ĐỔI MẬT KHẨU */}
          {activeTab === 'info' && (
            <div className="tab-pane info-pane">
              <div className="pane-header">
                <h3>Hồ Sơ Của Tôi</h3>
                <p>Quản lý thông tin hồ sơ để bảo mật tài khoản và giao hàng chuẩn xác</p>
              </div>

              <form onSubmit={handleSaveProfile} className="profile-edit-form">
                <div className="form-group-row">
                  <label>Tên đăng nhập</label>
                  <input type="text" value={customer?.taiKhoan || ''} disabled className="input-readonly" />
                </div>

                <div className="form-group-row">
                  <label>Họ và tên *</label>
                  <input 
                    type="text" 
                    required 
                    value={profileForm.hoTen} 
                    onChange={(e) => setProfileForm({ ...profileForm, hoTen: e.target.value })} 
                  />
                </div>

                <div className="form-group-row">
                  <label>Địa chỉ Email *</label>
                  <input 
                    type="email" 
                    required 
                    value={profileForm.email} 
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} 
                  />
                </div>

                <div className="form-group-row">
                  <label>Số điện thoại nhận hàng *</label>
                  <input 
                    type="tel" 
                    required 
                    value={profileForm.soDienThoai} 
                    onChange={(e) => setProfileForm({ ...profileForm, soDienThoai: e.target.value })} 
                  />
                </div>

                <div className="form-group-row">
                  <label>Địa chỉ giao hàng mặc định *</label>
                  <textarea 
                    rows={2} 
                    required 
                    value={profileForm.diaChi} 
                    onChange={(e) => setProfileForm({ ...profileForm, diaChi: e.target.value })} 
                  />
                </div>

                <div className="form-group-row">
                  <label>Giới tính</label>
                  <div className="gender-radios">
                    {['Nam', 'Nữ', 'Khác'].map((g) => (
                      <label key={g} className="radio-label">
                        <input 
                          type="radio" 
                          name="gender" 
                          value={g} 
                          checked={profileForm.gioiTinh === g} 
                          onChange={(e) => setProfileForm({ ...profileForm, gioiTinh: e.target.value })} 
                        /> {g}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-actions-right">
                  <button type="submit" className="btn-save-profile" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? 'Đang lưu...' : 'LƯU THAY ĐỔI THÔNG TIN'}
                  </button>
                </div>
              </form>

              {/* Đổi mật khẩu */}
              <div className="password-change-box">
                <h4><FiLock /> Đổi Mật Khẩu Đăng Nhập</h4>
                <form onSubmit={handleChangePassword} className="pass-form-grid">
                  <input 
                    type="password" 
                    required 
                    placeholder="Mật khẩu hiện tại" 
                    value={passwordForm.matKhauCu} 
                    onChange={(e) => setPasswordForm({ ...passwordForm, matKhauCu: e.target.value })} 
                  />
                  <input 
                    type="password" 
                    required 
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" 
                    value={passwordForm.matKhauMoi} 
                    onChange={(e) => setPasswordForm({ ...passwordForm, matKhauMoi: e.target.value })} 
                  />
                  <input 
                    type="password" 
                    required 
                    placeholder="Nhập lại mật khẩu mới" 
                    value={passwordForm.xacNhanMatKhau} 
                    onChange={(e) => setPasswordForm({ ...passwordForm, xacNhanMatKhau: e.target.value })} 
                  />
                  <button type="submit" className="btn-update-pass">Cập Nhật Mật Khẩu</button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: VÍ ẢO CTUT PAY & NẠP TIỀN */}
          {activeTab === 'wallet' && (
            <div className="tab-pane wallet-pane">
              <div className="pane-header">
                <h3>Ví Điện Tử Ảo CTUT Pay</h3>
                <p>Thanh toán siêu tốc 1 chạm không tiền mặt, hoàn tiền 2% trên mọi đơn mua</p>
              </div>

              <div className="wallet-card-hero">
                <div className="wallet-card-chip">
                  <span className="card-brand">CTUT GEAR VIRTUAL WALLET</span>
                  <FiDollarSign size={24} />
                </div>
                <div className="wallet-card-body">
                  <span className="wallet-label">SỐ DƯ KHẢ DỤNG</span>
                  <h2 className="wallet-amount">{Number(walletBalance).toLocaleString('vi-VN')} đ</h2>
                  <span className="wallet-holder">CHỦ THẺ: {customer?.hoTen?.toUpperCase() || customer?.taiKhoan?.toUpperCase()}</span>
                </div>
              </div>

              <div className="wallet-quick-deposit">
                <h4>Nạp Tiền Nhanh Vào Ví Ảo (Mô Phỏng Trực Tiếp):</h4>
                <div className="deposit-pills">
                  {[200000, 500000, 1000000, 2000000, 5000000].map((amt) => (
                    <button 
                      key={amt} 
                      className="btn-deposit-pill"
                      onClick={() => handleDepositWallet(amt)}
                    >
                      +{Number(amt).toLocaleString('vi-VN')} đ
                    </button>
                  ))}
                </div>
              </div>

              <div className="wallet-history-section">
                <h4>Lịch Sử Biến Động Số Dư:</h4>
                <div className="wallet-history-list">
                  {walletHistory.map((tx) => (
                    <div key={tx.id} className="history-tx-item">
                      <div className="tx-left">
                        <span className={`tx-icon ${tx.type}`}>
                          {tx.type === 'DEPOSIT' ? '+' : '-'}
                        </span>
                        <div>
                          <strong>{tx.title}</strong>
                          <small>{tx.time}</small>
                        </div>
                      </div>
                      <div className={`tx-amount ${tx.type}`}>
                        {tx.type === 'DEPOSIT' ? '+' : '-'}{Number(tx.amount).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ĐƠN MUA CỦA TÔI */}
          {activeTab === 'orders' && (
            <div className="tab-pane orders-pane">
              <div className="pane-header">
                <h3>Đơn Mua Của Tôi</h3>
                <p>Theo dõi quá trình đóng gói từ kho riêng của từng shop và hành trình bưu tá giao nhận</p>
              </div>

              <div className="orders-filter-bar">
                {[
                  { key: 'ALL', label: 'Tất Cả' },
                  { key: 'PENDING', label: 'Chờ Xác Nhận' },
                  { key: 'CONFIRMED', label: 'Đã Tiếp Nhận' },
                  { key: 'DELIVERING', label: 'Đang Vận Chuyển' },
                  { key: 'COMPLETED', label: 'Đã Giao Thành Công' },
                  { key: 'CANCELLED', label: 'Đã Hủy' }
                ].map((tab) => (
                  <button 
                    key={tab.key}
                    className={`order-tab-btn ${orderFilter === tab.key ? 'active' : ''}`}
                    onClick={() => setOrderFilter(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {loadingOrders ? (
                <div className="pane-loading"><div className="spinner"></div> Đang tải đơn hàng...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="pane-empty-state">
                  <FiPackage size={48} color="#cbd5e1" />
                  <p>Chưa có đơn hàng nào trong mục này.</p>
                  <Link to="/" className="btn-go-shopping">Khám Phá Sản Phẩm Ngay →</Link>
                </div>
              ) : (
                <div className="profile-orders-list">
                  {filteredOrders.map((ord) => (
                    <div key={ord.id} className="profile-order-card">
                      <div className="order-card-top">
                        <span className="order-shop-tag">🏪 {ord.tenShop || `Kho Shop #${ord.khoHangId}`}</span>
                        <span className={`order-status-badge ${ord.trangThai}`}>{ord.trangThai}</span>
                      </div>
                      <div className="order-items-snippet">
                        <div className="order-code-text">Mã Đơn: <strong>#{ord.maDonHang || `ORD-${ord.id}`}</strong></div>
                        <div className="order-date-text"><FiClock size={12} /> {ord.ngayTao || 'Vừa xong'}</div>
                        <div className="order-money-text">
                          Tổng thanh toán: <strong>{Number(ord.tongTienThanhToan || ord.tongTien || 0).toLocaleString('vi-VN')} đ</strong>
                        </div>
                      </div>
                      <div className="order-actions-bottom">
                        <Link to="/my-orders" className="btn-detail-link">Xem Chi Tiết Vận Chuyển →</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KHO VOUCHER & ƯU ĐÃI ĐÃ LƯU */}
          {activeTab === 'vouchers' && (
            <div className="tab-pane vouchers-pane">
              <div className="pane-header">
                <div className="profile-v-header-row">
                  <div>
                    <h3>Kho Voucher & Mã Giảm Giá Đã Lưu ({savedVouchers.length})</h3>
                    <p>Các mã ưu đãi độc quyền từ Gian Hàng và Toàn Sàn đã được lưu vào ví của bạn</p>
                  </div>
                  <Link to="/vouchers" className="btn-collect-more-v">
                    + Thu Thập Thêm Mã
                  </Link>
                </div>
              </div>

              {savedVouchers.length === 0 ? (
                <div className="empty-profile-vouchers">
                  <FiTag size={48} className="empty-v-icon" />
                  <h4>Ví voucher của bạn đang trống</h4>
                  <p>Hãy dạo quanh các gian hàng và kho voucher toàn sàn để thu thập những ưu đãi giảm giá tốt nhất!</p>
                  <Link to="/vouchers" className="btn-explore-vouchers">Khám Phá Kho Voucher</Link>
                </div>
              ) : (
                <div className="saved-vouchers-grid">
                  {savedVouchers.map((v) => (
                    <div key={v.id || v.maVoucher} className="saved-voucher-box">
                      <div className="v-box-left">
                        <span className="v-box-pct">GIẢM {v.phanTramGiam}%</span>
                        <small>Tối đa {Number(v.giamToiDa || 50000).toLocaleString('vi-VN')} đ</small>
                      </div>
                      <div className="v-box-right">
                        <div className="v-box-header">
                          <span className="v-box-code">{v.maVoucher}</span>
                          <button 
                            type="button"
                            className="btn-trash-v"
                            onClick={() => handleRemoveSavedVoucher(v.maVoucher)}
                            title="Xóa voucher này"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                        <p className="v-box-desc">{v.moTa || `Đơn tối thiểu ${Number(v.donHangToiThieu || 150000).toLocaleString('vi-VN')} đ`}</p>
                        <span className="v-box-store">
                          {v.cuaHangId ? (
                            <>🏪 {v.storeName || `Gian hàng #${v.cuaHangId}`}</>
                          ) : (
                            <>🌐 Áp dụng toàn sàn</>
                          )}
                        </span>
                        <div className="v-box-actions-row">
                          <button 
                            type="button"
                            className="btn-copy-v-pill"
                            onClick={() => handleCopyVoucher(v.maVoucher)}
                          >
                            <FiCopy size={12} /> Sao Chép
                          </button>
                          <Link 
                            to="/cart" 
                            state={{ autoApplyCode: v.maVoucher, targetShopId: v.cuaHangId }}
                            className="btn-use-now"
                          >
                            Dùng Ngay →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TRÒ CHUYỆN VỚI CỬA HÀNG (SHOPEE-LIKE MULTI-STORE CHAT) */}
          {activeTab === 'chat' && (
            <div className="tab-pane chat-pane">
              <div className="pane-header">
                <h3>Trò Chuyện Trực Tuyến Với Cửa Hàng</h3>
                <p>Trao đổi trực tiếp với từng Gian hàng đối tác về tồn kho, bảo hành và chính sách giao nhận</p>
              </div>

              <div className="shopee-chat-window">
                {/* Cột Trái: Danh Sách Cửa Hàng Chat */}
                <div className="chat-store-list">
                  <div className="store-list-header">
                    <span>Đoạn Hội Thoại ({chatStores.length})</span>
                  </div>
                  <div className="store-items-scroll">
                    {chatStores.map((store) => (
                      <div 
                        key={store.id} 
                        className={`chat-store-item ${selectedChatStore?.id === store.id ? 'active' : ''}`}
                        onClick={() => setSelectedChatStore(store)}
                      >
                        <div className="store-chat-avatar">
                          <img src={store.avatar} alt={store.name} />
                          <span className="active-dot"></span>
                        </div>
                        <div className="store-chat-meta">
                          <strong>{store.name}</strong>
                          <small>{store.status}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cột Phải: Khung Hội Thoại Đang Chọn */}
                <div className="chat-conversation-pane">
                  {selectedChatStore ? (
                    <>
                      <div className="convo-header">
                        <div className="convo-store-info">
                          <img src={selectedChatStore.avatar} alt={selectedChatStore.name} />
                          <div>
                            <h4>{selectedChatStore.name}</h4>
                            <span>{selectedChatStore.status}</span>
                          </div>
                        </div>
                        {selectedChatStore.id > 0 && (
                          <Link to={`/stores/${selectedChatStore.id}`} className="btn-view-shop-convo">
                            Xem Shop →
                          </Link>
                        )}
                      </div>

                      <div className="convo-messages-body">
                        {(chatMessages[selectedChatStore.id] || []).map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`convo-msg-row ${msg.sender === 'user' ? 'outgoing' : 'incoming'}`}
                          >
                            <div className="convo-msg-bubble">
                              <span className="msg-sender-name">{msg.senderName}</span>
                              <p>{msg.text}</p>
                              <span className="msg-time">{msg.time}</span>
                            </div>
                          </div>
                        ))}

                        {isStoreTyping && (
                          <div className="convo-msg-row incoming">
                            <div className="convo-typing-bubble">
                              <span></span><span></span><span></span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Gợi ý câu hỏi nhanh 1 chạm */}
                      <div className="quick-chat-prompts-bar">
                        {QUICK_CHAT_PROMPTS.map((prompt, idx) => (
                          <button 
                            key={idx} 
                            className="btn-quick-prompt"
                            onClick={() => handleSendChatMessage(prompt)}
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>

                      {/* Thanh nhập tin nhắn */}
                      <div className="convo-input-row">
                        <input 
                          type="text" 
                          placeholder={`Nhập tin nhắn gửi tới ${selectedChatStore.name}...`}
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        />
                        <button 
                          className="btn-send-convo"
                          onClick={() => handleSendChatMessage()}
                          disabled={!inputMessage.trim()}
                        >
                          <FiSend size={16} /> Gửi
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="no-convo-selected">
                      <p>Vui lòng chọn một cửa hàng ở danh sách bên trái để bắt đầu trò chuyện.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ĐÁNH GIÁ & KHIẾU NẠI BÁO LỖI (PHẢN HỒI) */}
          {activeTab === 'feedback' && (
            <div className="tab-pane feedback-pane">
              <div className="pane-header">
                <h3>Phản Hồi & Khiếu Nại Báo Lỗi</h3>
                <p>Theo dõi các yêu cầu hỗ trợ kỹ thuật và phiếu khiếu nại đã gửi tới Ban Quản Trị</p>
              </div>

              <div className="tickets-summary-section">
                <h4>Phiếu Tiếp Nhận Đã Tạo ({supportTickets.length}):</h4>
                {supportTickets.length === 0 ? (
                  <div className="pane-empty-state">
                    <FiShield size={48} color="#cbd5e1" />
                    <p>Hiện bạn chưa có khiếu nại hay báo lỗi nào đang xử lý.</p>
                  </div>
                ) : (
                  <div className="tickets-grid">
                    {supportTickets.map((tk) => (
                      <div key={tk.ticketId} className="ticket-item-card">
                        <div className="tk-header">
                          <span className="tk-id">#{tk.ticketId}</span>
                          <span className="tk-status-pill">{tk.status}</span>
                        </div>
                        <div className="tk-cat"><strong>Vấn đề:</strong> {tk.category}</div>
                        <div className="tk-desc">{tk.description}</div>
                        <div className="tk-meta">
                          <span>Mã Đơn: {tk.orderId || 'N/A'}</span>
                          <span><FiClock size={11} /> {tk.createdAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CustomerProfile;
