import React, { useState } from 'react';
import { FiSearch, FiPlus, FiEye, FiDownload } from 'react-icons/fi';
import './ImportNoteList.css';

const ImportNoteList = () => {
  const [importNotes] = useState([
    { id: 1, maPhieu: 'PN-2610-001', nhaCungCap: 'Công ty TNHH Logitech VN', ngayNhap: '10/10/2026', tongTien: '85,000,000', trangThai: 'HOAN_THANH' },
    { id: 2, maPhieu: 'PN-2610-002', nhaCungCap: 'Đại lý phân phối AKKO', ngayNhap: '11/10/2026', tongTien: '42,500,000', trangThai: 'CHO_DUYET' },
  ]);

  return (
    <div className="import-container">
      <div className="import-header">
        <div>
          <h2>Quản Lý Phiếu Nhập Kho</h2>
          <p>Danh sách các chứng từ nhập hàng từ nhà cung cấp</p>
        </div>
        <button className="btn-primary">
          <FiPlus size={16} /> Tạo Phiếu Nhập
        </button>
      </div>

      <div className="import-table-wrapper">
        <table className="wms-data-table">
          <thead>
            <tr>
              <th>Mã Phiếu</th>
              <th>Nhà Cung Cấp</th>
              <th>Ngày Nhập</th>
              <th>Tổng Tiền (đ)</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {importNotes.map((note) => (
              <tr key={note.id}>
                <td className="font-mono">{note.maPhieu}</td>
                <td className="text-bold">{note.nhaCungCap}</td>
                <td>{note.ngayNhap}</td>
                <td>{note.tongTien}</td>
                <td>
                  {note.trangThai === 'HOAN_THANH' ? 
                    <span className="badge safe">Đã nhập kho</span> : 
                    <span className="badge warning">Chờ duyệt</span>}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon text-blue" title="Xem chi tiết"><FiEye /></button>
                    <button className="btn-icon text-muted" title="Tải phiếu"><FiDownload /></button>
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

export default ImportNoteList;