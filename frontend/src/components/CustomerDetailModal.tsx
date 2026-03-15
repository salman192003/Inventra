'use client';

import Modal from '@/components/Modal';
import { useCustomer } from '@/hooks/useCustomers';
import { Mail, Phone, MapPin, Tag, ShoppingCart, DollarSign, Calendar } from 'lucide-react';

interface Props {
  customerId: string | null;
  onClose: () => void;
}

export default function CustomerDetailModal({ customerId, onClose }: Readonly<Props>) {
  const { data: customer, isLoading } = useCustomer(customerId ?? '');

  return (
    <Modal open={!!customerId} onClose={onClose} title="Customer Details">
      {isLoading && (
        <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
      )}

      {!isLoading && customer && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-indigo-600">
                {customer.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">{customer.fullName}</h3>
              {customer.tags && customer.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {customer.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Contact</h4>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {customer.email}
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {customer.phone}
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {customer.address}
              </div>
            )}
            {!customer.email && !customer.phone && !customer.address && (
              <p className="text-sm text-slate-400">No contact details on file.</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-lg font-bold text-slate-800">${(customer.totalSpent ?? 0).toLocaleString()}</p>
              <p className="text-xs text-slate-400">Total Spent</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <p className="text-lg font-bold text-slate-800">{customer.orderCount ?? 0}</p>
              <p className="text-xs text-slate-400">Orders</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : '—'}
              </p>
              <p className="text-xs text-slate-400">Last Order</p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !customer && (
        <p className="py-8 text-center text-sm text-slate-400">Customer not found.</p>
      )}
    </Modal>
  );
}
