'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import { useProducts } from '@/hooks/useProducts';
import { useSuppliers, useUpdateSupplier, useDeleteSupplier, useCategories, useCreateCategory } from '@/hooks/useSuppliers';
import { useInventoryMovements, useStockLevels } from '@/hooks/useInventory';
import AddProductModal from '@/components/AddProductModal';
import AddSupplierModal from '@/components/AddSupplierModal';
import AdjustStockModal from '@/components/AdjustStockModal';
import { Search, Plus, SlidersHorizontal, Upload, Pencil, Trash2, Tag, X, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';
import type { Supplier } from '@/types/api.types';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

type Tab = 'products' | 'suppliers' | 'movements' | 'categories';

// ── Sub-component: Supplier Inline Edit Form ──────────────────────────────────
interface SupplierEditFormProps {
  form: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function SupplierEditForm({ form, onChange, onSave, onCancel, saving }: Readonly<SupplierEditFormProps>) {
  const fields: { key: string; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'contactName', label: 'Contact Person' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label htmlFor={`edit-sup-${key}`} className="text-xs text-slate-400">{label}</label>
            <input
              id={`edit-sup-${key}`}
              value={form[key] ?? ''}
              onChange={(e) => onChange(key, e.target.value)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        ))}
      </div>
      <div>
        <label htmlFor="edit-sup-address" className="text-xs text-slate-400">Address</label>
        <input
          id="edit-sup-address"
          value={form.address ?? ''}
          onChange={(e) => onChange('address', e.target.value)}
          className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
          <X className="w-3 h-3" /> Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 disabled:opacity-50"
        >
          <Check className="w-3 h-3" /> Save
        </button>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('products');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState<string | undefined>(undefined);

  // Supplier edit state — store as string only (no nulls) to satisfy CreateSupplierInput
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editSupplierForm, setEditSupplierForm] = useState<Record<string, string>>({});

  // Category add state
  const [newCategoryName, setNewCategoryName] = useState('');

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const { data: movements = [], isLoading: movementsLoading } = useInventoryMovements();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: stockLevels = [] } = useStockLevels();

  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const createCategory = useCreateCategory();

  const categoryNames = ['All', ...Array.from(new Set(products.map((p) => p.category?.name ?? 'Uncategorized')))];

  // Helper to get current stock for a product
  const getProductStock = (productId: string): number => {
    const stock = (stockLevels as unknown as { productId: string; currentStock: number }[])
      .find(sl => sl.productId === productId);
    return stock?.currentStock ?? 0;
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || (p.category?.name ?? 'Uncategorized') === category;
    return matchSearch && matchCategory;
  });

  function startEditSupplier(s: Supplier) {
    setEditingSupplierId(s.id);
    setEditSupplierForm({
      name: s.name,
      contactName: s.contactName ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      address: s.address ?? '',
    });
  }

  function cancelEditSupplier() {
    setEditingSupplierId(null);
    setEditSupplierForm({});
  }

  async function saveEditSupplier(id: string) {
    updateSupplier.mutate({ id, data: editSupplierForm }, {
      onSuccess: () => { toast.success('Supplier updated'); cancelEditSupplier(); },
      onError: () => toast.error('Failed to update supplier'),
    });
  }

  async function handleDeleteSupplier(id: string, name: string) {
    if (!confirm(`Delete supplier "${name}"?`)) return;
    deleteSupplier.mutate(id, {
      onSuccess: () => toast.success('Supplier deleted'),
      onError: () => toast.error('Failed to delete supplier'),
    });
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    createCategory.mutate({ name: newCategoryName.trim() }, {
      onSuccess: () => { toast.success('Category created'); setNewCategoryName(''); },
      onError: () => toast.error('Failed to create category'),
    });
  }

  const tabLabels: Record<Tab, string> = {
    products: 'Products',
    suppliers: 'Suppliers',
    movements: 'Movements',
    categories: 'Categories',
  };

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Inventory" subtitle="Manage products and suppliers" />

      {/* Modals */}
      <AddProductModal open={showAddProduct} onClose={() => setShowAddProduct(false)} />
      <AddSupplierModal open={showAddSupplier} onClose={() => setShowAddSupplier(false)} />
      <AdjustStockModal
        open={adjustProductId !== undefined}
        onClose={() => setAdjustProductId(undefined)}
        productId={adjustProductId}
      />

      <main className="flex-1 p-6 space-y-5 overflow-y-auto">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-100">
          {(Object.keys(tabLabels) as Tab[]).map((t) => (
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
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {/* ── Products Tab ─────────────────────────────────────────────── */}
        {tab === 'products' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="text-sm text-slate-600 placeholder-slate-400 outline-none bg-transparent w-full"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="text-sm text-slate-600 outline-none bg-transparent cursor-pointer"
                  >
                    {categoryNames.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 bg-white rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Import CSV
                </button>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="flex items-center gap-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-2 transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Product
                </button>
              </div>
            </div>

            {/* Inventory Analytics Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Category Distribution Pie Chart */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Products by Category</h3>
                <p className="text-xs text-slate-400 mb-4">Distribution of inventory across categories</p>
                {(() => {
                  const categoryData = products.reduce((acc: Record<string, number>, p) => {
                    const cat = p.category?.name ?? 'Uncategorized';
                    acc[cat] = (acc[cat] || 0) + 1;
                    return acc;
                  }, {});
                  const chartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
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
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>

              {/* Stock Levels Bar Chart */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Stock Levels by Product</h3>
                <p className="text-xs text-slate-400 mb-4">Top 10 products by quantity</p>
                {(() => {
                  const stockData = products
                    .map(p => ({
                      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
                      stock: getProductStock(p.id),
                    }))
                    .sort((a, b) => b.stock - a.stock)
                    .slice(0, 10);
                  
                  return stockData.length === 0 ? (
                    <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={stockData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={120} />
                        <Tooltip contentStyle={{ border: '1px solid #f1f5f9', borderRadius: '8px', fontSize: 12 }} />
                        <Bar dataKey="stock" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>

              {/* Inventory Value by Category */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Inventory Value by Category</h3>
                <p className="text-xs text-slate-400 mb-4">Total cost value across categories</p>
                {(() => {
                  const valueData = products.reduce((acc: Record<string, number>, p) => {
                    const cat = p.category?.name ?? 'Uncategorized';
                    const stock = getProductStock(p.id);
                    const value = stock * (p.costPrice || 0);
                    acc[cat] = (acc[cat] || 0) + value;
                    return acc;
                  }, {});
                  const chartData = Object.entries(valueData)
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
                        <Tooltip contentStyle={{ border: '1px solid #f1f5f9', borderRadius: '8px', fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Value']} />
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>

              {/* Low Stock Alert Summary */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Stock Status Overview</h3>
                <p className="text-xs text-slate-400 mb-4">Products by stock health</p>
                {(() => {
                  const stockStatus = products.reduce((acc: Record<string, number>, p) => {
                    const stock = getProductStock(p.id);
                    const reorderPoint = p.reorderPoint || 0;
                    
                    if (stock === 0) acc['Out of Stock'] = (acc['Out of Stock'] || 0) + 1;
                    else if (stock < reorderPoint) acc['Low Stock'] = (acc['Low Stock'] || 0) + 1;
                    else if (stock < reorderPoint * 2) acc['Medium Stock'] = (acc['Medium Stock'] || 0) + 1;
                    else acc['Healthy Stock'] = (acc['Healthy Stock'] || 0) + 1;
                    return acc;
                  }, {});
                  
                  const chartData = Object.entries(stockStatus).map(([name, value]) => ({ name, value }));
                  const STATUS_COLORS: Record<string, string> = {
                    'Out of Stock': '#ef4444',
                    'Low Stock': '#f59e0b',
                    'Medium Stock': '#3b82f6',
                    'Healthy Stock': '#10b981',
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
                            <Cell key={`cell-${entry.name}`} fill={STATUS_COLORS[entry.name] || '#6366f1'} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
              {productsLoading ? (
                <div className="py-12 text-center text-sm text-slate-400">Loading products…</div>
              ) : (
                <DataTable
                  columns={[
                    { key: 'name', label: 'Product Name', className: 'font-medium text-slate-800 min-w-[160px]' },
                    { key: 'sku', label: 'SKU', className: 'font-mono text-xs text-slate-400' },
                    { key: 'category', label: 'Category', render: (row) => <span>{(row.category as { name?: string } | undefined)?.name ?? '—'}</span> },
                    {
                      key: 'stock', label: 'Stock',
                      render: (row) => {
                        const qty = row.stockLevels && Array.isArray(row.stockLevels)
                          ? (row.stockLevels as { quantity: number }[]).reduce((s, sl) => s + sl.quantity, 0)
                          : '—';
                        let stockColor = 'text-slate-700';
                        if (qty === 0) stockColor = 'text-red-500';
                        else if (typeof qty === 'number' && qty <= 10) stockColor = 'text-amber-600';
                        return <span className={cn('font-medium', stockColor)}>{qty}</span>;
                      },
                    },
                    { key: 'costPrice', label: 'Cost Price', render: (row) => <span>${Number(row.costPrice ?? 0).toFixed(2)}</span> },
                    { key: 'sellingPrice', label: 'Sell Price', className: 'font-medium', render: (row) => <span>${Number(row.sellingPrice ?? 0).toFixed(2)}</span> },
                    {
                      key: 'isActive', label: 'Status',
                      render: (row) => <Badge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>,
                    },
                    {
                      key: 'actions', label: '',
                      render: (row) => (
                        <button
                          onClick={() => setAdjustProductId(String(row.id))}
                          className="text-xs text-indigo-600 hover:underline font-medium"
                        >
                          Adjust
                        </button>
                      ),
                    },
                  ]}
                  data={filtered as unknown as Record<string, unknown>[]}
                  emptyMessage="No products match your search."
                />
              )}
            </div>
          </>
        )}

        {/* ── Suppliers Tab ─────────────────────────────────────────────── */}
        {tab === 'suppliers' && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 w-64">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  className="text-sm text-slate-600 placeholder-slate-400 outline-none bg-transparent w-full"
                />
              </div>
              <button
                onClick={() => setShowAddSupplier(true)}
                className="flex items-center gap-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-2 transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Supplier
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
              {suppliersLoading ? (
                <div className="py-12 text-center text-sm text-slate-400">Loading suppliers…</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {suppliers.length === 0 && (
                    <p className="py-12 text-center text-sm text-slate-400">No suppliers found.</p>
                  )}
                  {suppliers.map((s) => (
                    <div key={s.id} className="px-5 py-4">
                      {editingSupplierId === s.id ? (
                        <SupplierEditForm
                          form={editSupplierForm}
                          onChange={(field, value) => setEditSupplierForm((f) => ({ ...f, [field]: value }))}
                          onSave={() => saveEditSupplier(s.id)}
                          onCancel={cancelEditSupplier}
                          saving={updateSupplier.isPending}
                        />
                      ) : (
                        /* ── Read-only Row ── */
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1">
                            <div>
                              <p className="text-sm font-medium text-slate-800">{s.name}</p>
                              <p className="text-xs text-slate-400">Supplier</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-600">{s.contactName ?? '—'}</p>
                              <p className="text-xs text-slate-400">Contact</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-600">{s.email ?? '—'}</p>
                              <p className="text-xs text-slate-400">Email</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-600">{s.phone ?? '—'}</p>
                              <p className="text-xs text-slate-400">Phone</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => startEditSupplier(s)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSupplier(s.id, s.name)}
                              disabled={deleteSupplier.isPending}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Movements Tab ─────────────────────────────────────────────── */}
        {tab === 'movements' && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            {movementsLoading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading movements…</div>
            ) : (
              <DataTable
                columns={[
                  { key: 'product', label: 'Product', render: (row) => <span className="font-medium text-slate-800">{(row.product as { name: string } | undefined)?.name ?? '—'}</span> },
                  {
                    key: 'movementType', label: 'Type',
                    render: (row) => {
                      const type = String(row.movementType ?? '');
                      const colorMap: Record<string, string> = {
                        purchase: 'success', sale: 'danger', adjustment: 'warning',
                        return: 'info', waste: 'danger', opening_stock: 'info',
                        transfer_in: 'success', transfer_out: 'warning',
                      };
                      return <Badge variant={(colorMap[type] as 'success' | 'danger' | 'warning' | 'info' | 'neutral') ?? 'neutral'}>{type.replaceAll('_', ' ')}</Badge>;
                    },
                  },
                  {
                    key: 'quantityDelta', label: 'Qty Change',
                    render: (row) => {
                      const qty = Number(row.quantityDelta ?? 0);
                      return <span className={cn('font-semibold', qty >= 0 ? 'text-emerald-600' : 'text-red-500')}>{qty >= 0 ? '+' : ''}{qty}</span>;
                    },
                  },
                  { key: 'notes', label: 'Notes', render: (row) => <span className="text-slate-400">{String(row.notes ?? '—')}</span> },
                  { key: 'createdAt', label: 'Date', render: (row) => <span className="text-slate-400">{row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : '—'}</span> },
                ]}
                data={movements as unknown as Record<string, unknown>[]}
                emptyMessage="No inventory movements yet."
              />
            )}
          </div>
        )}

        {/* ── Categories Tab ─────────────────────────────────────────────── */}
        {tab === 'categories' && (
          <div className="space-y-4">
            {/* Add Category Form */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                Add Category
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Category name…"
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={createCategory.isPending || !newCategoryName.trim()}
                  className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2 transition-colors disabled:opacity-50 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
              {categoriesLoading && (
                <div className="py-12 text-center text-sm text-slate-400">Loading categories…</div>
              )}
              {!categoriesLoading && categories.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-400">No categories yet.</div>
              )}
              {!categoriesLoading && categories.length > 0 && (
                <DataTable
                  columns={[
                    { key: 'name', label: 'Category Name', className: 'font-medium text-slate-800' },
                    { key: 'description', label: 'Description', render: (row) => <span className="text-slate-400">{String(row.description ?? '—')}</span> },
                    {
                      key: 'children', label: 'Subcategories',
                      render: (row) => {
                        const kids = row.children as { id: string; name: string }[] | undefined;
                        return <span className="text-slate-500 text-xs">{kids && kids.length > 0 ? kids.map((k) => k.name).join(', ') : '—'}</span>;
                      },
                    },
                  ]}
                  data={categories as unknown as Record<string, unknown>[]}
                  emptyMessage="No categories found."
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

