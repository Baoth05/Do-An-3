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
      const response = await api.post('/auth/login', payload);
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
      const data = err.response?.data;
      if (data) {
        throw new Error(typeof data === 'string' ? data : (data.message || 'Tài khoản hoặc mật khẩu không chính xác!'));
      }
      // Không còn tạo phiên đăng nhập giả khi mất kết nối máy chủ
      throw new Error('Không kết nối được máy chủ. Vui lòng thử lại sau!');
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
      const data = err.response?.data;
      if (data) {
        const msg = typeof data === 'string' ? data : (data.message || Object.values(data).join(', '));
        throw new Error(msg || 'Đăng ký thất bại!');
      }
      throw new Error('Không kết nối được máy chủ. Vui lòng thử lại sau!');
    }
  },

  // ============================================================================
  // 2. MODEL NGƯỜI BÁN HÀNG (SELLER MODEL) - KÊNH NGƯỜI BÁN (/seller/login, /seller)
  // ============================================================================

  // Chuyển nhanh 1 chạm từ phiên Khách Hàng sang Kênh Người Bán (Fast-Switch) - KHÔNG cần nhập lại mật khẩu.
  // Vai trò được nâng THẬT trên backend (token mới chứa STORE_OWNER), gian hàng được tạo THẬT trên WMS.
  syncSellerFromCustomer: async (customer) => {
    if (!customer) throw new Error('Vui lòng đăng nhập tài khoản khách hàng trước!');
    let token = localStorage.getItem('customer_token');
    if (!token) throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!');

    const readErr = (err, fallback) => {
      const data = err?.response?.data;
      return typeof data === 'string' && data ? data : (data?.message || err?.message || fallback);
    };

    // 1. Khách hàng thường: nâng vai trò lên Chủ cửa hàng & nhận token mới
    let role = (customer.vaiTro || '').toUpperCase();
    if (role !== 'STORE_OWNER' && role !== 'SELLER' && role !== 'ADMIN') {
      try {
        const upgraded = await api.put('/auth/upgrade-to-seller', null, {
          headers: { Authorization: `Bearer ${token}` },
        });
        token = upgraded.token;
        role = 'STORE_OWNER';
        localStorage.setItem('customer_token', token);
        const updatedCustomer = { ...customer, vaiTro: 'STORE_OWNER' };
        localStorage.setItem('customer_user', JSON.stringify(updatedCustomer));
        window.dispatchEvent(new Event('customer-user-updated'));
      } catch (err) {
        throw new Error('Không thể chuyển sang Kênh Người Bán: ' + readErr(err, 'Lỗi nâng cấp tài khoản'), { cause: err });
      }
    }
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Lấy gian hàng thật của tài khoản; chưa có thì tự khởi tạo gian hàng mặc định
    let store = null;
    try {
      store = await api.get(`/stores/manager/${customer.id}`, authHeader);
    } catch { /* chưa có gian hàng */ }
    if ((!store || !store.id) && role !== 'ADMIN') {
      try {
        store = await api.post('/stores', {
          tenKho: `Gian Hàng ${customer.hoTen || customer.taiKhoan}`,
          maKho: `STORE-${String(customer.taiKhoan).toUpperCase()}`,
          diaChi: customer.diaChi || 'Việt Nam',
          soDienThoai: customer.soDienThoai || '',
          email: customer.email || '',
          loaiHinh: 'KHO_CUA_HANG',
        }, authHeader);
      } catch (err) {
        throw new Error('Không thể khởi tạo gian hàng: ' + readErr(err, 'Lỗi tạo gian hàng'), { cause: err });
      }
    }

    const sellerData = {
      id: customer.id,
      taiKhoan: customer.taiKhoan,
      email: customer.email,
      hoTen: customer.hoTen || store?.tenKho,
      vaiTro: role === 'ADMIN' ? 'ADMIN' : 'STORE_OWNER',
      isSeller: true,
      storeId: store?.id ? Number(store.id) : null,
      tenShop: store?.tenKho || '',
    };
    if (store?.id) {
      localStorage.setItem(`seller_store_${customer.taiKhoan}`, JSON.stringify(store));
      localStorage.setItem('seller_selected_store_id', String(store.id));
    }
    localStorage.setItem('seller_token', token);
    localStorage.setItem('seller_user', JSON.stringify(sellerData));
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
      const response = await api.post('/auth/login', payload);
      const rawRole = (response.vaiTro || response.role || '').toUpperCase().replace('ROLE_', '');

      // 1. Chặn nhân viên kho vào kênh người bán (chỉ làm việc tại WMS)
      if (['WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'THUKHO', 'NVKHO'].includes(rawRole)) {
        throw new Error('Từ chối truy cập: Tài khoản của bạn thuộc phân hệ Quản Lý Kho Bãi (WMS). Không thể truy cập Kênh Người Bán!');
      }

      // 2. Tài khoản khách hàng chưa mở gian hàng: hướng dẫn dùng Fast-Switch / Mở gian hàng
      if (rawRole !== 'STORE_OWNER' && rawRole !== 'SELLER' && rawRole !== 'ADMIN') {
        throw new Error('Từ chối truy cập: Tài khoản chưa đăng ký bán hàng. Hãy đăng nhập Sàn và bấm "Vào Kênh Người Bán" để mở gian hàng!');
      }

      if (!response.token) {
        throw new Error('Đăng nhập thất bại: máy chủ không trả về token!');
      }
      localStorage.setItem('seller_token', response.token);

      // Ưu tiên lấy gian hàng thật của chủ shop từ WMS (theo quanLyId = userId)
      let backendStore = null;
      try {
        if (response.id) backendStore = await api.get(`/stores/manager/${response.id}`);
      } catch (e) { }

      // Đọc hoặc tự động tạo kho riêng cho shop nếu chưa có
      let storeInfo = backendStore && backendStore.id ? { ...backendStore, taiKhoan: cleanUser } : null;
      if (!storeInfo) {
        try {
          const s = localStorage.getItem(`seller_store_${cleanUser}`);
          if (s) storeInfo = JSON.parse(s);
        } catch (e) { }
      }

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
      if (err.message && (err.message.includes('Từ chối') || err.message.includes('Kho Bãi'))) {
        throw err;
      }
      const data = err.response?.data;
      if (data) {
        throw new Error(typeof data === 'string' ? data : (data.message || 'Tài khoản hoặc mật khẩu không chính xác!'));
      }
      // Không còn tạo phiên đăng nhập giả khi mất kết nối máy chủ
      throw new Error('Không kết nối được máy chủ. Vui lòng thử lại sau!');
    }
  },

  // Lấy thông tin phiên Người Bán hiện tại
  getCurrentSeller: () => {
    try {
      const sellerStr = localStorage.getItem('seller_user');
      if (sellerStr) return JSON.parse(sellerStr);
      // Chưa có phiên người bán: người dùng cần đăng nhập Kênh Người Bán hoặc dùng Fast-Switch tại /seller/login
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
      const data = e.response?.data;
      if (data) {
        const msg = typeof data === 'string' ? data : (data.message || Object.values(data).join(', '));
        throw new Error(msg || 'Đăng ký tài khoản người bán thất bại!');
      }
      throw new Error('Không kết nối được máy chủ. Vui lòng thử lại sau!');
    }

    // Đăng nhập ngay để lấy token thật (tạo gian hàng yêu cầu đăng nhập với vai trò Chủ shop)
    const loginRes = await api.post('/auth/login', {
      taiKhoan: sellerData.taiKhoan,
      matKhau: sellerData.matKhau,
    });

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
      createdStore = await api.post('/stores', storePayload, {
        headers: { Authorization: `Bearer ${loginRes.token}` },
      });
    } catch (e) {
      const data = e.response?.data;
      throw new Error('Tạo gian hàng thất bại: ' + (typeof data === 'string' ? data : (data?.message || e.message)));
    }

    const storeId = createdStore.id;
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

    // 1. Nâng vai trò tài khoản lên Chủ cửa hàng và nhận token mới chứa vai trò STORE_OWNER
    let upgraded;
    try {
      upgraded = await api.put('/auth/upgrade-to-seller');
    } catch (err) {
      const data = err.response?.data;
      throw new Error('Không thể mở gian hàng: ' + (typeof data === 'string' ? data : (data?.message || err.message)));
    }
    localStorage.setItem('customer_token', upgraded.token);
    localStorage.setItem('seller_token', upgraded.token);

    // 2. Tạo gian hàng thật trên WMS (backend tự gán quanLyId = tài khoản đang đăng nhập)
    let createdStore = null;
    try {
      createdStore = await api.post('/stores', storePayload, {
        headers: { Authorization: `Bearer ${upgraded.token}` },
      });
    } catch (err) {
      const data = err.response?.data;
      throw new Error('Tạo gian hàng thất bại: ' + (typeof data === 'string' ? data : (data?.message || err.message)));
    }

    const storeId = createdStore.id;
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
