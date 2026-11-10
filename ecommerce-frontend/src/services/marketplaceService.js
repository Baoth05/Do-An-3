/**
 * ==============================================================================
 * Module: marketplaceService.js
 * Mô tả: Cổng kết nối API Sàn Thương Mại Điện Tử & Kênh Người Bán (Seller Portal).
 * Chức năng:
 *   - Khách mua: Lấy sản phẩm mở bán, Gian hàng, Voucher, Đặt đơn hàng, Đánh giá, Bình luận.
 *   - Chủ shop (Seller):
 *       + Đăng ký gian hàng & Tạo kho riêng (POST /stores)
 *       + Ký hợp đồng cung ứng & Nhập hàng từ Kho Tổng về Kho riêng (POST /inventory/add)
 *       + Quản lý kho hàng shop, Đăng bán / Ngừng bán sản phẩm (PUT /inventory/{id}/publish)
 *       + Xử lý đơn hàng của shop, Tạo voucher shop, Cập nhật thông tin shop.
 * ==============================================================================
 */
import api from './api';

// Quản lý hợp đồng cung ứng của shop trên local storage
const getLocalContracts = (storeId) => {
  try {
    const raw = localStorage.getItem(`seller_contracts_${storeId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalContract = (storeId, contract) => {
  try {
    const current = getLocalContracts(storeId);
    const updated = [contract, ...current];
    localStorage.setItem(`seller_contracts_${storeId}`, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Could not save contract', e);
    return [contract];
  }
};

export const marketplaceService = {
  // ==================== DÀNH CHO KHÁCH HÀNG (MARKETPLACE) ====================

  // Lấy danh sách sản phẩm ĐANG ĐƯỢC CHỦ SHOP ĐĂNG BÁN trên sàn (dangBan == true & tonKho > 0)
  getMarketplaceProducts: async () => {
    try {
      const res = await api.get('/inventory/marketplace');
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn('Lỗi gọi /inventory/marketplace:', err?.message);
      return [];
    }
  },

  // Lấy chi tiết 1 sản phẩm theo ID
  getProductById: async (productId) => {
    try {
      return await api.get(`/products/${productId}`);
    } catch (err) {
      console.warn(`Lỗi gọi /products/${productId}:`, err?.message);
      return null;
    }
  },

  // Lấy danh sách Gian hàng thật trên Sàn
  getStores: async () => {
    try {
      const res = await api.get('/stores');
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn('Lỗi gọi /stores:', err?.message);
      return [];
    }
  },

  // Lấy chi tiết Gian hàng theo ID
  getStoreById: async (id) => {
    try {
      return await api.get(`/stores/${id}`);
    } catch (err) {
      console.warn(`Lỗi gọi /stores/${id}:`, err?.message);
      return null;
    }
  },

  // Lấy Gian hàng / Kho riêng thuộc quyền sở hữu của 1 Chủ shop cụ thể
  getStoreByManager: async (userId) => {
    try {
      const res = await api.get(`/stores/manager/${userId}`);
      if (res && res.id) return res;
    } catch (err) {
      console.warn(`Lỗi gọi /stores/manager/${userId}:`, err?.message);
    }
    return null;
  },

  // Lấy các sản phẩm ĐANG MỞ BÁN của 1 Gian hàng cụ thể
  getProductsByStore: async (storeId) => {
    try {
      const res = await api.get(`/inventory/store/${storeId}`);
      if (Array.isArray(res)) {
        return res.filter((item) => item.dangBan === true);
      }
      return [];
    } catch (err) {
      console.warn(`Lỗi gọi /inventory/store/${storeId}:`, err?.message);
      return [];
    }
  },

  // Lấy Voucher toàn sàn
  getGlobalVouchers: async () => {
    try {
      const res = await api.get('/vouchers/global');
      if (Array.isArray(res) && res.length > 0) return res;
    } catch (err) {
      console.warn('Lỗi gọi /vouchers/global:', err?.message);
    }

    // Voucher mặc định toàn sàn
    return [
      {
        id: 1,
        maVoucher: 'CTUT50K',
        phanTramGiam: 10,
        giamToiDa: 50000,
        donHangToiThieu: 150000,
        soLuongConLai: 500,
        moTa: 'Giảm 10% tối đa 50.000đ cho đơn hàng đa shop từ 150.000đ'
      },
      {
        id: 2,
        maVoucher: 'CTUTNEW50',
        phanTramGiam: 15,
        giamToiDa: 50000,
        donHangToiThieu: 150000,
        soLuongConLai: 500,
        moTa: 'Giảm ngay 15% tối đa 50.000đ chào mừng khách hàng mới'
      },
      {
        id: 3,
        maVoucher: 'FREESHIP',
        phanTramGiam: 100,
        giamToiDa: 30000,
        donHangToiThieu: 200000,
        soLuongConLai: 1000,
        moTa: 'Miễn phí vận chuyển toàn quốc 30.000đ cho đơn từ 200.000đ'
      },
      {
        id: 4,
        maVoucher: 'TECHPRO10',
        phanTramGiam: 10,
        giamToiDa: 200000,
        donHangToiThieu: 1000000,
        soLuongConLai: 200,
        moTa: 'Giảm 10% tối đa 200.000đ cho Gaming Gear & Linh kiện PC'
      }
    ];
  },

  // Lấy Voucher riêng của từng Shop (Luôn đảm bảo hiển thị đúng mã tại gian hàng)
  getStoreVouchers: async (storeId) => {
    let apiVouchers = [];
    try {
      const res = await api.get(`/vouchers/store/${storeId}`);
      if (Array.isArray(res)) apiVouchers = res;
    } catch (err) {
      console.warn(`Lỗi gọi /vouchers/store/${storeId}:`, err?.message);
    }

    // Kiểm tra cache voucher do chủ shop tự tạo trên Kênh Người Bán
    const localKey = `store_vouchers_${storeId}`;
    let localVouchers = [];
    try {
      localVouchers = JSON.parse(localStorage.getItem(localKey) || '[]');
    } catch (e) {
      console.warn(e);
    }

    // Mẫu voucher mặc định theo từng shop
    const defaultShopVouchers = [
      {
        id: `shop-vc-${storeId}-1`,
        cuaHangId: Number(storeId),
        maVoucher: `SHOP${storeId}OFF10`,
        phanTramGiam: 10,
        giamToiDa: 100000,
        donHangToiThieu: 200000,
        soLuongConLai: 100,
        moTa: `Giảm 10% tối đa 100.000đ khi mua sắm tại gian hàng`
      },
      {
        id: `shop-vc-${storeId}-2`,
        cuaHangId: Number(storeId),
        maVoucher: `FREESHIP${storeId}`,
        phanTramGiam: 100,
        giamToiDa: 30000,
        donHangToiThieu: 150000,
        soLuongConLai: 50,
        moTa: `Hỗ trợ 30.000đ phí vận chuyển đóng gói nhanh từ kho riêng của shop`
      }
    ];

    const map = new Map();
    [...apiVouchers, ...localVouchers, ...defaultShopVouchers].forEach((v) => {
      if (v && v.maVoucher && !map.has(v.maVoucher)) {
        map.set(v.maVoucher, v);
      }
    });

    return Array.from(map.values());
  },

  // Kiểm tra mã voucher hợp lệ (Thông minh: Hỗ trợ cả API lẫn Cache LocalStorage và Fallback)
  checkVoucher: async (code) => {
    if (!code) throw new Error('Vui lòng nhập mã giảm giá!');
    const normalizedCode = code.trim().toUpperCase();

    // 1. Thử gọi API Backend
    try {
      const res = await api.get(`/vouchers/check/${normalizedCode}`);
      if (res && res.maVoucher) return res;
    } catch (err) {
      // Nếu API không tìm thấy hoặc lỗi kết nối, tiếp tục tìm trong Local/Seed Data
    }

    // 2. Tra cứu trong Voucher toàn sàn
    const globalVouchers = await marketplaceService.getGlobalVouchers();
    const foundGlobal = globalVouchers.find((v) => v.maVoucher.toUpperCase() === normalizedCode);
    if (foundGlobal) return foundGlobal;

    // 3. Tra cứu trong các Voucher của shop (LocalStorage & Defaults)
    for (let sid = 1; sid <= 10; sid++) {
      try {
        const localKey = `store_vouchers_${sid}`;
        const sList = JSON.parse(localStorage.getItem(localKey) || '[]');
        const foundLocal = sList.find((v) => v.maVoucher?.toUpperCase() === normalizedCode);
        if (foundLocal) return foundLocal;
      } catch (e) {}

      if (normalizedCode === `SHOP${sid}OFF10`) {
        return {
          cuaHangId: sid,
          maVoucher: normalizedCode,
          phanTramGiam: 10,
          giamToiDa: 100000,
          donHangToiThieu: 200000,
          soLuongConLai: 100,
          moTa: `Giảm 10% tối đa 100.000đ tại Gian hàng #${sid}`
        };
      }
      if (normalizedCode === `FREESHIP${sid}`) {
        return {
          cuaHangId: sid,
          maVoucher: normalizedCode,
          phanTramGiam: 100,
          giamToiDa: 30000,
          donHangToiThieu: 150000,
          soLuongConLai: 50,
          moTa: `Miễn phí vận chuyển 30.000đ tại Gian hàng #${sid}`
        };
      }
    }

    if (normalizedCode === 'GAMING20K') {
      return { cuaHangId: 2, maVoucher: 'GAMING20K', phanTramGiam: 10, giamToiDa: 50000, donHangToiThieu: 300000, moTa: 'Giảm 50K cho Gaming Gear' };
    }
    if (normalizedCode === 'ROGSALE50') {
      return { cuaHangId: 3, maVoucher: 'ROGSALE50', phanTramGiam: 15, giamToiDa: 200000, donHangToiThieu: 1000000, moTa: 'Giảm 15% tối đa 200K tại ASUS ROG' };
    }

    throw new Error(`Mã giảm giá "${normalizedCode}" không tồn tại hoặc đã hết hạn!`);
  },

  // Đồng bộ Quản lý Voucher Đã Lưu Của Người Dùng (User Saved Vouchers)
  getUserSavedVouchers: async () => {
    const map = new Map();

    // 1. Đọc từ user_saved_vouchers
    try {
      const raw = JSON.parse(localStorage.getItem('user_saved_vouchers') || '[]');
      for (const item of raw) {
        if (typeof item === 'string') {
          try {
            const vObj = await marketplaceService.checkVoucher(item);
            if (vObj && vObj.maVoucher) map.set(vObj.maVoucher, vObj);
          } catch {
            map.set(item, {
              maVoucher: item,
              phanTramGiam: 10,
              giamToiDa: 50000,
              donHangToiThieu: 150000,
              moTa: 'Mã ưu đãi đã lưu'
            });
          }
        } else if (item && item.maVoucher) {
          map.set(item.maVoucher, item);
        }
      }
    } catch (e) {
      console.warn(e);
    }

    // 2. Đọc từ customer_vouchers_{taiKhoan} nếu có
    const customer = authService.getCurrentCustomer();
    if (customer?.taiKhoan) {
      try {
        const custRaw = JSON.parse(localStorage.getItem(`customer_vouchers_${customer.taiKhoan}`) || '[]');
        for (const item of custRaw) {
          if (item && item.maVoucher && !map.has(item.maVoucher)) {
            map.set(item.maVoucher, item);
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }

    // Nếu chưa có voucher nào, nạp sẵn mã chào mừng
    if (map.size === 0) {
      const defaultSaved = {
        id: 1,
        maVoucher: 'CTUT50K',
        phanTramGiam: 10,
        giamToiDa: 50000,
        donHangToiThieu: 150000,
        soLuongConLai: 500,
        moTa: 'Giảm 10% tối đa 50.000đ cho đơn hàng đa shop từ 150.000đ'
      };
      map.set('CTUT50K', defaultSaved);
    }

    return Array.from(map.values());
  },

  saveUserVoucher: async (voucher) => {
    let vObj = voucher;
    if (typeof voucher === 'string') {
      try {
        vObj = await marketplaceService.checkVoucher(voucher);
      } catch {
        vObj = {
          maVoucher: voucher.trim().toUpperCase(),
          phanTramGiam: 10,
          giamToiDa: 50000,
          donHangToiThieu: 150000,
          moTa: 'Ưu đãi đã lưu vào ví'
        };
      }
    }

    // Lưu vào user_saved_vouchers dưới dạng Object
    try {
      const currentList = await marketplaceService.getUserSavedVouchers();
      const nextList = [vObj, ...currentList.filter((v) => v.maVoucher !== vObj.maVoucher)];
      localStorage.setItem('user_saved_vouchers', JSON.stringify(nextList));

      const customer = authService.getCurrentCustomer();
      if (customer?.taiKhoan) {
        localStorage.setItem(`customer_vouchers_${customer.taiKhoan}`, JSON.stringify(nextList));
      }
      return vObj;
    } catch (e) {
      console.warn('Lỗi lưu voucher:', e);
      return vObj;
    }
  },

  removeUserSavedVoucher: async (code) => {
    const normalized = code.trim().toUpperCase();
    try {
      const currentList = await marketplaceService.getUserSavedVouchers();
      const nextList = currentList.filter((v) => v.maVoucher !== normalized);
      localStorage.setItem('user_saved_vouchers', JSON.stringify(nextList));

      const customer = authService.getCurrentCustomer();
      if (customer?.taiKhoan) {
        localStorage.setItem(`customer_vouchers_${customer.taiKhoan}`, JSON.stringify(nextList));
      }
      return nextList;
    } catch (e) {
      console.warn(e);
      return [];
    }
  },

  isVoucherSaved: (savedList, code) => {
    if (!savedList || !code) return false;
    return savedList.some((v) => (v.maVoucher || v) === code);
  },

  // Đặt hàng Đa Shop (Tách đơn tự động Order Splitting)
  checkoutMultiShop: async (payload) => {
    return await api.post('/orders/checkout-multishop', payload);
  },

  // Lấy lịch sử đơn hàng của User
  getUserOrders: async (userId = 101) => {
    try {
      const res = await api.get(`/orders/user/${userId}`);
      if (Array.isArray(res) && res.length > 0) return res;
    } catch (err) {
      console.warn(`Lỗi gọi /orders/user/${userId}:`, err?.message);
    }

    // Fallback lịch sử đơn hàng đã lưu trong localStorage
    try {
      const localOrders = JSON.parse(localStorage.getItem(`user_orders_${userId}`) || '[]');
      return localOrders;
    } catch {
      return [];
    }
  },

  // Hủy đơn hàng (Khi trạng thái PENDING)
  cancelOrder: async (orderId) => {
    return await api.put(`/orders/${orderId}/cancel`);
  },

  // Tạo thanh toán MoMo QR
  createPayment: async (data) => {
    return await api.post('/payments/create', data);
  },

  // Gửi xác thực thanh toán Crypto
  submitCryptoPayment: async (data) => {
    return await api.post('/payments/crypto/submit', data);
  },

  // Lấy đánh giá sản phẩm thật
  getReviews: async (maHangHoa) => {
    try {
      const res = await api.get(`/interactions/danh-gia/${maHangHoa}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn(`Lỗi gọi /interactions/danh-gia/${maHangHoa}:`, err?.message);
      return [];
    }
  },

  // Gửi đánh giá mới thật
  createReview: async (reviewData) => {
    return await api.post('/interactions/danh-gia', reviewData);
  },

  // Lấy bình luận thật
  getComments: async (maHangHoa) => {
    try {
      const res = await api.get(`/interactions/binh-luan/${maHangHoa}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn(`Lỗi gọi /interactions/binh-luan/${maHangHoa}:`, err?.message);
      return [];
    }
  },

  // Gửi bình luận mới thật
  createComment: async (commentData) => {
    return await api.post('/interactions/binh-luan', commentData);
  },

  // Cập nhật thông tin cá nhân khách hàng
  updateUserProfile: async (userId, profileData) => {
    try {
      return await api.put(`/auth/users/${userId}`, profileData);
    } catch (err) {
      console.warn('Backend update profile fallback:', err?.message);
      return { success: true };
    }
  },

  // Đổi mật khẩu tài khoản
  changePassword: async (taiKhoan, passwordData) => {
    return await api.put(`/auth/change-password/${taiKhoan}`, passwordData);
  },

  // ==================== DÀNH CHO CHỦ CỬA HÀNG (SELLER PORTAL) ====================

  // Đăng ký Gian Hàng mới & Khởi tạo Kho Riêng cho Cửa Hàng
  createStore: async (storeData) => {
    // storeData: { maKho, tenKho, diaChi, soDienThoai, email, sucChuaToiDa, moTaGianHang, anhDaiDienShop, loaiHinh: 'KHO_CUA_HANG', quanLyId }
    try {
      const res = await api.post('/stores', storeData);
      return res;
    } catch (err) {
      console.warn('Backend create store fallback:', err?.message);
      return {
        id: Date.now(),
        ...storeData,
        ngayTao: new Date().toISOString()
      };
    }
  },

  // Lấy toàn bộ hàng tồn kho của Shop (bao gồm cả hàng đang bán và hàng chưa đăng bán)
  getSellerInventory: async (storeId) => {
    try {
      const res = await api.get(`/inventory/store/${storeId}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn(`Lỗi gọi /inventory/store/${storeId}:`, err?.message);
      return [];
    }
  },

  // Lấy Master Catalog danh mục sản phẩm chuẩn hệ thống để chọn nhập hàng
  getMasterProducts: async () => {
    try {
      const res = await api.get('/products');
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn('Lỗi gọi /products:', err?.message);
      return [];
    }
  },

  // Lấy danh sách Kho Tổng Trung Tâm cung ứng hàng hóa
  getCentralWarehouses: async () => {
    try {
      const res = await api.get('/warehouses');
      if (Array.isArray(res)) {
        const centrals = res.filter((w) => w.loaiHinh === 'KHO_TONG' || w.loaiHinh !== 'KHO_CUA_HANG');
        return centrals.length > 0 ? centrals : res;
      }
      return [];
    } catch (err) {
      console.warn('Lỗi gọi /warehouses:', err?.message);
      return [];
    }
  },

  // Nhập hàng vào kho của Cửa hàng sau khi đã ký Hợp đồng
  importStockToStore: async (importItem) => {
    // importItem: { sanPhamId, khoHangId, soLuong }
    return await api.post('/inventory/add', importItem);
  },

  // Lấy danh sách hợp đồng cung ứng đã ký của Shop
  getStoreContracts: async (storeId) => {
    return getLocalContracts(storeId);
  },

  // Lưu hợp đồng cung ứng điện tử sau khi ký số
  saveStoreContract: async (storeId, contractData) => {
    return saveLocalContract(storeId, contractData);
  },

  // Chủ shop BẬT / TẮT đăng bán sản phẩm lên Sàn TMĐT và định giá bán lẻ
  publishProductToMarketplace: async (inventoryId, publishData) => {
    return await api.put(`/inventory/${inventoryId}/publish`, publishData);
  },

  // Lấy danh sách toàn bộ đơn hàng thuộc quyền quản lý của Gian hàng
  getStoreOrders: async (storeId) => {
    try {
      const res = await api.get(`/orders/store/${storeId}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn(`Lỗi gọi /orders/store/${storeId}:`, err?.message);
      return [];
    }
  },

  // Chủ shop cập nhật trạng thái đơn hàng (CONFIRMED, SHIPPED, COMPLETED, CANCELLED)
  updateStoreOrderStatus: async (orderId, status) => {
    return await api.put(`/orders/${orderId}/status?status=${status}`);
  },

  // Chủ shop cập nhật trạng thái vận chuyển và Đơn vị giao vận
  updateShippingStatus: async (orderId, shippingStatus, donViVanChuyen) => {
    let url = `/orders/${orderId}/shipping-status?shippingStatus=${shippingStatus}`;
    if (donViVanChuyen) {
      url += `&donViVanChuyen=${encodeURIComponent(donViVanChuyen)}`;
    }
    return await api.put(url);
  },

  // Chủ shop tạo Voucher khuyến mãi riêng cho Gian hàng của mình
  createStoreVoucher: async (voucherData) => {
    const storeId = voucherData.cuaHangId;
    const localKey = `store_vouchers_${storeId}`;
    try {
      const res = await api.post('/vouchers', voucherData);
      const current = JSON.parse(localStorage.getItem(localKey) || '[]');
      localStorage.setItem(localKey, JSON.stringify([res, ...current]));
      return res;
    } catch (err) {
      const fallbackVc = { ...voucherData, id: Date.now() };
      const current = JSON.parse(localStorage.getItem(localKey) || '[]');
      localStorage.setItem(localKey, JSON.stringify([fallbackVc, ...current]));
      return fallbackVc;
    }
  },

  // Chủ shop gỡ bỏ Voucher khỏi gian hàng
  deleteStoreVoucher: async (storeId, maVoucher) => {
    const localKey = `store_vouchers_${storeId}`;
    try {
      const current = JSON.parse(localStorage.getItem(localKey) || '[]');
      const filtered = current.filter((v) => v.maVoucher !== maVoucher);
      localStorage.setItem(localKey, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.warn(e);
      return false;
    }
  },

  // Cập nhật thông tin Gian hàng
  updateStoreProfile: async (storeId, storeData) => {
    return await api.put(`/stores/${storeId}`, storeData);
  },
};
