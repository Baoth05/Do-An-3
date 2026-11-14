// src/pages/CustomerProfile.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { marketplaceService } from '../services/marketplaceService';
import {
  FiUser, FiCreditCard, FiPackage, FiTag, FiMessageSquare,
  FiShield, FiEdit3, FiLock, FiCheckCircle, FiClock, FiPlusCircle,
  FiSend, FiShoppingBag, FiTruck, FiAlertCircle, FiArrowRight, FiCopy, FiDollarSign, FiTrash2,
  FiBox, FiFileText, FiSettings, FiPhone, FiMapPin, FiMail, FiPlus, FiCheck, FiX, FiLogOut
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

  // Quản lý Sổ Địa Chỉ & Lịch Sử Địa Chỉ Đã Giao Hàng
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem(`customer_addresses_${customer?.taiKhoan}`);
      if (saved) return JSON.parse(saved);
      if (customer?.diaChi && customer.diaChi.trim()) {
        const initial = [
          {
            id: 'addr-default',
            hoTen: customer.hoTen || customer.taiKhoan,
            soDienThoai: customer.soDienThoai || '',
            diaChi: customer.diaChi.trim(),
            isDefault: true,
            ngayTao: 'Địa chỉ ban đầu'
          }
        ];
        localStorage.setItem(`customer_addresses_${customer?.taiKhoan}`, JSON.stringify(initial));
        return initial;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [showAddAddrModal, setShowAddAddrModal] = useState(false);
  const [newAddrForm, setNewAddrForm] = useState({
    hoTen: customer?.hoTen || '',
    soDienThoai: customer?.soDienThoai || '',
    diaChi: '',
    isDefault: false
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

  // 7. Quản lý Gian Hàng / Đăng ký mở bán (Unified Seller & Customer Account)
  const [myStore, setMyStore] = useState(() => {
    try {
      const saved = localStorage.getItem(`seller_store_${customer?.taiKhoan}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.quanLyId === customer?.id || parsed.taiKhoan === customer?.taiKhoan) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [storeForm, setStoreForm] = useState({
    tenKho: '',
    maKho: '',
    diaChi: customer?.diaChi || '',
    soDienThoai: customer?.soDienThoai || '',
    email: customer?.email || '',
    sucChuaToiDa: 1000,
    anhDaiDienShop: '',
    moTaGianHang: '',
  });
  const [isRegisteringStore, setIsRegisteringStore] = useState(false);
  const [agreedStoreTerms, setAgreedStoreTerms] = useState(false);

  useEffect(() => {
    if (customer) {
      setStoreForm((prev) => ({
        ...prev,
        diaChi: prev.diaChi || customer.diaChi || '',
        soDienThoai: prev.soDienThoai || customer.soDienThoai || '',
        email: prev.email || customer.email || (customer.taiKhoan ? `${customer.taiKhoan}@seller.ctutgear.vn` : ''),
      }));
    }
  }, [customer]);

  useEffect(() => {
    const checkStore = async () => {
      if (!customer?.id) return;
      try {
        const storeRes = await marketplaceService.getStoreByManager(customer.id);
        if (storeRes && storeRes.id) {
          setMyStore(storeRes);
          localStorage.setItem(`seller_store_${customer.taiKhoan}`, JSON.stringify(storeRes));
          localStorage.setItem('seller_selected_store_id', String(storeRes.id));
        } else {
          const saved = localStorage.getItem(`seller_store_${customer.taiKhoan}`);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && (parsed.quanLyId === customer.id || parsed.taiKhoan === customer.taiKhoan)) {
                setMyStore(parsed);
                return;
              }
            } catch { }
          }
          setMyStore(null);
        }
      } catch (e) {
        console.warn(e);
      }
    };
    checkStore();
  }, [customer]);

  const handleStoreNameChange = (e) => {
    const val = e.target.value;
    const clean = val
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
    const suggested = clean ? `STORE-${clean.substring(0, 10)}` : '';
    setStoreForm((prev) => ({
      ...prev,
      tenKho: val,
      maKho: suggested,
    }));
  };

  const handleRegisterStore = async (e) => {
    e.preventDefault();
    if (!storeForm.tenKho.trim()) {
      alert('Vui lòng nhập tên gian hàng của bạn!');
      return;
    }
    if (!agreedStoreTerms) {
      alert('Vui lòng chấp thuận Quy chế bán hàng và cam kết ký hợp đồng cung ứng số!');
      return;
    }

    setIsRegisteringStore(true);
    try {
      const cleanMaKho = storeForm.maKho.trim().toUpperCase() || `STORE-${Date.now().toString().slice(-6)}`;
      const result = await authService.upgradeCustomerToSeller({
        ...storeForm,
        maKho: cleanMaKho,
        tenKho: storeForm.tenKho.trim(),
        diaChi: storeForm.diaChi.trim() || customer.diaChi || '',
        soDienThoai: storeForm.soDienThoai.trim() || customer.soDienThoai || '',
        email: storeForm.email.trim() || customer.email || (customer.taiKhoan ? `${customer.taiKhoan}@seller.ctutgear.vn` : ''),
        sucChuaToiDa: Number(storeForm.sucChuaToiDa) || 1000,
        anhDaiDienShop: storeForm.anhDaiDienShop.trim() || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop',
        moTaGianHang: storeForm.moTaGianHang.trim() || `Gian hàng chính thức của ${storeForm.tenKho} trên Sàn CTUT Gear.`,
      });

      setMyStore(result.store);
      setCustomer(result.customer);
      showToast('🎉 Chúc mừng bạn đã chính thức mở gian hàng & trở thành Người Bán Hàng!');
    } catch (err) {
      alert('Lỗi đăng ký mở gian hàng: ' + (err.response?.data || err.message));
    } finally {
      setIsRegisteringStore(false);
    }
  };

  // Check auth & synchronize data according to active logged-in customer
  useEffect(() => {
    const handleSyncUser = () => {
      const cur = authService.getCurrentCustomer();
      if (!cur) {
        navigate('/login', { state: { from: location } });
        return;
      }
      setCustomer(cur);
      setProfileForm({
        hoTen: cur.hoTen || '',
        email: cur.email || '',
        soDienThoai: cur.soDienThoai || '',
        diaChi: cur.diaChi || '',
        gioiTinh: 'Nam',
        ngaySinh: '2000-01-01'
      });

      const savedWallet = localStorage.getItem(`customer_wallet_${cur.taiKhoan}`);
      setWalletBalance(savedWallet !== null ? Number(savedWallet) : 5000000);

      try {
        const storeSaved = localStorage.getItem(`seller_store_${cur.taiKhoan}`);
        if (storeSaved) {
          const parsed = JSON.parse(storeSaved);
          if (parsed && (parsed.quanLyId === cur.id || parsed.taiKhoan === cur.taiKhoan)) {
            setMyStore(parsed);
          } else {
            setMyStore(null);
          }
        } else {
          setMyStore(null);
        }
      } catch {
        setMyStore(null);
      }

      try {
        const addrSaved = localStorage.getItem(`customer_addresses_${cur.taiKhoan}`);
        if (addrSaved) {
          setSavedAddresses(JSON.parse(addrSaved));
        } else if (cur.diaChi && cur.diaChi.trim()) {
          const initial = [{
            id: 'addr-default',
            hoTen: cur.hoTen || cur.taiKhoan,
            soDienThoai: cur.soDienThoai || '',
            diaChi: cur.diaChi.trim(),
            isDefault: true,
            ngayTao: 'Địa chỉ ban đầu'
          }];
          localStorage.setItem(`customer_addresses_${cur.taiKhoan}`, JSON.stringify(initial));
          setSavedAddresses(initial);
        } else {
          setSavedAddresses([]);
        }
      } catch {
        setSavedAddresses([]);
      }
    };

    handleSyncUser();

    window.addEventListener('customer-user-updated', handleSyncUser);
    window.addEventListener('storage', handleSyncUser);
    return () => {
      window.removeEventListener('customer-user-updated', handleSyncUser);
      window.removeEventListener('storage', handleSyncUser);
    };
  }, [location.pathname]);

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

  // Tự động đồng bộ các địa chỉ từ lịch sử đơn hàng cũ vào sổ địa chỉ
  useEffect(() => {
    if (!customer?.id) return;
    const syncPastOrderAddresses = async () => {
      try {
        const pastOrders = await marketplaceService.getUserOrders(customer.id);
        if (Array.isArray(pastOrders) && pastOrders.length > 0) {
          setSavedAddresses((prev) => {
            const currentList = [...prev];
            let changed = false;
            pastOrders.forEach((o) => {
              if (o.diaChiGiaoHang && o.diaChiGiaoHang.trim()) {
                const addrText = o.diaChiGiaoHang.trim();
                const exists = currentList.some((a) => a.diaChi.trim().toLowerCase() === addrText.toLowerCase());
                if (!exists) {
                  currentList.push({
                    id: 'addr-order-' + (o.id || o.maDonHang || Math.random().toString(36).substring(2, 8)),
                    hoTen: o.hoTen || o.nguoiNhan || customer.hoTen,
                    soDienThoai: o.soDienThoai || customer.soDienThoai,
                    diaChi: addrText,
                    isDefault: currentList.length === 0,
                    ngayTao: o.ngayTao ? new Date(o.ngayTao).toLocaleDateString('vi-VN') : 'Đã giao trước đó',
                  });
                  changed = true;
                }
              }
            });
            if (changed) {
              localStorage.setItem(`customer_addresses_${customer.taiKhoan}`, JSON.stringify(currentList));
              return currentList;
            }
            return prev;
          });
        }
      } catch (e) {
        console.warn('Lỗi đồng bộ địa chỉ cũ:', e);
      }
    };
    syncPastOrderAddresses();
  }, [customer]);

  // Chọn địa chỉ cũ đã giao làm địa chỉ áp dụng
  const handleSelectSavedAddress = (addr) => {
    setProfileForm((prev) => ({
      ...prev,
      diaChi: addr.diaChi,
      hoTen: addr.hoTen || prev.hoTen,
      soDienThoai: addr.soDienThoai || prev.soDienThoai
    }));
    showToast(`📍 Đã chọn địa chỉ: ${addr.diaChi}`);
  };

  // Xóa địa chỉ khỏi sổ
  const handleDeleteSavedAddress = (addrId) => {
    const updated = savedAddresses.filter((a) => a.id !== addrId);
    setSavedAddresses(updated);
    localStorage.setItem(`customer_addresses_${customer?.taiKhoan}`, JSON.stringify(updated));
    showToast('🗑️ Đã xóa địa chỉ khỏi danh bạ!');
  };

  // Thêm địa chỉ mới từ Modal
  const handleAddNewAddressSubmit = (e) => {
    e.preventDefault();
    if (!newAddrForm.diaChi.trim()) {
      alert('Vui lòng nhập địa chỉ chi tiết!');
      return;
    }
    const newAddr = {
      id: 'addr-' + Date.now(),
      hoTen: newAddrForm.hoTen.trim() || profileForm.hoTen || customer?.hoTen,
      soDienThoai: newAddrForm.soDienThoai.trim() || profileForm.soDienThoai || customer?.soDienThoai,
      diaChi: newAddrForm.diaChi.trim(),
      isDefault: Boolean(newAddrForm.isDefault || savedAddresses.length === 0),
      ngayTao: new Date().toLocaleDateString('vi-VN')
    };

    let updatedList = [];
    if (newAddr.isDefault) {
      updatedList = [newAddr, ...savedAddresses.map(a => ({ ...a, isDefault: false }))];
    } else {
      updatedList = [newAddr, ...savedAddresses];
    }

    setSavedAddresses(updatedList);
    localStorage.setItem(`customer_addresses_${customer?.taiKhoan}`, JSON.stringify(updatedList));
    setProfileForm((prev) => ({
      ...prev,
      diaChi: newAddr.diaChi,
      hoTen: newAddr.hoTen || prev.hoTen,
      soDienThoai: newAddr.soDienThoai || prev.soDienThoai
    }));
    setShowAddAddrModal(false);
    setNewAddrForm({
      hoTen: customer?.hoTen || '',
      soDienThoai: customer?.soDienThoai || '',
      diaChi: '',
      isDefault: false
    });
    showToast('🎉 Đã thêm địa chỉ nhận hàng mới!');
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

      // Lưu vào danh bạ địa chỉ nếu có nhập địa chỉ
      if (profileForm.diaChi.trim()) {
        const addrText = profileForm.diaChi.trim();
        const exists = savedAddresses.some(a => a.diaChi.trim().toLowerCase() === addrText.toLowerCase());
        if (!exists) {
          const newAddr = {
            id: 'addr-' + Date.now(),
            hoTen: profileForm.hoTen.trim(),
            soDienThoai: profileForm.soDienThoai.trim(),
            diaChi: addrText,
            isDefault: savedAddresses.length === 0,
            ngayTao: new Date().toLocaleDateString('vi-VN'),
          };
          const updatedList = [newAddr, ...savedAddresses];
          setSavedAddresses(updatedList);
          localStorage.setItem(`customer_addresses_${customer.taiKhoan}`, JSON.stringify(updatedList));
        }
      }

      window.dispatchEvent(new Event('customer-user-updated'));
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
              <span className={myStore ? "user-vip-pill seller-pill" : "user-vip-pill"}>
                {myStore ? '🏪 NGƯỜI BÁN & MUA SẮM' : '✨ KHÁCH HÀNG THÀNH VIÊN'}
              </span>
              <small className="user-login-id">@{customer?.taiKhoan}</small>
            </div>
          </div>

          <div className="profile-balance-glance">
            <span className="bal-label">Số dư Ví CTUT Pay:</span>
            <strong className="bal-num">{Number(walletBalance).toLocaleString('vi-VN')} đ</strong>
          </div>

          <nav className="profile-nav-tabs">
            {/* Lối Tắt Đăng Ký / Quản Lý Bán Hàng */}
            <button
              className={`p-nav-btn seller-upgrade-tab ${activeTab === 'seller' ? 'active' : ''}`}
              onClick={() => setActiveTab('seller')}
            >
              <FiShoppingBag /> {myStore ? '🏬 Gian Hàng Của Tôi' : '🚀 Mở Gian Hàng Bán Hàng'}
            </button>
            <div className="profile-seller-divider"></div>

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

            <div style={{ margin: '14px 0', borderTop: '1px solid #f1f5f9' }}></div>

            <button
              className="p-nav-btn logout-nav-btn"
              style={{ color: '#ef4444', fontWeight: '600' }}
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
                  authService.logoutCustomer();
                  navigate('/login');
                }
              }}
            >
              <FiLogOut /> Đăng Xuất Tài Khoản
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

                <div className="profile-address-box-wrapper">
                  <div className="address-box-header">
                    <div className="addr-header-text">
                      <label className="addr-title-label">
                        <FiMapPin className="pin-icon" /> Địa Chỉ Giao Hàng & Nhận Hàng
                      </label>
                      <span className="addr-desc-hint">
                        Bạn có thể chọn từ <strong>các địa chỉ cũ đã giao trước đó</strong> hoặc nhập địa chỉ mới lúc đặt hàng.
                      </span>
                    </div>
                    <button 
                      type="button" 
                      className="btn-add-new-addr"
                      onClick={() => setShowAddAddrModal(true)}
                    >
                      <FiPlus size={14} /> Thêm Địa Chỉ Mới
                    </button>
                  </div>

                  {/* Danh sách địa chỉ cũ đã giao trước đó */}
                  {savedAddresses && savedAddresses.length > 0 ? (
                    <div className="saved-address-list">
                      <div className="addr-list-caption">
                        <span>🕒 Chọn nhanh từ các địa chỉ đã giao trước đó:</span>
                      </div>
                      <div className="addr-cards-grid">
                        {savedAddresses.map((addr) => {
                          const isSelected = profileForm.diaChi.trim() === addr.diaChi.trim();
                          return (
                            <div 
                              key={addr.id} 
                              className={`addr-select-card ${isSelected ? 'active-selected' : ''}`}
                              onClick={() => handleSelectSavedAddress(addr)}
                            >
                              <div className="addr-card-top">
                                <div className="addr-card-user">
                                  <strong>{addr.hoTen || profileForm.hoTen}</strong>
                                  <span className="addr-card-tel">• {addr.soDienThoai || profileForm.soDienThoai}</span>
                                </div>
                                {isSelected && <span className="addr-status-badge selected">✓ Đang Chọn</span>}
                                {addr.isDefault && !isSelected && <span className="addr-status-badge default">Mặc Định</span>}
                              </div>
                              <p className="addr-card-detail">{addr.diaChi}</p>
                              <div className="addr-card-bottom">
                                <button 
                                  type="button" 
                                  className={`btn-choose-addr ${isSelected ? 'chosen' : ''}`}
                                  onClick={(e) => { e.stopPropagation(); handleSelectSavedAddress(addr); }}
                                >
                                  {isSelected ? '✓ Đang áp dụng' : 'Chọn địa chỉ này'}
                                </button>
                                <button 
                                  type="button" 
                                  className="btn-remove-addr"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteSavedAddress(addr.id); }}
                                  title="Xóa địa chỉ này"
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="no-saved-addr-notice">
                      <FiMapPin size={22} color="#94a3b8" />
                      <div>
                        <strong>Chưa có địa chỉ cũ nào được lưu</strong>
                        <p>Địa chỉ sẽ được tự động lưu lại khi bạn <strong>đặt hàng lúc mới tạo đơn</strong> hoặc bạn có thể nhập trực tiếp ở bên dưới.</p>
                      </div>
                    </div>
                  )}

                  {/* Ô địa chỉ đang áp dụng (nhập địa chỉ mới hoặc chỉnh sửa) */}
                  <div className="active-addr-input-container">
                    <label className="active-addr-label">Địa chỉ nhận hàng chi tiết:</label>
                    <textarea
                      rows={2}
                      placeholder="Nhập địa chỉ giao hàng của bạn (hoặc bạn có thể điền linh hoạt lúc mới tạo đơn hàng thanh toán)..."
                      value={profileForm.diaChi}
                      onChange={(e) => setProfileForm({ ...profileForm, diaChi: e.target.value })}
                    />
                    <small className="addr-sub-tip">
                      💡 Bạn có thể để trống và nhập trực tiếp khi tạo đơn hàng mới lúc thanh toán (Checkout).
                    </small>
                  </div>
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

          {/* TAB 7: ĐĂNG KÝ MỞ GIAN HÀNG / QUẢN LÝ GIAN HÀNG CỦA TÔI */}
          {activeTab === 'seller' && (
            <div className="tab-pane seller-pane">
              {myStore ? (
                /* GIAO DIỆN KHI ĐÃ CÓ GIAN HÀNG */
                <div className="my-store-active-view">
                  <div className="pane-header">
                    <div className="pane-header-title-row">
                      <div>
                        <h3>Gian Hàng Của Tôi</h3>
                        <p>Tài khoản của bạn đã được kích hoạt chức năng <strong>Người Bán Hàng</strong> và liên kết với Kho Riêng.</p>
                      </div>
                      <span className="badge-seller-active">
                        <FiCheckCircle /> ĐANG HOẠT ĐỘNG
                      </span>
                    </div>
                  </div>

                  {/* Thẻ thông tin tổng quan gian hàng */}
                  <div className="my-store-summary-card">
                    <div className="store-avatar-wrap">
                      <img
                        src={myStore.anhDaiDienShop || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200'}
                        alt={myStore.tenKho}
                      />
                    </div>
                    <div className="store-summary-details">
                      <div className="store-badges">
                        <span className="store-type-badge">🏬 KHO CỬA HÀNG RIÊNG</span>
                        <span className="store-code-badge">Mã Kho: {myStore.maKho}</span>
                        <span className="store-id-badge">ID: #{myStore.id}</span>
                      </div>
                      <h2 className="store-display-name">{myStore.tenKho}</h2>
                      <p className="store-intro">{myStore.moTaGianHang || 'Gian hàng phân phối chính hãng thuộc hệ sinh thái CTUT Gear.'}</p>

                      <div className="store-meta-grid">
                        <div className="meta-item">
                          <FiMapPin /> <span>Địa chỉ kho: <strong>{myStore.diaChi || 'Cần Thơ'}</strong></span>
                        </div>
                        <div className="meta-item">
                          <FiPhone /> <span>Hotline: <strong>{myStore.soDienThoai || 'Chưa cập nhật'}</strong></span>
                        </div>
                        <div className="meta-item">
                          <FiMail /> <span>Email: <strong>{myStore.email || `${customer?.taiKhoan}@seller.ctutgear.vn`}</strong></span>
                        </div>
                        <div className="meta-item">
                          <FiBox /> <span>Sức chứa kho: <strong>{myStore.sucChuaToiDa || 1000} kiện hàng</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banner Chuyển Hướng Nhanh Vào Kênh Người Bán */}
                  <div className="enter-seller-channel-banner">
                    <div className="banner-text">
                      <h4>🚀 Cổng Quản Trị Kênh Người Bán (Seller Portal)</h4>
                      <p>
                        Truy cập Dashboard chuyên biệt để ký hợp đồng nhập hàng từ Kho Tổng, đăng bán sản phẩm lên sàn,
                        xử lý các đơn đặt của khách hàng và phát hành voucher khuyến mãi shop.
                      </p>
                    </div>
                    <Link to="/seller" className="btn-enter-seller-portal">
                      <FiShoppingBag /> VÀO KÊNH NGƯỜI BÁN NGAY →
                    </Link>
                  </div>

                  {/* Lối tắt các chức năng người bán */}
                  <div className="seller-quick-actions-section">
                    <h4>Các Chức Năng Bán Hàng Nhanh:</h4>
                    <div className="seller-shortcuts-grid">
                      <Link to="/seller/contracts" className="seller-shortcut-card">
                        <div className="sc-icon icon-contract"><FiFileText /></div>
                        <div className="sc-info">
                          <strong>Ký Hợp Đồng Kho Tổng</strong>
                          <p>Ký số hợp đồng B2B để nhập hàng về kho riêng</p>
                        </div>
                      </Link>

                      <Link to="/seller/products" className="seller-shortcut-card">
                        <div className="sc-icon icon-product"><FiBox /></div>
                        <div className="sc-info">
                          <strong>Hàng Hóa & Đăng Bán</strong>
                          <p>Bật / Tắt mở bán và định giá niêm yết lên sàn</p>
                        </div>
                      </Link>

                      <Link to="/seller/orders" className="seller-shortcut-card">
                        <div className="sc-icon icon-order"><FiPackage /></div>
                        <div className="sc-info">
                          <strong>Đơn Hàng Cần Giao</strong>
                          <p>Tiếp nhận, đóng gói và điều phối bưu tá lấy hàng</p>
                        </div>
                      </Link>

                      <Link to="/seller/vouchers" className="seller-shortcut-card">
                        <div className="sc-icon icon-voucher"><FiTag /></div>
                        <div className="sc-info">
                          <strong>Voucher Khuyến Mãi</strong>
                          <p>Tạo mã giảm giá độc quyền cho gian hàng</p>
                        </div>
                      </Link>

                      <Link to="/seller/settings" className="seller-shortcut-card">
                        <div className="sc-icon icon-settings"><FiSettings /></div>
                        <div className="sc-info">
                          <strong>Hồ Sơ Gian Hàng</strong>
                          <p>Tùy chỉnh logo, mô tả và hotline hiển thị</p>
                        </div>
                      </Link>

                      <Link to={`/stores/${myStore.id}`} className="seller-shortcut-card">
                        <div className="sc-icon icon-viewshop"><FiShoppingBag /></div>
                        <div className="sc-info">
                          <strong>Xem Trang Shop Trên Sàn</strong>
                          <p>Xem giao diện gian hàng dưới góc nhìn người mua</p>
                        </div>
                      </Link>
                    </div>
                  </div>

                  <div className="dual-role-notice-card">
                    <span className="dual-icon">💡</span>
                    <div>
                      <strong>Cơ Chế Tài Khoản Kép (Single Account B2B2C):</strong>
                      <p>
                        Bạn không cần đăng xuất hay đổi tài khoản khác. Tài khoản <strong>@{customer?.taiKhoan}</strong>
                        của bạn có thể vừa thoải mái mua sắm các sản phẩm khác trên sàn, vừa quản lý kinh doanh gian hàng của chính mình!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* GIAO DIỆN FORM ĐĂNG KÝ MỞ GIAN HÀNG KHI CHƯA CÓ */
                <div className="store-onboarding-wrapper">
                  <div className="pane-header">
                    <h3>Đăng Ký Mở Gian Hàng Bán Hàng</h3>
                    <p>Kích hoạt tính năng kinh doanh trên Sàn CTUT Gear từ chính tài khoản khách hàng của bạn</p>
                  </div>

                  {/* Giới thiệu quy trình 3 bước */}
                  <div className="onboarding-steps-row">
                    <div className="step-card">
                      <div className="step-num">1</div>
                      <div className="step-text">
                        <strong>Tạo Kho Riêng Của Shop</strong>
                        <p>Hệ thống tự động cấp phát một Kho Cửa Hàng riêng biệt trên hệ sinh thái WMS.</p>
                      </div>
                    </div>
                    <div className="step-card">
                      <div className="step-num">2</div>
                      <div className="step-text">
                        <strong>Ký Hợp Đồng Cung Ứng Số</strong>
                        <p>Ký hợp đồng B2B với Kho Tổng Trung Tâm để nhập hàng chính hãng về kho shop.</p>
                      </div>
                    </div>
                    <div className="step-card">
                      <div className="step-num">3</div>
                      <div className="step-text">
                        <strong>Đăng Bán & Nhận Doanh Thu</strong>
                        <p>Chủ động định giá, mở bán sản phẩm trên Marketplace và nhận đơn hàng tự động.</p>
                      </div>
                    </div>
                  </div>

                  {/* Form Đăng Ký Gian Hàng */}
                  <form onSubmit={handleRegisterStore} className="store-register-form">
                    <div className="form-grid-2">
                      <div className="form-group-field">
                        <label>Tên Gian Hàng / Cửa Hàng Hiển Thị *</label>
                        <input
                          type="text"
                          required
                          placeholder="ví dụ: CTUT Gaming Gear Cần Thơ / Apple Store CTUT"
                          value={storeForm.tenKho}
                          onChange={handleStoreNameChange}
                        />
                        <small className="field-hint">Tên này sẽ hiển thị cho mọi khách mua sắm trên sàn.</small>
                      </div>

                      <div className="form-group-field">
                        <label>Mã Kho Hàng Của Shop (Hệ thống gợi ý) *</label>
                        <input
                          type="text"
                          required
                          placeholder="ví dụ: STORE-GEARCANTHO"
                          value={storeForm.maKho}
                          onChange={(e) => setStoreForm({ ...storeForm, maKho: e.target.value.toUpperCase() })}
                        />
                        <small className="field-hint">Mã định danh kho độc lập để liên kết với Kho Tổng WMS.</small>
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group-field">
                        <label>Địa Chỉ Kho Hàng / Cửa Hàng Của Bạn *</label>
                        <input
                          type="text"
                          required
                          placeholder="ví dụ: 256 Nguyễn Văn Cừ, P. An Hòa, TP. Cần Thơ"
                          value={storeForm.diaChi}
                          onChange={(e) => setStoreForm({ ...storeForm, diaChi: e.target.value })}
                        />
                      </div>

                      <div className="form-group-field">
                        <label>Số Điện Thoại Hotline / Zalo Tư Vấn *</label>
                        <input
                          type="tel"
                          required
                          placeholder="0901234567"
                          value={storeForm.soDienThoai}
                          onChange={(e) => setStoreForm({ ...storeForm, soDienThoai: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group-field">
                        <label>Email Liên Hệ Kinh Doanh</label>
                        <input
                          type="email"
                          placeholder={`${customer?.taiKhoan || 'shop'}@seller.ctutgear.vn`}
                          value={storeForm.email}
                          onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                        />
                      </div>

                      <div className="form-group-field">
                        <label>Sức Chứa Kho Hàng Tối Đa (Số lượng kiện hàng)</label>
                        <input
                          type="number"
                          min="100"
                          max="50000"
                          value={storeForm.sucChuaToiDa}
                          onChange={(e) => setStoreForm({ ...storeForm, sucChuaToiDa: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group-field">
                      <label>Đường Dẫn Ảnh Đại Diện / Logo Shop (URL)</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... (Để trống để dùng logo mặc định)"
                        value={storeForm.anhDaiDienShop}
                        onChange={(e) => setStoreForm({ ...storeForm, anhDaiDienShop: e.target.value })}
                      />
                    </div>

                    <div className="form-group-field">
                      <label>Mô Tả & Giới Thiệu Gian Hàng</label>
                      <textarea
                        rows="3"
                        placeholder="Giới thiệu về thế mạnh, chính sách bảo hành 1 đổi 1, cam kết hàng chính hãng..."
                        value={storeForm.moTaGianHang}
                        onChange={(e) => setStoreForm({ ...storeForm, moTaGianHang: e.target.value })}
                      />
                    </div>

                    <div className="store-terms-agreement">
                      <label className="checkbox-wrap">
                        <input
                          type="checkbox"
                          checked={agreedStoreTerms}
                          onChange={(e) => setAgreedStoreTerms(e.target.checked)}
                          required
                        />
                        <span>
                          Tôi cam kết tuân thủ <strong>Quy chế hoạt động Sàn TMĐT CTUT Gear</strong>,
                          chỉ bán hàng chính hãng nhập từ hệ thống Chuỗi Cung Ứng Kho Vận và bảo vệ quyền lợi người tiêu dùng.
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="btn-submit-register-store"
                      disabled={isRegisteringStore}
                    >
                      <FiShoppingBag /> {isRegisteringStore ? 'Đang Khởi Tạo Kho & Kích Hoạt...' : '🚀 KÍCH HOẠT MỞ GIAN HÀNG & BẮT ĐẦU BÁN HÀNG'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal Thêm Địa Chỉ Giao Hàng Mới */}
      {showAddAddrModal && (
        <div className="profile-modal-overlay" onClick={() => setShowAddAddrModal(false)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3><FiMapPin /> Thêm Địa Chỉ Giao Hàng Mới</h3>
              <button type="button" className="btn-close-modal" onClick={() => setShowAddAddrModal(false)}>
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleAddNewAddressSubmit} className="modal-form-body">
              <div className="modal-field">
                <label>Họ và tên người nhận</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trương Hoàng Bảo"
                  value={newAddrForm.hoTen}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, hoTen: e.target.value })}
                />
              </div>
              <div className="modal-field">
                <label>Số điện thoại nhận hàng</label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0971694448"
                  value={newAddrForm.soDienThoai}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, soDienThoai: e.target.value })}
                />
              </div>
              <div className="modal-field">
                <label>Địa chỉ nhận hàng chi tiết</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Số 256 Nguyễn Văn Cừ, Phường An Hòa, Quận Ninh Kiều, TP. Cần Thơ"
                  value={newAddrForm.diaChi}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, diaChi: e.target.value })}
                />
              </div>
              <label className="modal-checkbox-label">
                <input
                  type="checkbox"
                  checked={newAddrForm.isDefault}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, isDefault: e.target.checked })}
                />
                <span>Đặt làm địa chỉ nhận hàng mặc định</span>
              </label>
              <div className="modal-actions-row">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowAddAddrModal(false)}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="btn-modal-save">
                  Lưu Địa Chỉ Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;
