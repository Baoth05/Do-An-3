// src/utils/constants.js

// URL của API Gateway (Chạy ở cổng 8080)
export const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

// Trạng thái phiếu nhập/xuất kho
export const NOTE_STATUS = {
  CHO_DUYET: 'CHO_DUYET',
  HOAN_THANH: 'HOAN_THANH',
  DA_HUY: 'DA_HUY',
};

// Loại giao dịch thẻ kho
export const TRANSACTION_TYPE = {
  IMPORT: 'NHAP_KHO',
  EXPORT: 'XUAT_KHO',
};