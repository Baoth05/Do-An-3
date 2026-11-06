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
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn('Lỗi gọi /vouchers/global:', err?.message);
      return [];
    }
  },

  // Lấy Voucher riêng của từng Shop
  getStoreVouchers: async (storeId) => {
    try {
      const res = await api.get(`/vouchers/store/${storeId}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn(`Lỗi gọi /vouchers/store/${storeId}:`, err?.message);
      return [];
    }
  },

  // Kiểm tra mã voucher hợp lệ
  checkVoucher: async (code) => {
    return await api.get(`/vouchers/check/${code}`);
  },

  // Đặt hàng Đa Shop (Tách đơn tự động Order Splitting)
  checkoutMultiShop: async (payload) => {
    return await api.post('/orders/checkout-multishop', payload);
  },

  // Lấy lịch sử đơn hàng của User
  getUserOrders: async (userId = 101) => {
    try {
      const res = await api.get(`/orders/user/${userId}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn(`Lỗi gọi /orders/user/${userId}:`, err?.message);
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

  // ==================== DÀNH CHO CHỦ CỬA HÀNG (SELLER PORTAL) ====================

  // Đăng ký Gian Hàng mới & Khởi tạo Kho Riêng cho Cửa Hàng
  createStore: async (storeData) => {
    // storeData: { maKho, tenKho, diaChi, soDienThoai, email, sucChuaToiDa, moTaGianHang, anhDaiDienShop, loaiHinh: 'KHO_CUA_HANG' }
    return await api.post('/stores', storeData);
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
        // Lọc các kho là KHO_TONG hoặc có sẵn
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
    return await api.post('/vouchers', voucherData);
  },

  // Cập nhật thông tin Gian hàng
  updateStoreProfile: async (storeId, storeData) => {
    return await api.put(`/stores/${storeId}`, storeData);
  },
};
