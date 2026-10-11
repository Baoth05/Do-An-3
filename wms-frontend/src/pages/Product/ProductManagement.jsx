import React, { useState } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiBox, FiFilter } from 'react-icons/fi';
import './ProductManagement.css';

const ProductManagement = () => {
  // Dữ liệu mô phỏng Hàng hóa
  const [products] = useState([
    { id: 1, maHang: 'HH-001', tenHang: 'Bàn phím cơ AKKO 3098', danhMuc: 'Bàn phím', donVi: 'Cái', giaNhap: '1,200,000', giaBan: '1,500,000', trangThai: 'DANG_BAN' },
    { id: 2, maHang: 'HH-002', tenHang: 'Chuột Logitech G102', danhMuc: 'Chuột', donVi: 'Cái', giaNhap: '350,000', giaBan: '450,000', trangThai: 'DANG_BAN' },
    { id: 3, maHang: 'HH-003', tenHang: 'Màn hình Dell Ultrasharp 24', danhMuc: 'Màn hình', donVi: 'Cái', giaNhap: '4,500,000', giaBan: '5,200,000', trangThai: 'DANG_BAN' },
    { id: 4, maHang: 'HH-004', tenHang: 'Tai nghe cũ hỏng', danhMuc: 'Tai nghe', donVi: 'Cái', giaNhap: '200,000', giaBan: '300,000', trangThai: 'NGUNG_KINH_DOANH' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  // Lọc dữ liệu theo tên hoặc mã
  const filteredProducts = products.filter(p => 
    p.tenHang.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.maHang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="product-container">
      <div className="product-header">
        <div>
          <h2>Quản Lý Hàng Hóa</h2>
          <p>Danh mục vật tư, linh kiện và sản phẩm trong hệ thống</p>
        </div>
        <button className="btn-primary">
          <FiPlus size={16} /> Thêm Hàng Hóa
        </button>
      </div>

      <div className="product-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo mã hoặc tên hàng..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-filter">
          <FiFilter /> Lọc Danh Mục
        </button>
      </div>

      <div className="product-table-wrapper">
        <table className="wms-data-table">
          <thead>
            <tr>
              <th>Mã Hàng</th>
              <th>Tên Sản Phẩm</th>
              <th>Danh Mục</th>
              <th>Đơn Vị</th>
              <th>Giá Nhập (đ)</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((item) => (
              <tr key={item.id}>
                <td className="font-mono">
                  <div className="product-code-cell">
                    <FiBox className="text-muted" /> {item.maHang}
                  </div>
                </td>
                <td className="text-bold">{item.tenHang}</td>
                <td><span className="category-tag">{item.danhMuc}</span></td>
                <td>{item.donVi}</td>
                <td>{item.giaNhap}</td>
                <td>
                  {item.trangThai === 'DANG_BAN' ? (
                    <span className="badge safe">Đang kinh doanh</span>
                  ) : (
                    <span className="badge warning">Ngừng kinh doanh</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon text-blue" title="Sửa"><FiEdit2 /></button>
                    <button className="btn-icon text-red" title="Xóa"><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
            
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center">Không tìm thấy sản phẩm nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductManagement;