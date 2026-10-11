import React, { useState } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi';
import './SupplierManagement.css';

const SupplierManagement = () => {
  // Dữ liệu mô phỏng danh sách nhà cung cấp
  const [suppliers] = useState([
    { id: 1, maNCC: 'NCC-001', tenNCC: 'Công ty TNHH Logitech VN', sdt: '0901234567', email: 'contact@logitech.vn', trangThai: 'HOAT_DONG' },
    { id: 2, maNCC: 'NCC-002', tenNCC: 'Đại lý phân phối AKKO', sdt: '0912345678', email: 'sales@akko.vn', trangThai: 'HOAT_DONG' },
    { id: 3, maNCC: 'NCC-003', tenNCC: 'Công ty Cổ phần Dell', sdt: '0923456789', email: 'info@dell.com.vn', trangThai: 'NGUNG_CUNG_CAP' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  // Lọc dữ liệu theo tên hoặc mã nhà cung cấp
  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.tenNCC.toLowerCase().includes(searchTerm.toLowerCase()) || 
    supplier.maNCC.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="supplier-container">
      <div className="supplier-header">
        <div>
          <h2>Quản Lý Nhà Cung Cấp</h2>
          <p>Danh sách các đối tác cung cấp hàng hóa cho hệ thống kho</p>
        </div>
        <button className="btn-primary">
          <FiPlus size={16} /> Thêm Nhà Cung Cấp
        </button>
      </div>

      <div className="supplier-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo mã hoặc tên nhà cung cấp..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="supplier-table-wrapper">
        <table className="wms-data-table">
          <thead>
            <tr>
              <th>Mã NCC</th>
              <th>Tên Nhà Cung Cấp</th>
              <th>Số Điện Thoại</th>
              <th>Email</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td className="font-mono">{supplier.maNCC}</td>
                <td className="text-bold">{supplier.tenNCC}</td>
                <td>{supplier.sdt}</td>
                <td>{supplier.email}</td>
                <td>
                  {supplier.trangThai === 'HOAT_DONG' ? (
                    <span className="badge safe"><FiUserCheck /> Hoạt động</span>
                  ) : (
                    <span className="badge warning"><FiUserX /> Ngưng cung cấp</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon text-blue" title="Chỉnh sửa"><FiEdit2 /></button>
                    <button className="btn-icon text-red" title="Xóa"><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
            
            {filteredSuppliers.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center">Không tìm thấy nhà cung cấp nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierManagement;