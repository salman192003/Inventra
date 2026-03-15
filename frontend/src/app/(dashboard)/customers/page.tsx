'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import AddCustomerModal from '@/components/AddCustomerModal';
import CustomerDetailModal from '@/components/CustomerDetailModal';
import { useCustomers } from '@/hooks/useCustomers';
import { Search, Plus, Trophy, Users, ShoppingCart, Star } from 'lucide-react';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const { data: customers = [], isLoading } = useCustomers({ search: search || undefined });
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [viewCustomerId, setViewCustomerId] = useState<string | null>(null);

  const topCustomers = [...customers]
    .sort((a, b) => (b.totalSpent ?? 0) - (a.totalSpent ?? 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Customers" subtitle="Customer management and analytics" />

      {/* Modals */}
      <AddCustomerModal open={showAddCustomer} onClose={() => setShowAddCustomer(false)} />
      <CustomerDetailModal customerId={viewCustomerId} onClose={() => setViewCustomerId(null)} />

      <main className="flex-1 p-6 space-y-5 overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard label="Total Customers" value={String(customers.length)} trend="All time" trendDirection="neutral" icon={<Users className="w-4 h-4" />} />
          <StatsCard
            label="Avg. Total Spent"
            value={customers.length > 0 ? `$${(customers.reduce((s, c) => s + (c.totalSpent ?? 0), 0) / customers.length).toFixed(0)}` : '—'}
            trend="Per customer"
            trendDirection="neutral"
            icon={<ShoppingCart className="w-4 h-4" />}
          />
          <StatsCard
            label="Top Customer"
            value={topCustomers[0]?.fullName ?? '—'}
            trend={topCustomers[0] ? `$${(topCustomers[0].totalSpent ?? 0).toLocaleString()} total` : 'No data'}
            trendDirection="up"
            icon={<Star className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Customer Table */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 w-64">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-sm outline-none bg-transparent w-full placeholder-slate-400"
                />
              </div>
              <button
                onClick={() => setShowAddCustomer(true)}
                className="flex items-center gap-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-2 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Customer
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
              {isLoading ? (
                <div className="py-12 text-center text-sm text-slate-400">Loading customers…</div>
              ) : (
                <DataTable
                  columns={[
                    { key: 'fullName', label: 'Name', className: 'font-medium text-slate-800' },
                    { key: 'email', label: 'Email', className: 'text-slate-400' },
                    { key: 'phone', label: 'Phone', className: 'text-slate-400' },
                    { key: 'totalSpent', label: 'Total Spent', render: (row) => <span className="font-semibold text-slate-800">${Number(row.totalSpent ?? 0).toLocaleString()}</span> },
                    { key: 'createdAt', label: 'Since', render: (row) => <span className="text-slate-400">{row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : '—'}</span> },
                    {
                      key: 'actions', label: '',
                      render: (row) => (
                        <button
                          onClick={() => setViewCustomerId(String(row.id))}
                          className="text-xs text-indigo-600 hover:underline font-medium"
                        >
                          View
                        </button>
                      ),
                    },
                  ]}
                  data={customers as unknown as Record<string, unknown>[]}
                  emptyMessage="No customers found."
                />
              )}
            </div>
          </div>

          {/* Top Customers sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-800">Top Customers</h3>
              </div>
              {topCustomers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No customers yet</p>
              ) : (
                <div className="space-y-3">
                  {topCustomers.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-indigo-600">
                          {c.fullName.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{c.fullName}</p>
                        <p className="text-xs text-slate-400">{c.email ?? '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800">${(c.totalSpent ?? 0).toLocaleString()}</p>
                        {i === 0 && <span className="text-xs text-amber-500">🏆 #1</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
