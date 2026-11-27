import React, { useState, useEffect, useMemo } from 'react';
import {
  FiArrowDownRight, FiArrowUpRight, FiDollarSign, FiDownload,
  FiSearch, FiFileText, FiCheckCircle, FiBox, FiShoppingBag
} from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { financeService } from '../services/financeService';
import './FinancialManagement.css';

const FinancialManagement = () => {
  const [period, setPeriod] = useState('ALL'); // 'ALL' | 'CURRENT' | 'PREVIOUS'
  const [summary, setSummary] = useState({
    income: 0,
    b2bIncome: 0,
    retailGmv: 0,
    expense: 0,
    profit: 0,
    profitMargin: 0,
    importCount: 0,
    b2bExportCount: 0,
    retailExportCount: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [flowFilter, setFlowFilter] = useState('ALL'); // 'ALL' | 'IN' | 'OUT' | 'GMV'
  const [isLoading, setIsLoading] = useState(true);

  const periodParams = useMemo(() => {
    const now = new Date();
    if (period === 'CURRENT') {
      return { month: now.getMonth() + 1, year: now.getFullYear() };
    }
    if (period === 'PREVIOUS') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { month: prev.getMonth() + 1, year: prev.getFullYear() };
    }
    return { month: undefined, year: undefined };
  }, [period]);

  useEffect(() => {
    const fetchFinanceData = async () => {
      setIsLoading(true);
      try {
        const [summaryData, chartResponse, txResponse] = await Promise.all([
          financeService.getSummary(periodParams.month, periodParams.year),
          financeService.getChartData(),
          financeService.getTransactions(25)
        ]);

        setSummary(summaryData || {});
        setChartData(Array.isArray(chartResponse) ? chartResponse : []);
        setTransactions(Array.isArray(txResponse) ? txResponse : []);
      } catch (error) {
        console.error('Không thể tải dữ liệu tài chính:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinanceData();
  }, [periodParams]);

  const filteredTransactions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchFlow = flowFilter === 'ALL' || t.type === flowFilter;
      const matchSearch =
        !q ||
        (t.maGiaoDich || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q);
      return matchFlow && matchSearch;
    });
  }, [transactions, searchTerm, flowFilter]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' ₫';
  };

  const handleExportCsv = () => {
    const rows = [
      ['Ma giao dich', 'Luong tien', 'Loai', 'So tien (VND)', 'Dien giai', 'Thoi gian'],
      ...filteredTransactions.map((t) => [
        t.maGiaoDich || '',
        t.streamLabel || t.type || '',
        t.type || '',
        t.amount ?? 0,
        (t.description || '').replace(/"/g, '""'),
        t.time || '',
      ]),
    ];
    const csv = '\uFEFF' + rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-tai-chinh-${period.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu tài chính...</div>;
  }

  const directB2bIncome = summary.b2bIncome ?? summary.income ?? 0;
  const shopRetailGmv = summary.retailGmv ?? 0;

  return (
    <div>
      {/* Tiêu đề & Công cụ điều khiển */}
      <div className="page-header">
        <div className="page-title">
          <h1>Quản Lý Tài Chính & Dòng Tiền (Phân Tách 2 Luồng)</h1>
          <p>
            Tách biệt <strong>Doanh thu trực tiếp Sàn/Kho Tổng (xuất B2B giá sỉ)</strong> và{' '}
            <strong>Tổng GMV các Shop (xuất bán lẻ cho khách cuối)</strong> để tránh trùng lặp dữ liệu.
          </p>
        </div>
        <div className="header-actions">
          <span className="report-label">KỲ BÁO CÁO</span>
          <select className="month-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="ALL">Toàn bộ thời gian</option>
            <option value="CURRENT">Tháng hiện tại</option>
            <option value="PREVIOUS">Tháng trước</option>
          </select>
          <button className="export-btn" onClick={handleExportCsv}>
            <FiDownload size={16} /> Xuất dữ liệu (CSV)
          </button>
        </div>
      </div>

      {/* 4 Thẻ thống kê tách bạch 2 luồng tiền */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-title">
              DOANH THU SÀN / KHO TỔNG
              <span className="sub">Xuất cung ứng B2B giá sỉ (Luồng 1)</span>
            </div>
            <div className="icon-box green"><FiArrowDownRight size={18} /></div>
          </div>
          <div className="stat-value in">+ {formatCurrency(directB2bIncome)}</div>
          <div className="stat-desc green-text">↗ Chỉ tính phiếu xuất cung ứng B2B đã hoàn thành</div>
          <div className="stat-desc" style={{ marginTop: '5px' }}>
            <FiCheckCircle size={12} /> {summary.b2bExportCount ?? summary.exportCount ?? 0} phiếu xuất B2B cho các Shop
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-title">
              CHI PHÍ NHẬP KHO TỔNG
              <span className="sub">Cash Outflow (Nhập NCC)</span>
            </div>
            <div className="icon-box red"><FiArrowUpRight size={18} /></div>
          </div>
          <div className="stat-value out">- {formatCurrency(summary.expense)}</div>
          <div className="stat-desc" style={{ color: '#d63031' }}>↳ Chi nhập hàng thương mại từ Nhà cung cấp</div>
          <div className="stat-desc" style={{ marginTop: '5px' }}>
            <FiBox size={12} /> {summary.importCount ?? 0} phiếu nhập đã nhập kho
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-title">
              LỢI NHUẬN RÒNG KHO TỔNG
              <span className="sub">Doanh thu B2B − Chi phí NCC</span>
            </div>
            <div className="icon-box orange"><FiDollarSign size={18} /></div>
          </div>
          <div className="stat-value profit">{formatCurrency(summary.profit)}</div>
          <div className="stat-desc" style={{ color: '#d63031' }}>% Tỷ suất lợi nhuận B2B: {summary.profitMargin ?? 0}%</div>
          <div className="stat-desc" style={{ marginTop: '5px' }}>
            <FiCheckCircle size={12} /> Không gộp doanh thu bán lẻ của Chủ shop
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-title">
              TỔNG GMV CÁC SHOP
              <span className="sub">Xuất bán lẻ khách cuối (Luồng 2 - Đối soát)</span>
            </div>
            <div className="icon-box blue"><FiShoppingBag size={18} /></div>
          </div>
          <div className="stat-value gmv">{formatCurrency(shopRetailGmv)}</div>
          <div className="stat-desc" style={{ color: '#0984e3' }}>⇄ Doanh thu thuộc về Chủ shop (làm cơ sở đối soát)</div>
          <div className="stat-desc" style={{ marginTop: '5px' }}>
            <FiCheckCircle size={12} /> {summary.retailExportCount ?? 0} phiếu xuất bán lẻ đã hoàn thành
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="chart-container">
        <div className="chart-header">
          <div className="chart-title">
            <h3>Biểu Đồ Dòng Tiền 6 Tháng Gần Nhất (Đơn vị: Triệu đồng)</h3>
            <div className="chart-legend">
              <div className="legend-item"><span className="dot green"></span> Thu trực tiếp Kho Tổng (B2B)</div>
              <div className="legend-item"><span className="dot red"></span> Chi nhập hàng (NCC)</div>
              <div className="legend-item"><span className="dot blue"></span> GMV bán lẻ Shop (Đối soát)</div>
            </div>
          </div>
          <div className="chart-tabs">
            <button className="chart-tab active">6 tháng gần nhất</button>
          </div>
        </div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b894" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00b894" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d63031" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d63031" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0984e3" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0984e3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(value) => `${value} Tr`} />
              <Tooltip />
              <Area type="monotone" name="Thu Kho Tổng (B2B)" dataKey="income" stroke="#00b894" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" name="Chi Nhập NCC" dataKey="expense" stroke="#d63031" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              <Area type="monotone" name="GMV Shop (Đối soát)" dataKey="gmv" stroke="#0984e3" strokeWidth={2} fillOpacity={1} fill="url(#colorGmv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="table-wrapper">
        <div className="table-header-flex">
          <div>
            <h3>Nhật Ký Giao Dịch Gần Đây</h3>
            <p>Phân biệt rõ chứng từ B2B Kho Tổng, chi nhập NCC và đơn bán lẻ GMV của Shop</p>
          </div>
          <div className="table-controls">
            <select
              className="month-select"
              value={flowFilter}
              onChange={(e) => setFlowFilter(e.target.value)}
            >
              <option value="ALL">Tất cả luồng tiền</option>
              <option value="IN">Thu Kho Tổng (B2B)</option>
              <option value="OUT">Chi Nhập NCC</option>
              <option value="GMV">GMV Shop (Đối soát)</option>
            </select>
            <div className="search-box">
              <FiSearch className="search-icon" size={14} />
              <input
                type="text"
                placeholder="Tìm mã giao dịch, shop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Mã giao dịch</th>
              <th>Luồng tiền</th>
              <th>Số tiền & Nội dung diễn giải</th>
              <th>Thời gian</th>
              <th>Chứng từ</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t, idx) => (
                <tr key={`${t.maGiaoDich || 'tx'}-${idx}`}>
                  <td style={{ color: '#0f172a', fontWeight: 'bold' }}>{t.maGiaoDich}</td>
                  <td>
                    {t.type === 'IN' && <span className="badge in">↓ Thu Kho Tổng (B2B)</span>}
                    {t.type === 'OUT' && <span className="badge out">↑ Chi Nhập NCC</span>}
                    {t.type === 'GMV' && <span className="badge gmv">⇄ GMV Shop (Đối soát)</span>}
                  </td>
                  <td>
                    <div className={t.type === 'IN' ? 'val-in' : t.type === 'GMV' ? 'val-gmv' : 'val-out'}>
                      {t.type === 'IN' ? '+ ' : t.type === 'GMV' ? '' : '- '}
                      {formatCurrency(t.amount)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{t.description}</div>
                  </td>
                  <td style={{ fontSize: '12px' }}>{t.time}</td>
                  <td><button className="action-btn" title={t.streamLabel || ''}><FiFileText size={18} /></button></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                  Không có giao dịch nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="pagination">
          <span>Hiển thị <strong>{filteredTransactions.length}</strong> giao dịch gần nhất</span>
        </div>
      </div>
    </div>
  );
};

export default FinancialManagement;
