import React, { useState } from 'react';
import { FiSearch, FiFilter, FiList, FiAlertCircle } from 'react-icons/fi';
import './InventoryStock.css';

const InventoryStock = () => {
  // Dữ liệu mô phỏng theo cấu trúc bảng HANG_HOA trong Database
  const [products] = useState([
    { id: 1, maHang: 'HH-001', tenHang: 'Bàn phím cơ AKKO 3098', donViTinh: 'Cái', tonKhoThucTe: 150, soLuongCanhBao: 20 },
    { id: 2, maHang: 'HH-002', tenHang: 'Chuột Logitech G102', donViTinh: 'Cái', tonKhoThucTe: 15, soLuongCanhBao: 30 }, // Mức tồn kho < Cảnh báo
    { id: 3, maHang: 'HH-003', tenHang: 'Màn hình Dell Ultrasharp 24', donViTinh: 'Cái', tonKhoThucTe: 5, soLuongCanhBao: 10 }, // Mức tồn kho < Cảnh báo
    { id: 4, maHang: 'HH-004', tenHang: 'Tai nghe HyperX Cloud II', donViTinh: 'Cái', tonKhoThucTe: 80, soLuongCanhBao: 15 },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  // Hàm lọc dữ liệu dựa trên từ khóa tìm kiếm
  const filteredProducts = products.filter(product => 
    product.tenHang.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.maHang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="inventory-stock-container">
      <div className="inventory-header">
        <div>
          <h2>Quản Lý Tồn Kho</h2>
          <p>Theo dõi số lượng hàng hóa thực tế và cảnh báo bổ sung</p>
        </div>
      </div>

      <div className="inventory-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo mã hoặc tên hàng hóa..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-filter">
          <FiFilter /> Lọc Dữ Liệu
        </button>
      </div>

      <div className="inventory-table-wrapper">
        <table className="wms-data-table">
          <thead>
            <tr>
              <th>Mã Hàng</th>
              <th>Tên Hàng Hóa</th>
              <th>Đơn Vị</th>
              <th>Tồn Kho Thực Tế</th>
              <th>Mức Cảnh Báo</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((item) => {
              // Kiểm tra xem hàng hóa có cần cảnh báo không
              const isWarning = item.tonKhoThucTe <= item.soLuongCanhBao;

              return (
                <tr key={item.id} className={isWarning ? 'row-warning' : ''}>
                  <td className="font-mono">{item.maHang}</td>
                  <td className="text-bold">{item.tenHang}</td>
                  <td>{item.donViTinh}</td>
                  <td className={`stock-level ${isWarning ? 'text-red' : 'text-green'}`}>
                    {item.tonKhoThucTe}
                  </td>
                  <td className="text-muted">{item.soLuongCanhBao}</td>
                  <td>
                    {isWarning ? (
                      <span className="badge warning"><FiAlertCircle /> Cần nhập thêm</span>
                    ) : (
                      <span className="badge safe">Đủ hàng</span>
                    )}
                  </td>
                  <td>
                    <button className="btn-action" title="Xem Thẻ Kho">
                      <FiList /> Thẻ Kho
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center">Không tìm thấy hàng hóa nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryStock;