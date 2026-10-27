// src/services/orderService.js
import api from './api';

export const orderService = {
  // Lấy toàn bộ đơn hàng
  getAllOrders: async () => {
    return await api.get('/orders');
  },

  // Lấy danh sách đơn hàng được tách riêng cho từng Shop (Kênh Người Bán)
  getOrdersByStore: async (storeId) => {
    return await api.get(`/orders/store/${storeId}`);
  },

  // Tra cứu theo phiên thanh toán gộp
  getOrdersByCheckoutSession: async (sessionId) => {
    return await api.get(`/orders/checkout-session/${sessionId}`);
  },

  // Lấy chi tiết đơn hàng theo mã đơn (DH-XXXX)
  getOrderByCode: async (maDonHang) => {
    return await api.get(`/orders/${maDonHang}`);
  },

  // Lấy danh sách đơn hàng của một người dùng
  getOrdersByUser: async (userId) => {
    return await api.get(`/orders/user/${userId}`);
  },

  // Đặt đơn hàng đơn lẻ
  placeOrder: async (orderRequest) => {
    return await api.post('/orders', orderRequest);
  },

  // Đặt đơn hàng đa Shop (Tự động tách đơn Order Splitting chuẩn Shopee)
  checkoutMultiShop: async (data) => {
    return await api.post('/orders/checkout-multishop', data);
  },

  // Cập nhật trạng thái đơn hàng (PENDING, CONFIRMED, COMPLETED, CANCELLED)
  updateOrderStatus: async (orderId, status) => {
    return await api.put(`/orders/${orderId}/status?status=${encodeURIComponent(status)}`);
  },

  // Cập nhật trạng thái giao hàng (WAITING, PACKING, SHIPPING, DELIVERED)
  updateShippingStatus: async (orderId, shippingStatus, donViVanChuyen) => {
    let url = `/orders/${orderId}/shipping-status?shippingStatus=${encodeURIComponent(shippingStatus)}`;
    if (donViVanChuyen) {
      url += `&donViVanChuyen=${encodeURIComponent(donViVanChuyen)}`;
    }
    return await api.put(url);
  },

  // Hủy đơn hàng
  cancelOrder: async (orderId) => {
    return await api.put(`/orders/${orderId}/cancel`);
  },

  // Lấy danh sách mã giảm giá
  getVouchers: async () => {
    return await api.get('/vouchers');
  },

  // Lấy danh sách Voucher toàn sàn
  getGlobalVouchers: async () => {
    return await api.get('/vouchers/global');
  },

  // Lấy danh sách Voucher riêng của Shop
  getStoreVouchers: async (storeId) => {
    return await api.get(`/vouchers/store/${storeId}`);
  },

  // Tạo Voucher mới
  createVoucher: async (data) => {
    return await api.post('/vouchers', data);
  },

  // Kiểm tra mã giảm giá
  checkVoucher: async (maVoucher) => {
    return await api.get(`/vouchers/check/${maVoucher}`);
  },
};
