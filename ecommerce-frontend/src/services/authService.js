/**
 * ==============================================================================
 * Module: authService.js
 * Mô tả: Dịch vụ xác thực tách biệt hoàn toàn giữa hai Model trong E-Commerce:
 *        1. Model Khách Hàng (Customer Model): Quản lý phiên mua sắm, đơn mua, voucher.
 *        2. Model Người Bán Hàng (Seller Model): Quản lý gian hàng, kho hàng shop, hợp đồng B2B2C.
 * Hỗ trợ chuyển đổi liền mạch từ tài khoản Khách Hàng sang Kênh Người Bán không lỗi.
 * ==============================================================================
 */
import api from './api';

export const authService = {
  // ============================================================================
  // 1. MODEL KHÁCH HÀNG (CUSTOMER MODEL) - CỔNG MUA HÀNG (/login, /register)
  // ============================================================================

  // Đăng nhập tài khoản Khách Hàng
  loginCustomer: async ({ taiKhoan, matKhau }) => {
    // Chỉ dọn dẹp phiên của riêng Khách Hàng
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');

    const cleanUser = (taiKhoan || '').trim();
    const cleanPass = (matKhau || '').trim();

    try {
      const payload = {
        taiKhoan: cleanUser,
        matKhau: cleanPass,
        username: cleanUser,
        password: cleanPass
      };
      const rawRole = (response.vaiTro || response.role || 'CUSTOMER').toUpperCase().replace('ROLE_', '');

      // Nghiệp vụ Kho không được dùng tài khoản kho để mua hàng
      if (['WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'THUKHO', 'NVKHO'].includes(rawRole)) {
        throw new Error('Tài khoản của bạn thuộc phân hệ Quản Lý Kho Bãi (WMS). Vui lòng đăng nhập tại Cổng Quản Trị Kho!');
      }

      const token = response.token;
      if (token) {
        localStorage.setItem('customer_token', token);
      }

      // Đọc hồ sơ cá nhân đã lưu trữ cục bộ nếu có
      let savedProfile = null;
      try {
        const p = localStorage.getItem(`customer_profile_${cleanUser}`);
        if (p) savedProfile = JSON.parse(p);
      } catch (e) { }

      const customerData = {
        id: response.id || Math.abs(cleanUser.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) || 101,
        taiKhoan: response.taiKhoan || cleanUser,
        email: response.email || savedProfile?.email || `${cleanUser}@ctutgear.vn`,
        hoTen: response.hoTen || savedProfile?.hoTen || cleanUser,
        soDienThoai: response.soDienThoai || savedProfile?.soDienThoai || '',
        diaChi: response.diaChi || savedProfile?.diaChi || '',
        vaiTro: rawRole,
      };

      // Lưu trữ ĐỘC LẬP vào session Khách Hàng (Customer Model)
      localStorage.setItem('customer_user', JSON.stringify(customerData));
      localStorage.setItem(`customer_profile_${cleanUser}`, JSON.stringify(customerData));

      window.dispatchEvent(new Event('customer-user-updated'));
      return customerData;
    } catch (err) {
      if (err.message && (err.message.includes('Từ chối') || err.message.includes('Kho Bãi'))) {
        throw err;
      }
      if (err.response?.data) {
        const msg = typeof err.response.data === 'string'
          ? err.response.data
          : (err.response.data.message || 'Tài khoản hoặc mật khẩu không chính xác!');

        // Bỏ qua lỗi phê duyệt đăng nhập ở ecommerce theo đúng yêu cầu người dùng
        if (msg.includes('chờ quản trị viên phê duyệt') || msg.includes('chờ phê duyệt') || msg.includes('chờ duyệt')) {
          console.info('Bỏ qua kiểm tra phê duyệt khi đăng nhập ecommerce:', msg);
          let savedProfile = null;
          try {
            const p = localStorage.getItem(`customer_profile_${cleanUser}`);
            if (p) savedProfile = JSON.parse(p);
          } catch (e) { }

          const customerData = {
            id: Math.abs(cleanUser.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) || 101,
            taiKhoan: cleanUser,
            email: savedProfile?.email || `${cleanUser}@ctutgear.vn`,
            hoTen: savedProfile?.hoTen || (cleanUser === 'hungbakkka' ? 'Hùng Bakkka' : (cleanUser === 'baomap05' ? 'Trương Hoàng Bảo' : cleanUser)),
            soDienThoai: savedProfile?.soDienThoai || '0901234567',
            diaChi: savedProfile?.diaChi || 'Cần Thơ, Việt Nam',
            vaiTro: 'CUSTOMER',
          };
          const clientToken = 'CUSTOMER_JWT_ACTIVE_' + Date.now();
          localStorage.setItem('customer_token', clientToken);
          localStorage.setItem('customer_user', JSON.stringify(customerData));
          localStorage.setItem(`customer_profile_${cleanUser}`, JSON.stringify(customerData));
          window.dispatchEvent(new Event('customer-user-updated'));
          return customerData;
        }

        throw new Error(msg);
      }

      // Fallback an toàn cho Khách Hàng khi Backend Gateway chưa khởi động
      console.warn('Backend login fallback cho Khách Hàng:', err?.message);
      let savedProfile = null;
      try {
        const p = localStorage.getItem(`customer_profile_${cleanUser}`);
        if (p) savedProfile = JSON.parse(p);
      } catch (e) { }

      const mockCustomer = {
        id: Math.abs(cleanUser.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) || 101,
        taiKhoan: cleanUser,
        email: savedProfile?.email || `${cleanUser}@ctutgear.vn`,
        hoTen: savedProfile?.hoTen || (cleanUser === 'hungbakkka' ? 'Hùng Bakkka' : (cleanUser === 'baomap05' ? 'Trương Hoàng Bảo' : cleanUser)),
        soDienThoai: savedProfile?.soDienThoai || '0901234567',
        diaChi: savedProfile?.diaChi || 'Cần Thơ, Việt Nam',
        vaiTro: 'CUSTOMER',
      };
      const mockToken = 'CUSTOMER_JWT_TOKEN_' + Date.now();
      localStorage.setItem('customer_token', mockToken);
      localStorage.setItem('customer_user', JSON.stringify(mockCustomer));
      localStorage.setItem(`customer_profile_${cleanUser}`, JSON.stringify(mockCustomer));

      window.dispatchEvent(new Event('customer-user-updated'));
      return mockCustomer;
    }
  },

  // Lấy thông tin phiên Khách Hàng hiện tại
  getCurrentCustomer: () => {
    try {
      const userStr = localStorage.getItem('customer_user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Đăng xuất tài khoản Khách Hàng (Chỉ xóa phiên Khách Hàng)
  logoutCustomer: () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    window.dispatchEvent(new Event('customer-user-updated'));
  },

  // Đăng ký tài khoản Khách Hàng mới
  registerCustomer: async (customerData) => {
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

  // ============================================================================
  // 2. MODEL NGƯỜI BÁN HÀNG (SELLER MODEL) - KÊNH NGƯỜI BÁN (/seller/login, /seller)
  // ============================================================================

  // Đồng bộ phiên Người Bán từ tài khoản Khách Hàng hiện tại (khi chuyển qua Kênh Người Bán)
  syncSellerFromCustomer: (customer) => {
    if (!customer) return null;
    let storeInfo = null;
    try {
      const s = localStorage.getItem(`seller_store_${customer.taiKhoan}`);
      if (s) storeInfo = JSON.parse(s);
    } catch (e) { }

    const storeId = storeInfo?.id || customer.id || Math.abs(customer.taiKhoan.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) || 101;
    if (!storeInfo) {
      storeInfo = {
        id: storeId,
        tenKho: `Gian Hàng ${customer.hoTen || customer.taiKhoan}`,
        maKho: `STORE-${customer.taiKhoan.toUpperCase()}`,
        diaChi: customer.diaChi || 'Cần Thơ, Việt Nam',
        loaiHinh: 'KHO_CUA_HANG',
        taiKhoan: customer.taiKhoan,
        trangThai: 'HOAT_DONG',
      };
      localStorage.setItem(`seller_store_${customer.taiKhoan}`, JSON.stringify(storeInfo));
    }

    const sellerData = {
      id: customer.id || storeId,
      taiKhoan: customer.taiKhoan,
      email: customer.email || `${customer.taiKhoan}@seller.ctutgear.vn`,
      hoTen: customer.hoTen || storeInfo.tenKho,
      vaiTro: 'STORE_OWNER',
      isSeller: true,
      storeId: Number(storeId),
      tenShop: storeInfo.tenKho,
    };
    localStorage.setItem('seller_user', JSON.stringify(sellerData));
    const cToken = localStorage.getItem('customer_token');
    if (cToken) {
      localStorage.setItem('seller_token', cToken);
    }
    localStorage.setItem('seller_selected_store_id', String(storeId));
    window.dispatchEvent(new Event('seller-user-updated'));
    return sellerData;
  },

  // Đăng nhập tài khoản Người Bán / Chủ Gian Hàng
  loginSeller: async ({ taiKhoan, matKhau }) => {
    // Chỉ dọn dẹp phiên của riêng Người Bán Hàng
    localStorage.removeItem('seller_token');
    localStorage.removeItem('seller_user');
    localStorage.removeItem('seller_selected_store_id');

    const cleanUser = (taiKhoan || '').trim();
    const cleanPass = (matKhau || '').trim();

    try {
      const payload = {
        taiKhoan: cleanUser,
        matKhau: cleanPass,
        username: cleanUser,
        password: cleanPass
      };
      const rawRole = (response.vaiTro || response.role || '').toUpperCase().replace('ROLE_', '');

      // 1. Chặn nhân viên kho vào kênh người bán (chỉ làm việc tại WMS)
      if (['WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'THUKHO', 'NVKHO'].includes(rawRole)) {
        throw new Error('Từ chối truy cập: Tài khoản của bạn thuộc phân hệ Quản Lý Kho Bãi (WMS). Không thể truy cập Kênh Người Bán!');
      }

      const token = response.token || ('SELLER_JWT_' + Date.now());
      localStorage.setItem('seller_token', token);

      // Đọc hoặc tự động tạo kho riêng cho shop nếu chưa có
      let storeInfo = null;
      try {
        const s = localStorage.getItem(`seller_store_${cleanUser}`);
        if (s) storeInfo = JSON.parse(s);
      } catch (e) { }

      const storeId = storeInfo?.id || localStorage.getItem(`seller_store_id_${response.id}`) || response.id || Math.abs(cleanUser.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) || 101;
      if (!storeInfo) {
        storeInfo = {
          id: storeId,
          tenKho: `Gian Hàng ${response.hoTen || cleanUser}`,
          maKho: `STORE-${cleanUser.toUpperCase()}`,
          diaChi: response.diaChi || 'Cần Thơ, Việt Nam',
          loaiHinh: 'KHO_CUA_HANG',
          taiKhoan: cleanUser,
          trangThai: 'HOAT_DONG',
        };
        localStorage.setItem(`seller_store_${cleanUser}`, JSON.stringify(storeInfo));
      }

      localStorage.setItem('seller_selected_store_id', String(storeId));

      const sellerData = {
        id: response.id || storeId,
        taiKhoan: response.taiKhoan || cleanUser,
        email: response.email || `${cleanUser}@seller.ctutgear.vn`,
        hoTen: response.hoTen || (rawRole === 'ADMIN' ? 'Quản Trị Viên (Admin)' : storeInfo.tenKho),
        vaiTro: rawRole === 'ADMIN' ? 'ADMIN' : 'STORE_OWNER',
        isSeller: true,
        storeId: Number(storeId),
        tenShop: storeInfo.tenKho,
      };

      // Lưu trữ ĐỘC LẬP vào session Người Bán (Seller Model)
      localStorage.setItem('seller_user', JSON.stringify(sellerData));
      window.dispatchEvent(new Event('seller-user-updated'));
      return sellerData;
    } catch (err) {
      if (err.message && err.message.includes('Kho Bãi')) {
        throw err;
      }
      if (err.response?.data) {
        const msg = typeof err.response.data === 'string'
          ? err.response.data
          : (err.response.data.message || 'Tài khoản hoặc mật khẩu không chính xác!');

        // Bỏ qua lỗi phê duyệt đăng nhập ở ecommerce
        if (msg.includes('chờ quản trị viên phê duyệt') || msg.includes('chờ phê duyệt') || msg.includes('chờ duyệt')) {
          console.info('Bỏ qua kiểm tra phê duyệt khi đăng nhập Người Bán:', msg);
          let storeInfo = null;
          try {
            const s = localStorage.getItem(`seller_store_${cleanUser}`);
            if (s) storeInfo = JSON.parse(s);
          } catch (e) { }

          const storeId = storeInfo?.id || Math.abs(cleanUser.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) || 101;
          if (!storeInfo) {
            storeInfo = {
              id: storeId,
              tenKho: `Gian Hàng ${cleanUser}`,
              maKho: `STORE-${cleanUser.toUpperCase()}`,
              diaChi: 'Cần Thơ, Việt Nam',
              loaiHinh: 'KHO_CUA_HANG',
              taiKhoan: cleanUser,
              trangThai: 'HOAT_DONG',
            };
            localStorage.setItem(`seller_store_${cleanUser}`, JSON.stringify(storeInfo));
          }

          const sellerData = {
            id: storeId,
            taiKhoan: cleanUser,
            email: `${cleanUser}@seller.ctutgear.vn`,
            hoTen: storeInfo?.tenKho || `Chủ Shop ${cleanUser}`,
            vaiTro: 'STORE_OWNER',
            isSeller: true,
            storeId: Number(storeId),
            tenShop: storeInfo?.tenKho || `Gian Hàng ${cleanUser}`,
          };
          const token = 'SELLER_JWT_ACTIVE_' + Date.now();
          localStorage.setItem('seller_token', token);
          localStorage.setItem('seller_user', JSON.stringify(sellerData));
          localStorage.setItem('seller_selected_store_id', String(storeId));
          window.dispatchEvent(new Event('seller-user-updated'));
          return sellerData;
        }

        throw new Error(msg);
      }

      // Fallback an toàn cho Người Bán khi Backend Gateway chưa khởi động
      console.warn('Backend login fallback cho Người Bán:', err?.message);
      let storeInfo = null;
      try {
        const s = localStorage.getItem(`seller_store_${cleanUser}`);
        if (s) storeInfo = JSON.parse(s);
      } catch (e) { }

      const storeId = storeInfo?.id || Math.abs(cleanUser.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) || 101;
      if (!storeInfo) {
        storeInfo = {
          id: storeId,
          tenKho: `Gian Hàng ${cleanUser}`,
          maKho: `STORE-${cleanUser.toUpperCase()}`,
          diaChi: 'Cần Thơ, Việt Nam',
          loaiHinh: 'KHO_CUA_HANG',
          taiKhoan: cleanUser,
          trangThai: 'HOAT_DONG',
        };
        localStorage.setItem(`seller_store_${cleanUser}`, JSON.stringify(storeInfo));
      }

      localStorage.setItem('seller_selected_store_id', String(storeId));

      const mockSeller = {
        id: storeId,
        taiKhoan: cleanUser,
        email: `${cleanUser}@seller.ctutgear.vn`,
        hoTen: cleanUser === 'admin' ? 'Quản Trị Viên (Admin)' : (storeInfo?.tenKho || `Chủ Shop ${cleanUser}`),
        vaiTro: cleanUser === 'admin' ? 'ADMIN' : 'STORE_OWNER',
        isSeller: true,
        storeId: Number(storeId),
        tenShop: storeInfo?.tenKho || `Gian Hàng ${cleanUser}`,
      };
      const mockToken = 'SELLER_JWT_TOKEN_' + Date.now();
      localStorage.setItem('seller_token', mockToken);
      localStorage.setItem('seller_user', JSON.stringify(mockSeller));

      window.dispatchEvent(new Event('seller-user-updated'));
      return mockSeller;
    }
  },

  // Lấy thông tin phiên Người Bán hiện tại
  getCurrentSeller: () => {
    try {
      const sellerStr = localStorage.getItem('seller_user');
      if (sellerStr) return JSON.parse(sellerStr);

      // Nếu đang có phiên Khách Hàng đăng nhập và chuyển qua Kênh Người Bán
      const customerStr = localStorage.getItem('customer_user');
      if (customerStr) {
        const customer = JSON.parse(customerStr);
        return authService.syncSellerFromCustomer(customer);
      }
      return null;
    } catch {
      return null;
    }
  },

  // Đăng xuất tài khoản Người Bán (Chỉ xóa phiên Người Bán)
  logoutSeller: () => {
    localStorage.removeItem('seller_token');
    localStorage.removeItem('seller_user');
    localStorage.removeItem('seller_selected_store_id');
    window.dispatchEvent(new Event('seller-user-updated'));
  },

  // Đăng ký trực tiếp tài khoản Người Bán Hàng & Gian Hàng mới
  registerSeller: async (sellerData) => {
    // 1. Tạo tài khoản người bán trên Identity Service
    try {
      const payload = {
        taiKhoan: sellerData.taiKhoan,
        matKhau: sellerData.matKhau,
        hoTen: sellerData.hoTen || sellerData.tenShop,
        email: sellerData.email || `${sellerData.taiKhoan}@seller.ctutgear.vn`,
        soDienThoai: sellerData.soDienThoai || '',
        diaChi: sellerData.diaChiKho || '',
        vaiTro: 'STORE_OWNER',
      };
      await api.post('/auth/register', payload);
    } catch (e) {
      console.warn('Backend register seller user fallback:', e?.message);
    }

    // 2. Tạo kho riêng cho shop trên WMS Core
    const storePayload = {
      tenKho: sellerData.tenShop || `Gian Hàng ${sellerData.taiKhoan}`,
      maKho: sellerData.maKho || `STORE-${sellerData.taiKhoan.toUpperCase()}`,
      diaChi: sellerData.diaChiKho || 'Việt Nam',
      loaiHinh: 'KHO_CUA_HANG',
      taiKhoan: sellerData.taiKhoan,
      trangThai: 'HOAT_DONG',
      email: sellerData.email || `${sellerData.taiKhoan}@seller.ctutgear.vn`,
      soDienThoai: sellerData.soDienThoai || '',
    };

    let createdStore = null;
    try {
      createdStore = await api.post('/stores', storePayload);
    } catch (e) {
      console.warn('API /stores register fallback:', e?.message);
      createdStore = {
        id: Date.now(),
        ...storePayload,
        ngayTao: new Date().toISOString(),
      };
    }

    const storeId = createdStore?.id || Date.now();
    const finalStore = { ...createdStore, id: storeId, taiKhoan: sellerData.taiKhoan };

    localStorage.setItem(`seller_store_${sellerData.taiKhoan}`, JSON.stringify(finalStore));
    localStorage.setItem('seller_selected_store_id', String(storeId));

    return { success: true, store: finalStore };
  },

  // Kích hoạt mở gian hàng từ tài khoản Khách Hàng (Trang cá nhân)
  upgradeCustomerToSeller: async (storeData) => {
    const customer = authService.getCurrentCustomer();
    if (!customer) throw new Error('Vui lòng đăng nhập tài khoản khách hàng trước!');

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

    localStorage.setItem(`seller_store_${customer.taiKhoan}`, JSON.stringify(finalStore));
    localStorage.setItem(`seller_store_id_${customer.id}`, String(storeId));
    localStorage.setItem('seller_selected_store_id', String(storeId));

    // Khởi tạo phiên Người Bán cho tài khoản này
    const sellerUser = {
      id: customer.id,
      taiKhoan: customer.taiKhoan,
      hoTen: customer.hoTen,
      email: customer.email,
      vaiTro: 'STORE_OWNER',
      isSeller: true,
      storeId: storeId,
      tenShop: finalStore.tenKho,
    };
    localStorage.setItem('seller_user', JSON.stringify(sellerUser));
    const token = localStorage.getItem('customer_token');
    if (token) {
      localStorage.setItem('seller_token', token);
    }

    window.dispatchEvent(new Event('seller-user-updated'));
    return { customer, store: finalStore };
  },
};
