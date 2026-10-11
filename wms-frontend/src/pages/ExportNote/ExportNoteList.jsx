import React, { useState } from 'react';
import { FiSearch, FiPlus, FiEye, FiTruck } from 'react-icons/fi';
import './ExportNoteList.css';

const ExportNoteList = () => {
  const [exportNotes] = useState([
    { id: 1, maPhieu: 'PX-2610-089', donHangRef: 'ORD-902', ngayXuat: '10/10/2026', dvvc: 'Giao Hàng Tiết Kiệm', trangThai: 'DA_XUAT' },
    { id: 2, maPhieu: 'PX-2610-090', donHangRef: 'ORD-905', ngayXuat: '12/10/2026', dvvc: 'Viettel Post', trangThai: 'DANG_DONG_GOI' },
  ]);

  return (
    <div className="export-container">
      <div className="export-header">
        <div>
          <h2>Quản Lý Phiếu Xuất Kho</h2>
          <p>Theo dõi tiến trình xuất hàng theo đơn hàng thương mại điện tử</p>
        </div>
        <button className="btn-primary">
          <FiPlus size={16} /> Tạo Phiếu Xuất
        </button>
      </div>

      <div className="export-table-wrapper">
        <table className="wms-data-table">
          <thead>
            <tr>
              <th>Mã Phiếu Xuất</th>
              <th>Mã Đơn Hàng (Ref)</th>
              <th>Ngày Xuất</th>
              <th>Đơn Vị Vận Chuyển</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {exportNotes.map((note) => (
              <tr key={note.id}>
                <td className="font-mono">{note.maPhieu}</td>
                <td className="text-bold">{note.donHangRef}</td>
                <td>{note.ngayXuat}</td>
                <td><FiTruck className="text-muted"/> {note.dvvc}</td>
                <td>
                  {note.trangThai === 'DA_XUAT' ? 
                    <span className="badge safe">Đã xuất kho</span> : 
                    <span className="badge warning">Đang đóng gói</span>}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon text-blue" title="Xem chi tiết"><FiEye /></button>
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

export default ExportNoteList;