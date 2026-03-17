'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import { useSales, useCashflowSummary, useCashflowEvents } from '@/hooks/useSales';
import AddSaleModal from '@/components/AddSaleModal';
import SaleDetailModal from '@/components/SaleDetailModal';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

type Tab = 'sales' | 'cashflow';

export default function SalesPage() {
  const [tab, setTab] = useState<Tab>('sales');
  const [showAddSale, setShowAddSale] = useState(false);
  const [viewSaleId, setViewSaleId] = useState<string | null>(null);
  const [salesSearch, setSalesSearch] = useState('');
  const { data: sales = [], isLoading: salesLoading } = useSales();
  const { data: cashflowSummary } = useCashflowSummary();
  const { data: cashflowEvents = [] } = useCashflowEvents();

  const filteredSales = salesSearch
    ? sales.filter((s) =>
        s.id.toLowerCase().includes(salesSearch.toLowerCase()) ||
        (s.customer?.fullName ?? '').toLowerCase().includes(salesSearch.toLowerCase())
      )
    : sales;

  const cashflowPoints = (cashflowEvents as unknown as { eventDate: string; amount: number; direction: string }[])
    .reduce((acc: { date: string; inflow: number; outflow: number }[], ev) => {
      const d = new Date(ev.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = acc.find((p) => p.date === d);
      if (existing) {
        if (ev.direction === 'inflow') existing.inflow += ev.amount;
        else existing.outflow += ev.amount;
      } else {
        acc.push({ date: d, inflow: ev.direction === 'inflow' ? ev.amount : 0, outflow: ev.direction === 'outflow' ? ev.amount : 0 });
      }
      return acc;
    }, []);

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Sales & Finances" subtitle="Sales and cashflow overview" />

      {/* Modals */}
      <AddSaleModal open={showAddSale} onClose={() => setShowAddSale(false)} />
      <SaleDetailModal saleId={viewSaleId} onClose={() => setViewSaleId(null)} />

      <main className="flex-1 p-6 space-y-5 overflow-y-auto">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-100">
          {(['sales', 'cashflow'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'pb-3 px-1 mr-4 text-sm capitalize transition-colors border-b-2 -mb-px',
                tab === t
                  ? 'border-indigo-500 text-indigo-600 font-medium'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Sales Tab */}
        {tab === 'sales' && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 w-64">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sales..."
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  className="text-sm outline-none bg-transparent w-full placeholder-slate-400"
                />
              </div>
              <button
                onClick={() => setShowAddSale(true)}
                className="flex items-center gap-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-2 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> New Sale
              </button>
            </div>

            {/* Sales Analytics Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Category-wise Sales Breakdown */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Sales by Product Category</h3>
                <p className="text-xs text-slate-400 mb-4">Revenue distribution across categories</p>
                {(() => {
                  const categoryRevenue: Record<string, number> = {};
                  sales.forEach((sale) => {
                    if (Array.isArray(sale.items)) {
                      (sale.items as { product?: { category?: { name?: string } }; totalPrice?: number }[]).forEach((item) => {
                        const category = item.product?.category?.name ?? 'Uncategorized';
                        const price = Number(item.totalPrice ?? 0);
                        categoryRevenue[category] = (categoryRevenue[category] || 0) + price;
                      });
                    }
                  });
                  const chartData = Object.entries(categoryRevenue)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value);
                  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#84cc16'];
                  
                  return chartData.length === 0 ? (
                    <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={COLORS[chartData.indexOf(entry) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>

              {/* Top Selling Products */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Top Selling Products</h3>
                <p className="text-xs text-slate-400 mb-4">By quantity sold</p>
                {(() => {
                  const productSales: Record<string, { name: string; quantity: number }> = {};
                  sales.forEach((sale) => {
                    if (Array.isArray(sale.items)) {
                      (sale.items as { product?: { name?: string }; productId?: string; quantity?: number }[]).forEach((item) => {
                        const productId = item.productId ?? 'unknown';
                        const productName = item.product?.name ?? 'Unknown Product';
                        const quantity = Number(item.quantity ?? 0);
                        if (productSales[productId]) {
                          productSales[productId].quantity += quantity;
                        } else {
                          productSales[productId] = { name: productName, quantity };
                        }
                      });
                    }
                  });
                  const chartData = Object.values(productSales)
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 10)
                    .map(p => ({
                      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
                      quantity: p.quantity,
                    }));
                  
                  return chartData.length === 0 ? (
                    <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={120} />
                        <Tooltip contentStyle={{ border: '1px solid #f1f5f9', borderRadius: '8px', fontSize: 12 }} />
                        <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>

              {/* Sales by Payment Method */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Sales by Payment Method</h3>
                <p className="text-xs text-slate-400 mb-4">Transaction distribution</p>
                {(() => {
                  const paymentData = sales.reduce((acc: Record<string, number>, sale) => {
                    const method = (sale.paymentMethod as string) ?? 'Unknown';
                    acc[method] = (acc[method] || 0) + 1;
                    return acc;
                  }, {});
                  const chartData = Object.entries(paymentData).map(([name, value]) => ({ name, value }));
                  const PAYMENT_COLORS: Record<string, string> = {
                    'card': '#6366f1',
                    'cash': '#10b981',
                    'bank_transfer': '#f59e0b',
                    'mobile_payment': '#ec4899',
                    'credit': '#8b5cf6',
                  };
                  
                  return chartData.length === 0 ? (
                    <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={PAYMENT_COLORS[entry.name] || '#6366f1'} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>

              {/* Revenue by Product Category */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Revenue by Category</h3>
                <p className="text-xs text-slate-400 mb-4">Total revenue per category</p>
                {(() => {
                  const categoryRevenue: Record<string, number> = {};
                  sales.forEach((sale) => {
                    if (Array.isArray(sale.items)) {
                      (sale.items as { product?: { category?: { name?: string } }; totalPrice?: number }[]).forEach((item) => {
                        const category = item.product?.category?.name ?? 'Uncategorized';
                        const price = Number(item.totalPrice ?? 0);
                        categoryRevenue[category] = (categoryRevenue[category] || 0) + price;
                      });
                    }
                  });
                  const chartData = Object.entries(categoryRevenue)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value);
                  
                  return chartData.length === 0 ? (
                    <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-45} textAnchor="end" height={80} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
                        <Tooltip contentStyle={{ border: '1px solid #f1f5f9', borderRadius: '8px', fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
              {salesLoading ? (
                <div className="py-12 text-center text-sm text-slate-400">Loading sales…</div>
              ) : (
                <DataTable
                  columns={[
                    { key: 'id', label: 'Sale ID', render: (row) => <span className="font-mono text-xs text-slate-400">{String(row.id ?? '').slice(-8)}</span> },
                    { key: 'customer', label: 'Customer', render: (row) => <span>{(row.customer as { fullName?: string } | undefined)?.fullName ?? 'Walk-in'}</span> },
                    { key: 'items', label: 'Items', render: (row) => <span>{Array.isArray(row.items) ? row.items.length : 0}</span> },
                    { key: 'totalAmount', label: 'Total', render: (row) => <span className="font-semibold text-slate-800">${Number(row.totalAmount ?? 0).toLocaleString()}</span> },
                    { key: 'saleDate', label: 'Date', render: (row) => <span className="text-slate-400">{row.saleDate ? new Date(String(row.saleDate)).toLocaleDateString() : '—'}</span> },
                    {
                      key: 'paymentStatus', label: 'Status',
                      render: (row) => {
                        let v: 'success' | 'warning' | 'danger' = 'danger';
                        if (row.paymentStatus === 'paid') v = 'success';
                        else if (row.paymentStatus === 'pending') v = 'warning';
                        return <Badge variant={v}>{String(row.paymentStatus ?? '—')}</Badge>;
                      },
                    },
                    {
                      key: 'actions', label: '',
                      render: (row) => (
                        <button
                          onClick={() => setViewSaleId(String(row.id))}
                          className="text-xs text-indigo-600 hover:underline font-medium"
                        >
                          View
                        </button>
                      ),
                    },
                  ]}
                  data={filteredSales as unknown as Record<string, unknown>[]}
                  emptyMessage="No sales recorded yet."
                />
              )}
            </div>
          </>
        )}

        {/* Cashflow Tab */}
        {tab === 'cashflow' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <p className="text-xs text-slate-400 mb-1">Total Inflow</p>
                <p className="text-2xl font-bold text-slate-800">${Number(cashflowSummary?.totalInflow ?? 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <p className="text-xs text-slate-400 mb-1">Total Outflow</p>
                <p className="text-2xl font-bold text-red-600">${Number(cashflowSummary?.totalOutflow ?? 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <p className="text-xs text-slate-400 mb-1">Net Cashflow</p>
                <p className={cn('text-2xl font-bold', (cashflowSummary?.netCashflow ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  {(cashflowSummary?.netCashflow ?? 0) >= 0 ? '+' : ''}{Number(cashflowSummary?.netCashflow ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <ChartCard title="Inflow vs Outflow" subtitle="Daily cashflow">
                {cashflowPoints.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No cashflow data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={cashflowPoints}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ border: '1px solid #f1f5f9', borderRadius: '8px', fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                      <Bar dataKey="inflow" fill="#6366f1" radius={[4, 4, 0, 0]} name="Inflow" />
                      <Bar dataKey="outflow" fill="#fca5a5" radius={[4, 4, 0, 0]} name="Outflow" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Net Cashflow Trend" subtitle="Cumulative">
                {cashflowPoints.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No cashflow data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={cashflowPoints.map((p) => ({ ...p, net: p.inflow - p.outflow }))}>
                      <defs>
                        <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ border: '1px solid #f1f5f9', borderRadius: '8px', fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Net']} />
                      <Area type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2} fill="url(#netGrad)" name="Net" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
