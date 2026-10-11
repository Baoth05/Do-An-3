// src/utils/formatters.js

/**
 * Định dạng số thành tiền tệ VNĐ (Ví dụ: 1200000 -> 1.200.000 đ)
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Định dạng chuỗi Ngày giờ (Ví dụ: 2026-10-08T15:30:00 -> 08/10/2026 15:30)
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};