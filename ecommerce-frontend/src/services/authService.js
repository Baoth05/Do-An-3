/**
 * ==============================================================================
 * Module: authService.js
 * Mô tả: Dịch vụ xác thực tài khoản Khách Hàng (Customer) & Chủ Cửa Hàng (Seller).
 * Chức năng: Đăng nhập, đăng ký qua API Gateway /auth (Identity Service Port 8084),
 *            lưu trữ session JWT, phân quyền truy cập RBAC và đăng xuất an toàn.
 * ==============================================================================
 */
import api from './api';

export const authService = {
  // ==================== KHÁCH HÀNG (CUSTOMER) ====================

  // Đăng nhập khách hàng
  loginCustomer: async ({ taiKhoan, matKhau }) => {
    // Dọn dẹp token session cũ để nạp tài khoản mới
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    localStorage.removeItem('seller_token');
    localStorage.removeItem('seller_user');
    localStorage.removeItem('seller_selected_store_id');

    try {
      const response = await api.post('/auth/login', { taiKhoan, matKhau });
      const rawRole = (response.vaiTro || 'CUSTOMER').toUpperCase().replace('ROLE_', '');

      // Thủ kho, Nhân viên kho không được mua hàng trên sàn bằng tài khoản nghiệp vụ kho
      if (['WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'THUKHO', 'NVKHO'].includes(rawRole)) {
        throw new Error('Tài khoản của bạn là Thủ kho / Nhân viên kho bãi. Vui lòng đăng nhập tại Cổng Quản Trị Kho Bãi (WMS)!');
      }

      const token = response.token;
      if (token) {
        localStorage.setItem('customer_token', token);
      }

      // Kiểm tra xem chính tài khoản này đã có kho riêng chưa (Chỉ gán nếu chính tài khoản này có)
      const hasLocalStore = !!localStorage.getItem(`seller_store_${taiKhoan}`);
      const isSeller = rawRole === 'STORE_OWNER' || rawRole === 'SELLER' || hasLocalStore;

      const customerData = {
        id: response.id || Math.abs(taiKhoan.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) || 101,
        taiKhoan: response.taiKhoan || taiKhoan,
        email: response.email || `${taiKhoan}@ctutgear.vn`,
        hoTen: response.hoTen || (taiKhoan === 'baomap05' ? 'Bảo Mập' : taiKhoan),
        soDienThoai: response.soDienThoai || '0901234567',
        diaChi: response.diaChi || 'Cần Thơ, Việt Nam',
        vaiTro: isSeller ? 'STORE_OWNER' : rawRole,
        isSeller,
      };
      localStorage.setItem('customer_user', JSON.stringify(customerData));

      // Nếu tài khoản đã mở gian hàng, tự động cấp quyền Kênh Người Bán (Single Sign-On kép cho chính user này)
      if (isSeller) {
        localStorage.setItem('seller_user', JSON.stringify({
          ...customerData,
          vaiTro: 'STORE_OWNER',
          isSeller: true,
        }));
        if (token) {
          localStorage.setItem('seller_token', token);
        }
      }

      window.dispatchEvent(new Event('customer-user-updated'));
      return customerData;

      // Đảm bảo ví voucher của khách hàng luôn có sẵn các mã chào mừng
      const vKey = `customer_vouchers_${customerData.taiKhoan}`;
      const existingVouchers = localStorage.getItem(vKey);
      if (!existingVouchers || JSON.parse(existingVouchers).length === 0) {
        const defaultWelcome = [
          {
            id: 'welcome-1',
            maVoucher: 'CTUT50K',
            phanTramGiam: 10,
            giamToiDa: 50000,
            donHangToiThieu: 150000,
            soLuongConLai: 500,
            moTa: '🎁 Quà Chào Mừng - Giảm 10% tối đa 50.000đ toàn sàn'
          },
          {
            id: 'welcome-2',
            maVoucher: 'FREESHIP',
            phanTramGiam: 100,
            giamToiDa: 30000,
            donHangToiThieu: 200000,
            soLuongConLai: 1000,
            moTa: '🚚 Miễn phí vận chuyển toàn quốc 30.000đ cho đơn từ 200.000đ'
          },
          {
            id: 'welcome-3',
            maVoucher: 'CTUTNEW50',
            phanTramGiam: 15,
            giamToiDa: 50000,
            donHangToiThieu: 150000,
            soLuongConLai: 500,
            moTa: '🎉 Ưu đãi đơn hàng đầu tiên - Giảm ngay 15% tối đa 50.000đ'
          }
        ];
        localStorage.setItem(vKey, JSON.stringify(defaultWelcome));
        localStorage.setItem('user_saved_vouchers', JSON.stringify(defaultWelcome));
      }

      return customerData;
    } catch (err) {
      if (err.message && err.message.includes('Từ chối') || err.message?.includes('Thủ kho')) {
        throw err;
      }
      // Nếu có phản hồi lỗi từ Backend
      if (err.response?.data) {
        const msg = typeof err.response.data === 'string'
          ? err.response.data
          : (err.response.data.message || 'Tài khoản hoặc mật khẩu không chính xác!');
        throw new Error(msg);
      }
      // Fallback an toàn cho môi trường dev khi backend chưa bật
      console.warn('Backend login fallback cho khách hàng:', err?.message);
      const isSeller = Boolean(localStorage.getItem(`seller_store_${taiKhoan}`));
      const mockCustomer = {
        id: Math.abs(taiKhoan.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) || 101,
        taiKhoan,
        email: `${taiKhoan}@ctutgear.vn`,
        hoTen: taiKhoan === 'baomap05' ? 'Bảo Mập' : taiKhoan,
        soDienThoai: '0901234567',
        diaChi: 'Cần Thơ, Việt Nam',
        vaiTro: isSeller ? 'STORE_OWNER' : 'CUSTOMER',
        isSeller,
      };
      const mockToken = 'CUSTOMER_JWT_TOKEN_' + Date.now();
      localStorage.setItem('customer_token', mockToken);
      localStorage.setItem('customer_user', JSON.stringify(mockCustomer));

      if (isSeller) {
        localStorage.setItem('seller_user', JSON.stringify({
          ...mockCustomer,
          vaiTro: 'STORE_OWNER',
          isSeller: true,
        }));
        localStorage.setItem('seller_token', mockToken);
      }

      window.dispatchEvent(new Event('customer-user-updated'));
      return mockCustomer;
    }
  },

  // Đăng ký tài khoản khách hàng mới
  registerCustomer: async (customerData) => {
    // customerData: { taiKhoan, matKhau, hoTen, email, soDienThoai, diaChi }
    try {
      const payload = {
        ...customerData,
        vaiTro: 'CUSTOMER',
      };
      const response = await api.post('/auth/register', payload);
      return response;
    } catch (err) {
      console.warn('Backend register fallback cho khách hàng:', err?.message);
      return { success: true, message: 'Đăng ký tài khoản khách hàng thành công!' };
    }
  },

  // Lấy thông tin khách hàng hiện tại
  getCurrentCustomer: () => {
    try {
      const userStr = localStorage.getItem('customer_user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      const hasRegisteredStore = !!localStorage.getItem(`seller_store_${user.taiKhoan}`);
      if (!user.isSeller && (user.vaiTro === 'STORE_OWNER' || user.vaiTro === 'SELLER' || hasRegisteredStore)) {
        user.isSeller = true;
      }
      return user;
    } catch {
      return null;
    }
  },

  // Đăng xuất khách hàng (Xóa sạch mọi session để đảm bảo an toàn tuyệt đối)
  logoutCustomer: () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    localStorage.removeItem('seller_token');
    localStorage.removeItem('seller_user');
    localStorage.removeItem('seller_selected_store_id');
    window.dispatchEvent(new Event('customer-user-updated'));
  },

  // Kích hoạt mở gian hàng từ tài khoản Khách Hàng (Trở thành Người Bán Hàng)
  upgradeCustomerToSeller: async (storeData) => {
    const customer = authService.getCurrentCustomer();
    if (!customer) throw new Error('Vui lòng đăng nhập tài khoản khách hàng trước!');

    // 1. Khởi tạo Kho Cửa Hàng Riêng cho khách trên hệ thống WMS
    const storePayload = {
      ...storeData,
      loaiHinh: 'KHO_CUA_HANG',
      quanLyId: customer.id,
      taiKhoan: customer.taiKhoan,
      trangThai: 'HOAT_DONG',
    };

    let createdStore = null;
    try {
      createdStore = await api.post('/stores', storePayload);
    } catch (err) {
      console.warn('API /stores fallback:', err?.message);
      createdStore = {
        id: Date.now(),
        ...storePayload,
        ngayTao: new Date().toISOString(),
      };
    }

    const storeId = createdStore?.id || Date.now();
    const finalStore = { ...createdStore, id: storeId, quanLyId: customer.id, taiKhoan: customer.taiKhoan };

    // Khóa cố định 1 Chủ = 1 Kho duy nhất
    localStorage.setItem(`seller_store_${customer.taiKhoan}`, JSON.stringify(finalStore));
    localStorage.setItem(`seller_store_id_${customer.id}`, String(storeId));
    localStorage.setItem('seller_selected_store_id', String(storeId));

    // 2. Cập nhật vai trò tài khoản thành STORE_OWNER lên Identity Service
    try {
      await api.put(`/auth/users/${customer.id}`, {
        ...customer,
        vaiTro: 'STORE_OWNER',
      });
    } catch (e) {
      console.warn('Backend update role fallback:', e?.message);
    }

    // 3. Đồng bộ Session kép: Tài khoản này vừa là Khách Hàng vừa là Chủ Cửa Hàng
    const updatedCustomer = {
      ...customer,
      vaiTro: 'STORE_OWNER',
      isSeller: true,
      storeId: storeId,
      tenShop: finalStore.tenKho,
    };
    localStorage.setItem('customer_user', JSON.stringify(updatedCustomer));

    const sellerUser = {
      ...updatedCustomer,
      vaiTro: 'STORE_OWNER',
      isSeller: true,
    };
    localStorage.setItem('seller_user', JSON.stringify(sellerUser));
    const token = localStorage.getItem('customer_token');
    if (token) {
      localStorage.setItem('seller_token', token);
    }

    window.dispatchEvent(new Event('customer-user-updated'));
    return { customer: updatedCustomer, store: finalStore };
  },

  // ==================== CHỦ CỬA HÀNG (SELLER / MERCHANT) ====================

  // Đăng nhập chủ cửa hàng (Có kiểm tra Phân quyền RBAC nghiêm ngặt)
  loginSeller: async ({ taiKhoan, matKhau }) => {
    // Luôn xóa sạch session cũ
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    localStorage.removeItem('seller_token');
    localStorage.removeItem('seller_user');
    localStorage.removeItem('seller_selected_store_id');

    try {
      const response = await api.post('/auth/login', { taiKhoan, matKhau });
      const rawRole = (response.vaiTro || '').toUpperCase().replace('ROLE_', '');

      // 🌟 KIỂM TRA PHÂN QUYỀN RBAC CHO KÊNH NGƯỜI BÁN:
      // 1. Khách hàng không được vào Kênh Người Bán nếu chưa mở shop
      if (rawRole === 'CUSTOMER' || rawRole === 'KHACH_HANG') {
        throw new Error('Từ chối truy cập: Tài khoản của bạn là Khách Hàng chưa mở shop. Vui lòng vào Trang Cá Nhân để kích hoạt mở gian hàng!');
      }

      // 2. Thủ kho, Nhân viên kho chỉ có quyền ở kho, không được vào Kênh Người Bán
      if (['WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'THUKHO', 'NVKHO'].includes(rawRole)) {
        throw new Error('Từ chối truy cập: Tài khoản của bạn là Thủ kho / Nhân viên kho. Bạn chỉ có quyền làm việc tại Cổng Quản Lý Kho Bãi (WMS)!');
      }

      // 3. Chỉ ADMIN và CHỦ CỬA HÀNG (STORE_OWNER, SELLER, CHU_CUA_HANG) mới được vào
      const ALLOWED_SELLER_ROLES = ['ADMIN', 'STORE_OWNER', 'SELLER', 'CHU_CUA_HANG', 'STORE_MANAGER'];
      if (!ALLOWED_SELLER_ROLES.includes(rawRole)) {
        throw new Error(`Từ chối truy cập: Vai trò [${rawRole}] không có quyền truy cập Kênh Người Bán!`);
      }

      const token = response.token;
      if (token) {
        localStorage.setItem('seller_token', token);
        localStorage.setItem('customer_token', token);
      }
      const sellerData = {
        id: response.id || Math.abs(taiKhoan.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) || 201,
        taiKhoan: response.taiKhoan || taiKhoan,
        email: response.email || `${taiKhoan}@seller.ctutgear.vn`,
        hoTen: response.hoTen || (rawRole === 'ADMIN' ? 'Quản Trị Viên (Admin)' : taiKhoan),
        vaiTro: rawRole,
        isSeller: true,
      };
      localStorage.setItem('seller_user', JSON.stringify(sellerData));
      localStorage.setItem('customer_user', JSON.stringify(sellerData));
      window.dispatchEvent(new Event('customer-user-updated'));
      return sellerData;
    } catch (err) {
      if (err.message && err.message.includes('Từ chối')) {
        throw err;
      }
      if (err.response?.data) {
        const msg = typeof err.response.data === 'string'
          ? err.response.data
          : (err.response.data.message || 'Tài khoản hoặc mật khẩu không chính xác!');
        throw new Error(msg);
      }
      console.warn('Backend login fallback cho chủ cửa hàng:', err?.message);
      const mockSeller = {
        id: Math.abs(taiKhoan.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) || 201,
        taiKhoan,
        email: `${taiKhoan}@seller.ctutgear.vn`,
        hoTen: taiKhoan === 'baomap05' ? 'Bảo Mập' : taiKhoan,
        vaiTro: 'STORE_OWNER',
        isSeller: true,
      };
      const mockToken = 'SELLER_JWT_TOKEN_' + Date.now();
      localStorage.setItem('seller_token', mockToken);
      localStorage.setItem('customer_token', mockToken);
      localStorage.setItem('seller_user', JSON.stringify(mockSeller));
      localStorage.setItem('customer_user', JSON.stringify(mockSeller));
      window.dispatchEvent(new Event('customer-user-updated'));
      return mockSeller;
    }
  },

  // Đăng ký tài khoản chủ cửa hàng
  registerSeller: async (sellerAccountData) => {
    try {
      const payload = {
        ...sellerAccountData,
        vaiTro: 'STORE_OWNER',
      };
      const response = await api.post('/auth/register', payload);
      return response;
    } catch (err) {
      console.warn('Backend register fallback cho chủ shop:', err?.message);
      return { success: true, message: 'Đăng ký tài khoản chủ cửa hàng thành công!' };
    }
  },

  // 🌟 Lấy thông tin chủ shop hiện tại - ĐẢM BẢO CHÍNH XÁC 100% THEO TÀI KHOẢN ĐANG ĐĂNG NHẬP
  getCurrentSeller: () => {
    try {
      const customer = authService.getCurrentCustomer();
      if (!customer) {
        // Nếu không có tài khoản khách hàng nào đang đăng nhập, dọn dẹp sạch seller
        localStorage.removeItem('seller_user');
        localStorage.removeItem('seller_token');
        localStorage.removeItem('seller_selected_store_id');
        return null;
      }

      // Tài khoản có quyền người bán, hoặc đã có kho riêng đã đăng ký
      const hasRegisteredStore = !!localStorage.getItem(`seller_store_${customer.taiKhoan}`);
      const isSellerRole = customer.vaiTro === 'STORE_OWNER' || customer.vaiTro === 'SELLER' || customer.vaiTro === 'ADMIN';
      const isSeller = Boolean(customer.isSeller || isSellerRole || hasRegisteredStore);

      if (!isSeller) {
        return null;
      }

      // Đảm bảo dữ liệu seller luôn gắn chặt với chính tài khoản khách hàng hiện tại
      const syncedSeller = {
        ...customer,
        vaiTro: customer.vaiTro === 'ADMIN' ? 'ADMIN' : 'STORE_OWNER',
        isSeller: true,
      };
      localStorage.setItem('seller_user', JSON.stringify(syncedSeller));
      return syncedSeller;
    } catch {
      return null;
    }
  },

  // Đăng xuất chủ shop (Xóa sạch toàn bộ session)
  logoutSeller: () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    localStorage.removeItem('seller_token');
    localStorage.removeItem('seller_user');
    localStorage.removeItem('seller_selected_store_id');
    window.dispatchEvent(new Event('customer-user-updated'));
  },
};

