// src/services/paymentService.js
import api from './api';

export const paymentService = {
  // Tạo giao dịch thanh toán MoMo (nhận paymentUrl, qrCodeUrl, deeplink)
  createPayment: (data) => api.post('/payments/create', data),

  // Kiểm tra trạng thái thanh toán theo mã đơn hàng
  getPaymentStatus: (donHangId) => api.get(`/payments/status/${donHangId}`),

  // Quản trị viên xác nhận đã nhận tiền MoMo thủ công
  confirmManualPayment: (donHangId, transId, ghiChu) => {
    let url = `/payments/confirm-manual/${donHangId}`;
    const params = [];
    if (transId) params.push(`transId=${transId}`);
    if (ghiChu) params.push(`ghiChu=${encodeURIComponent(ghiChu)}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return api.post(url);
  },

  // Mock thanh toán thành công (phục vụ Demo / Test)
  mockSuccess: (momoOrderId) => api.post(`/payments/mock-success/${momoOrderId}`),
  mockSuccessOrder: (donHangId) => api.post(`/payments/mock-success-order/${donHangId}`),

  // Web3 / Crypto: Gửi TxHash xác nhận thanh toán On-chain
  submitCryptoPayment: (data) => api.post('/payments/crypto/submit', data),
  getCryptoBySession: (sessionId) => api.get(`/payments/crypto/session/${sessionId}`),
};

