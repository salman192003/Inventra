'use client';

import Modal from '@/components/Modal';
import { useSale } from '@/hooks/useSales';
import Badge from '@/components/Badge';
import { User, CreditCard, Calendar, Hash } from 'lucide-react';

interface Props {
  saleId: string | null;
  onClose: () => void;
}

function paymentBadgeVariant(method: string): 'success' | 'info' | 'warning' | 'neutral' {
  const map: Record<string, 'success' | 'info' | 'warning' | 'neutral'> = {
    cash: 'success',
    card: 'info',
    bank_transfer: 'info',
    mobile_payment: 'warning',
    credit: 'neutral',
  };
  return map[method] ?? 'neutral';
}

function statusVariant(status: string): 'success' | 'danger' | 'warning' | 'neutral' {
  if (status === 'completed') return 'success';
  if (status === 'voided') return 'danger';
  if (status === 'refunded') return 'warning';
  return 'neutral';
}

export default function SaleDetailModal({ saleId, onClose }: Readonly<Props>) {
  const { data: sale, isLoading } = useSale(saleId ?? '');

  return (
    <Modal open={!!saleId} onClose={onClose} title="Sale Details">
      {isLoading && (
        <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
      )}

      {!isLoading && sale && (
        <div className="space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono text-xs">{sale.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {new Date(sale.saleDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {sale.customer?.fullName ?? 'Walk-in customer'}
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <Badge variant={paymentBadgeVariant(sale.paymentMethod)}>
                {sale.paymentMethod.replaceAll('_', ' ')}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(sale.status)}>{sale.status}</Badge>
            {sale.branch && (
              <span className="text-xs text-slate-400">Branch: {sale.branch.name}</span>
            )}
          </div>

          {/* Line Items */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Items</h4>
            <div className="bg-slate-50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-4 py-2 text-xs text-slate-400 font-medium">Product</th>
                    <th className="text-right px-4 py-2 text-xs text-slate-400 font-medium">Qty</th>
                    <th className="text-right px-4 py-2 text-xs text-slate-400 font-medium">Unit Price</th>
                    <th className="text-right px-4 py-2 text-xs text-slate-400 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 font-medium text-slate-700">{item.product?.name ?? '—'}</td>
                      <td className="px-4 py-2 text-right text-slate-500">{Number(item.quantity)}</td>
                      <td className="px-4 py-2 text-right text-slate-500">${Number(item.unitPrice).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-semibold text-slate-700">${Number(item.totalPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Discount</span>
              <span>−${Number(sale.discountAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Tax</span>
              <span>+${Number(sale.taxAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-800 pt-1.5 border-t border-slate-200">
              <span>Total</span>
              <span>${Number(sale.totalAmount).toFixed(2)}</span>
            </div>
          </div>

          {sale.notes && (
            <p className="text-sm text-slate-500 italic">Note: {sale.notes}</p>
          )}
        </div>
      )}

      {!isLoading && !sale && (
        <p className="py-8 text-center text-sm text-slate-400">Sale not found.</p>
      )}
    </Modal>
  );
}
