'use client';

import Navbar from '@/components/Navbar';
import StatsCard from '@/components/StatsCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import { useDashboardSummary, useRevenueTrend } from '@/hooks/useDashboard';
import { useStockLevels } from '@/hooks/useInventory';
import { useSales } from '@/hooks/useSales';
import { useAuthStore } from '@/store/auth.store';
import { useAIInsights } from '@/hooks/useAI';
import { cn } from '@/lib/cn';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  DollarSign, Package, AlertTriangle, TrendingUp, ArrowRight, Sparkles, Brain,
} from 'lucide-react';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: revenueTrend = [], isLoading: trendLoading } = useRevenueTrend(14);
  const { data: stockData } = useStockLevels({ lowStock: true });
  const { data: salesData } = useSales({ page: 1 });
  const { data: aiInsights = [] } = useAIInsights();

  const lowStockItems = Array.isArray(stockData) ? (stockData as { belowReorderPoint?: boolean }[]).filter((s) => s.belowReorderPoint) : [];
  const recentSales = Array.isArray(salesData) ? salesData : [];
  const trendPoints = (revenueTrend as { date: string; revenue: number; expenses: number }[]).map((p) => ({
    ...p,
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  // Get top 3 pending high-priority recommendations
  const topRecommendations = (aiInsights as any[])
    .filter((r: any) => r.status === 'pending')
    .sort((a: any, b: any) => {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    })
    .slice(0, 4);

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Dashboard" subtitle={today} />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Greeting */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{greeting}, {firstName} 👋</h2>
          <p className="text-sm text-slate-400 mt-0.5">Here&apos;s what&apos;s happening with your business today.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            label="Today's Revenue"
            value={summaryLoading ? '—' : fmt(summary?.todayRevenue ?? 0)}
            trend={summary ? `${summary.todayRevenueChange >= 0 ? '+' : ''}${summary.todayRevenueChange.toFixed(1)}% from yesterday` : 'Loading…'}
            trendDirection={!summary ? 'neutral' : summary.todayRevenueChange >= 0 ? 'up' : 'down'}
            icon={<DollarSign className="w-4 h-4" />}
          />
          <StatsCard
            label="Inventory Value"
            value={summaryLoading ? '—' : fmt(summary?.inventoryValue ?? 0)}
            trend={summary ? `${summary.lowStockCount} low-stock alerts` : 'Loading…'}
            trendDirection={summary && summary.lowStockCount > 0 ? 'down' : 'neutral'}
            icon={<Package className="w-4 h-4" />}
          />
          <StatsCard
            label="Low Stock Alerts"
            value={summaryLoading ? '—' : `${summary?.lowStockCount ?? 0} items`}
            trend={summary && summary.lowStockCount > 0 ? 'Needs attention' : 'All good'}
            trendDirection={summary && summary.lowStockCount > 0 ? 'down' : 'neutral'}
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <StatsCard
            label="Monthly Profit"
            value={summaryLoading ? '—' : fmt(summary?.monthlyProfit ?? 0)}
            trend={summary ? `${summary.monthlyProfitChange >= 0 ? '+' : ''}${summary.monthlyProfitChange.toFixed(1)}% vs last month` : 'Loading…'}
            trendDirection={!summary ? 'neutral' : summary.monthlyProfitChange >= 0 ? 'up' : 'down'}
            icon={<TrendingUp className="w-4 h-4" />}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <ChartCard title="Revenue Trend" subtitle="Last 14 days">
              {trendLoading ? (
                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Loading…</div>
              ) : trendPoints.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendPoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
                    <Tooltip
                      contentStyle={{ border: '1px solid #f1f5f9', borderRadius: '8px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', fontSize: 12 }}
                      formatter={(v: number) => [`$${v.toLocaleString()}`, '']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} name="Revenue" />
                    <Line type="monotone" dataKey="expenses" stroke="#e2e8f0" strokeWidth={2} dot={false} name="Expenses" />
                  </LineChart>
                </ResponsiveContainer>
              )}
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-0.5 bg-indigo-500 rounded-full inline-block" />Revenue</span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-0.5 bg-slate-200 rounded-full inline-block" />Expenses</span>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Daily Revenue" subtitle="Last 7 days">
            {trendPoints.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trendPoints.slice(-7)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="date" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip
                    contentStyle={{ border: '1px solid #f1f5f9', borderRadius: '8px', fontSize: 12 }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Bottom section: tables + AI */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Recent Sales */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <h3 className="text-sm font-semibold text-slate-800">Recent Sales</h3>
              <a href="/sales" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            {recentSales.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No sales recorded yet.</p>
            ) : (
              <DataTable
                columns={[
                  { key: 'id', label: 'Sale ID', render: (row) => <span className="font-mono text-xs text-slate-400">{String(row.id ?? '').slice(-8)}</span> },
                  { key: 'customer', label: 'Customer', render: (row) => <span>{(row.customer as { fullName?: string } | undefined)?.fullName ?? 'Walk-in'}</span> },
                  { key: 'items', label: 'Items', render: (row) => <span>{Array.isArray(row.items) ? row.items.length : 0}</span> },
                  { key: 'totalAmount', label: 'Total', render: (row) => <span className="font-medium">${Number(row.totalAmount ?? 0).toLocaleString()}</span> },
                  {
                    key: 'paymentStatus', label: 'Status',
                    render: (row) => (
                      <Badge variant={row.paymentStatus === 'paid' ? 'success' : row.paymentStatus === 'pending' ? 'warning' : 'danger'}>
                        {String(row.paymentStatus ?? 'unknown')}
                      </Badge>
                    ),
                  },
                ]}
                data={recentSales.slice(0, 5) as unknown as Record<string, unknown>[]}
              />
            )}
          </div>

          {/* AI Insights — Real-time Recommendations */}
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-slate-800">AI Insights</h3>
                </div>
                <a href="/insights" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </a>
              </div>
              <div className="space-y-2.5">
                {topRecommendations.length === 0 ? (
                  <>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                      <p className="text-xs text-slate-700 mb-1.5">📈 View demand forecasts and AI analysis</p>
                      <a href="/insights" className="text-xs text-indigo-600 font-medium hover:underline">See insights →</a>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                      <p className="text-xs text-slate-700 mb-1.5">💡 Ask questions about your business data</p>
                      <a href="/assistant" className="text-xs text-indigo-600 font-medium hover:underline">Ask AI →</a>
                    </div>
                  </>
                ) : (
                  topRecommendations.map((rec: any) => (
                    <div key={rec.id} className={cn(
                      'rounded-lg p-3 border',
                      rec.priority === 'high' ? 'bg-red-50 border-red-100' : rec.priority === 'medium' ? 'bg-amber-50 border-amber-100' : 'bg-indigo-50 border-indigo-100'
                    )}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-medium text-slate-800 leading-snug">{rec.title}</p>
                        <Badge variant={rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'info'}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">{rec.product?.name ?? 'General'} • {rec.recommendationType?.replace('_', ' ')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-800">Low Stock Products</h3>
            </div>
            <a href="/inventory" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Manage inventory <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No low-stock items 🎉</p>
          ) : (
            <DataTable
              columns={[
                { key: 'product', label: 'Product', render: (row) => <span className="font-medium text-slate-800">{(row.product as { name?: string } | undefined)?.name ?? '—'}</span> },
                { key: 'sku', label: 'SKU', render: (row) => <span className="text-slate-400 font-mono text-xs">{(row.product as { sku?: string } | undefined)?.sku ?? '—'}</span> },
                { key: 'currentStock', label: 'Stock', render: (row) => <span className="text-red-600 font-semibold">{String(row.currentStock ?? 0)} units</span> },
                { key: 'reorderPoint', label: 'Reorder Point', render: (row) => <span>{String((row.product as { reorderPoint?: number } | undefined)?.reorderPoint ?? '—')} units</span> },
              ]}
              data={lowStockItems as unknown as Record<string, unknown>[]}
            />
          )}
        </div>
      </main>
    </div>
  );
}
