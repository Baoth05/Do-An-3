// src/services/wmsCoreService.js
import api from './api';

export const wmsCoreService = {
  // === HÀNG HÓA (HANG_HOA) ===
  getProducts: () => api.get('/wms/products'),
  createProduct: (data) => api.post('/wms/products', data),
  updateProduct: (id, data) => api.put(`/wms/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/wms/products/${id}`),

  // === TỒN KHO & THẺ KHO (THE_KHO) ===
  getInventoryStock: () => api.get('/wms/inventory/stock'),
  getStockCardHistory: (productId) => api.get(`/wms/inventory/stock-card/${productId}`),

  // === PHIẾU NHẬP KHO (PHIEU_NHAP) ===
  getImportNotes: () => api.get('/wms/import-notes'),
  createImportNote: (data) => api.post('/wms/import-notes', data),

  // === PHIẾU XUẤT KHO (PHIEU_XUAT) ===
  getExportNotes: () => api.get('/wms/export-notes'),
  createExportNote: (data) => api.post('/wms/export-notes', data),

  // === NHÀ CUNG CẤP & VẬN CHUYỂN ===
  getSuppliers: () => api.get('/wms/suppliers'),
  getShippers: () => api.get('/wms/shippers'),
};