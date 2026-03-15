'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useBranches, useCreateBranch, useUpdateBranch, useDeleteBranch } from '@/hooks/useBranches';
import { cn } from '@/lib/cn';
import { Building2, Globe, Receipt, MapPin, Download, Save, Loader2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

type Section = 'profile' | 'currency' | 'tax' | 'branches' | 'export';

const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'profile',  label: 'Business Profile', icon: <Building2 className="w-4 h-4" /> },
  { id: 'currency', label: 'Currency',          icon: <Globe className="w-4 h-4" /> },
  { id: 'tax',      label: 'Tax Settings',      icon: <Receipt className="w-4 h-4" /> },
  { id: 'branches', label: 'Branch Locations',  icon: <MapPin className="w-4 h-4" /> },
  { id: 'export',   label: 'Data Export',       icon: <Download className="w-4 h-4" /> },
];

export default function SettingsPage() {
  const [section, setSection] = useState<Section>('profile');

  // ── Settings & business profile ──────────────────────────────────────────
  const { data: settingsData, isLoading: settingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [form, setForm] = useState({
    name: '',
    email: '',
    country: '',
    currency: 'USD',
    timezone: 'UTC',
    lowStockThreshold: 10,
    defaultTaxRate: 0,
    fiscalYearStart: 1,
  });

  useEffect(() => {
    if (settingsData) {
      setForm({
        name: settingsData.business.name ?? '',
        email: settingsData.business.email ?? '',
        country: settingsData.business.country ?? '',
        currency: settingsData.business.currency ?? 'USD',
        timezone: settingsData.business.timezone ?? 'UTC',
        lowStockThreshold: settingsData.settings.lowStockThreshold ?? 10,
        defaultTaxRate: settingsData.settings.defaultTaxRate ?? 0,
        fiscalYearStart: settingsData.settings.fiscalYearStart ?? 1,
      });
    }
  }, [settingsData]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(form);
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  // ── Branches ─────────────────────────────────────────────────────────────
  const { data: branches = [], isLoading: branchesLoading } = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '' });
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editBranch, setEditBranch] = useState({ name: '', address: '', phone: '' });

  const handleAddBranch = async () => {
    if (!newBranch.name.trim()) return;
    try {
      await createBranch.mutateAsync(newBranch);
      setNewBranch({ name: '', address: '', phone: '' });
      setShowAddBranch(false);
      toast.success('Branch added');
    } catch {
      toast.error('Failed to add branch');
    }
  };

  const startEditBranch = (b: { id: string; name: string; address?: string | null; phone?: string | null }) => {
    setEditingBranchId(b.id);
    setEditBranch({ name: b.name, address: b.address ?? '', phone: b.phone ?? '' });
  };

  const handleUpdateBranch = async (id: string) => {
    try {
      await updateBranch.mutateAsync({ id, data: editBranch });
      setEditingBranchId(null);
      toast.success('Branch updated');
    } catch {
      toast.error('Failed to update branch');
    }
  };

  const handleDeleteBranch = async (id: string) => {
    try {
      await deleteBranch.mutateAsync(id);
      toast.success('Branch removed');
    } catch {
      toast.error('Failed to remove branch');
    }
  };

  const isSaving = updateSettings.isPending;

  if (settingsLoading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400 mt-2">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Settings" subtitle="Manage your business configuration" />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">

            {/* Sub-nav */}
            <nav className="space-y-0.5">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                    section === s.id
                      ? 'bg-slate-100 text-slate-800 font-medium'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  )}
                >
                  <span className={section === s.id ? 'text-indigo-500' : 'text-slate-400'}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </nav>

            {/* Content panel */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">

              {/* ── Business Profile ── */}
              {section === 'profile' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-semibold text-slate-800">Business Profile</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Basic information about your business.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Business Name</label>
                      <input
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Business Email</label>
                      <input
                        type="email"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Country</label>
                      <input
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Timezone</label>
                      <select
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={form.timezone}
                        onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="America/Chicago">America/Chicago</option>
                        <option value="America/Los_Angeles">America/Los_Angeles</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="Asia/Dubai">Asia/Dubai</option>
                        <option value="Asia/Karachi">Asia/Karachi</option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                        <option value="Africa/Lagos">Africa/Lagos</option>
                        <option value="Australia/Sydney">Australia/Sydney</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                </div>
              )}

              {/* ── Currency ── */}
              {section === 'currency' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-semibold text-slate-800">Currency Settings</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Set your default currency.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Currency</label>
                    <select
                      className="w-full max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    >
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="EUR">EUR — Euro (€)</option>
                      <option value="GBP">GBP — British Pound (£)</option>
                      <option value="AED">AED — UAE Dirham (د.إ)</option>
                      <option value="PKR">PKR — Pakistani Rupee (₨)</option>
                      <option value="NGN">NGN — Nigerian Naira (₦)</option>
                      <option value="KES">KES — Kenyan Shilling (KSh)</option>
                      <option value="INR">INR — Indian Rupee (₹)</option>
                    </select>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                </div>
              )}

              {/* ── Tax Settings ── */}
              {section === 'tax' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-semibold text-slate-800">Tax Settings</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Configure tax rates and inventory thresholds.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Default Tax Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={form.defaultTaxRate}
                        onChange={(e) => setForm({ ...form, defaultTaxRate: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Low Stock Threshold (units)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={form.lowStockThreshold}
                        onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Fiscal Year Start (month)</label>
                      <select
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={form.fiscalYearStart}
                        onChange={(e) => setForm({ ...form, fiscalYearStart: Number(e.target.value) })}
                      >
                        {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                          <option key={m} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                </div>
              )}

              {/* ── Branch Locations ── */}
              {section === 'branches' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-800">Branch Locations</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Manage your store or warehouse locations.</p>
                    </div>
                    <button
                      onClick={() => setShowAddBranch(true)}
                      className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-2 font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Branch
                    </button>
                  </div>

                  {/* Add Branch form */}
                  {showAddBranch && (
                    <div className="border border-indigo-100 bg-indigo-50/50 rounded-lg p-4 space-y-3">
                      <p className="text-xs font-medium text-slate-700">New Branch</p>
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          placeholder="Branch name *"
                          value={newBranch.name}
                          onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                        />
                        <input
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          placeholder="Address"
                          value={newBranch.address}
                          onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                        />
                        <input
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          placeholder="Phone"
                          value={newBranch.phone}
                          onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddBranch}
                          disabled={createBranch.isPending || !newBranch.name.trim()}
                          className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 font-medium disabled:opacity-50"
                        >
                          {createBranch.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Save
                        </button>
                        <button
                          onClick={() => { setShowAddBranch(false); setNewBranch({ name: '', address: '', phone: '' }); }}
                          className="flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Branch list */}
                  {branchesLoading ? (
                    <p className="text-sm text-slate-400">Loading branches…</p>
                  ) : branches.length === 0 ? (
                    <p className="text-sm text-slate-400">No branches yet. Add your first location above.</p>
                  ) : (
                    <div className="space-y-2">
                      {branches.map((b) => (
                        <div key={b.id} className="border border-slate-100 rounded-lg px-4 py-3">
                          {editingBranchId === b.id ? (
                            /* Inline edit form */
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-2">
                                <input
                                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                  value={editBranch.name}
                                  onChange={(e) => setEditBranch({ ...editBranch, name: e.target.value })}
                                  placeholder="Branch name"
                                />
                                <input
                                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                  value={editBranch.address}
                                  onChange={(e) => setEditBranch({ ...editBranch, address: e.target.value })}
                                  placeholder="Address"
                                />
                                <input
                                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                  value={editBranch.phone}
                                  onChange={(e) => setEditBranch({ ...editBranch, phone: e.target.value })}
                                  placeholder="Phone"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateBranch(b.id)}
                                  disabled={updateBranch.isPending}
                                  className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 font-medium disabled:opacity-50"
                                >
                                  {updateBranch.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingBranchId(null)}
                                  className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5"
                                >
                                  <X className="w-3 h-3" /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Display row */
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-slate-700">{b.name}</p>
                                  {b.address && <p className="text-xs text-slate-400">{b.address}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => startEditBranch(b)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBranch(b.id)}
                                  disabled={deleteBranch.isPending}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Delete"
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
              )}

              {/* ── Data Export ── */}
              {section === 'export' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-semibold text-slate-800">Data Export</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Download your business data as CSV or PDF.</p>
                  </div>
                  <div className="space-y-3">
                    {['Inventory Data', 'Sales Report', 'Expense Report', 'Customer List'].map((item) => (
                      <div key={item} className="flex items-center justify-between border border-slate-100 rounded-lg px-4 py-3">
                        <span className="text-sm text-slate-700">{item}</span>
                        <div className="flex items-center gap-2">
                          <button className="text-xs text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1 hover:bg-indigo-50 transition-colors">CSV</button>
                          <button className="text-xs text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1 hover:bg-indigo-50 transition-colors">PDF</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
