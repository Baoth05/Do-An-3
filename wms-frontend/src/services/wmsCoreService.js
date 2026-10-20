// src/services/wmsCoreService.js
import api from './api';

export const wmsCoreService = {
  // === HÀNG HÓA (HANG_HOA) ===
  getProducts: () => api.get('/wms/products'),
  getProductById: (id) => api.get(`/wms/products/${id}`),
  createProduct: (data) => api.post('/wms/products', data),
  updateProduct: (id, data) => api.put(`/wms/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/wms/products/${id}`),

  // === DANH MỤC & KHO HÀNG ===
  getCategories: () => api.get('/wms/categories'),
  getWarehouses: () => api.get('/wms/warehouses'),

  // === TỒN KHO & ĐIỀU CHỈNH TỒN KHO ===
  getAllInventory: () => api.get('/wms/inventory'),
  getInventoryStock: () => api.get('/wms/inventory'),
  addStock: (data) => api.post('/wms/inventory/add', data),

  // === PHIẾU NHẬP KHO (PHIEU_NHAP) ===
  getImportNotes: () => api.get('/wms/import-notes'),
  createImportNote: (data) => api.post('/wms/import-notes', data),

  // === PHIẾU XUẤT KHO (PHIEU_XUAT) ===
  getExportNotes: () => api.get('/wms/export-notes'),
  createExportNote: (data) => api.post('/wms/export-notes', data),

  // === NHÀ CUNG CẤP & VẬN CHUYỂN ===
  getSuppliers: () => api.get('/wms/suppliers'),
  getSupplierById: (id) => api.get(`/wms/suppliers/${id}`),
  createSupplier: (data) => api.post('/wms/suppliers', data),
  updateSupplier: (id, data) => api.put(`/wms/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/wms/suppliers/${id}`),
  getShippers: () => api.get('/wms/shippers'),
  getShipperById: (id) => api.get(`/wms/shippers/${id}`),
  createShipper: (data) => api.post('/wms/shippers', data),
  updateShipper: (id, data) => api.put(`/wms/shippers/${id}`, data),
  deleteShipper: (id) => api.delete(`/wms/shippers/${id}`),
};