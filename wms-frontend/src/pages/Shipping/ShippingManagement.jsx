import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiTruck } from 'react-icons/fi';
import './ShippingManagement.css';

const ShippingManagement = () => {
  const [shippers] = useState([
    { id: 1, maDV: 'DV-GHTK', tenDV: 'Giao Hàng Tiết Kiệm', hotline: '1900 6092', trangThai: 'HOAT_DONG' },
    { id: 2, maDV: 'DV-VTP', tenDV: 'Viettel Post', hotline: '1900 8095', trangThai: 'HOAT_DONG' },
  ]);

  return (
    <div className="shipping-container">
      <div className="shipping-header">
        <div>
          <h2>Đơn Vị Vận Chuyển</h2>
          <p>Quản lý các đối tác giao nhận hàng hóa</p>
        </div>
        <button className="btn-primary">
          <FiPlus size={16} /> Thêm ĐVVC
        </button>
      </div>

      <div className="shipping-table-wrapper">
        <table className="wms-data-table">
          <thead>
            <tr>
              <th>Mã ĐVVC</th>
              <th>Tên Đơn Vị</th>
              <th>Hotline</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {shippers.map((shipper) => (
              <tr key={shipper.id}>
                <td className="font-mono">{shipper.maDV}</td>
                <td className="text-bold"><FiTruck className="text-muted"/> {shipper.tenDV}</td>
                <td>{shipper.hotline}</td>
                <td><span className="badge safe">Đang hợp tác</span></td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon text-blue"><FiEdit2 /></button>
                    <button className="btn-icon text-red"><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShippingManagement;