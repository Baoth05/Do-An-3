// src/services/orderService.js
import api from './api';

export const orderService = {
  // Lấy toàn bộ đơn hàng (Dành cho Thủ kho / Quản lý)
  getAllOrders: async () => {
    return await api.get('/orders');
  },

  // Lấy chi tiết đơn hàng theo mã đơn (DH-XXXX)
  getOrderByCode: async (maDonHang) => {
    return await api.get(`/orders/${maDonHang}`);
  },

  // Lấy danh sách đơn hàng của một người dùng
  getOrdersByUser: async (userId) => {
    return await api.get(`/orders/user/${userId}`);
  },

  // Đặt đơn hàng mới
  placeOrder: async (orderRequest) => {
    return await api.post('/orders', orderRequest);
  },

  // Cập nhật trạng thái đơn hàng (ĐÃ XÁC NHẬN, ĐANG GIAO, HOÀN THÀNH, ĐÃ HỦY)
  updateOrderStatus: async (orderId, status) => {
    return await api.put(`/orders/${orderId}/status?status=${encodeURIComponent(status)}`);
  },

  // Hủy đơn hàng
  cancelOrder: async (orderId) => {
    return await api.put(`/orders/${orderId}/cancel`);
  },

  // Lấy danh sách mã giảm giá khả dụng
  getVouchers: async () => {
    return await api.get('/vouchers');
  },

  // Kiểm tra mã giảm giá
  checkVoucher: async (maVoucher) => {
    return await api.get(`/vouchers/check/${maVoucher}`);
  },
};

