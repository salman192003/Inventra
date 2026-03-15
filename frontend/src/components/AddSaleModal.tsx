'use client';

import { useState, FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal, { Field, Select, Input, Textarea, FormActions } from '@/components/Modal';
import { useCreateSale } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import type { Product } from '@/types/api.types';

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
}

interface LineItem {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
}

function makeItem(): LineItem {
  return { id: crypto.randomUUID(), productId: '', quantity: '1', unitPrice: '' };
}

function patchItem(item: LineItem, field: string, value: string, products: Product[]): LineItem {
  if (field === 'productId') {
    const found = products.find((p) => p.id === value);
    return { ...item, productId: value, unitPrice: found ? String(found.sellingPrice) : item.unitPrice };
  }
  if (field === 'quantity') return { ...item, quantity: value };
  return { ...item, unitPrice: value };
}

function toSaleItems(items: LineItem[], products: Product[]) {
  return items
    .filter((it) => it.productId && it.quantity && it.unitPrice)
    .map((it) => {
      const found = products.find((p) => p.id === it.productId);
      return {
        productId: it.productId,
        quantity: Number.parseFloat(it.quantity),
        unitPrice: Number.parseFloat(it.unitPrice),
        unitCost: found?.costPrice ?? 0,
      };
    });
}

interface LineItemRowProps {
  readonly item: LineItem;
  readonly products: Product[];
  readonly canRemove: boolean;
  readonly onUpdate: (field: string, value: string) => void;
  readonly onRemove: () => void;
}

function LineItemRow({ item, products, canRemove, onUpdate, onRemove }: LineItemRowProps) {
  return (
    <div className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center">
      <Select value={item.productId} onChange={(e) => onUpdate('productId', e.target.value)} required>
        <option value="">Select…</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </Select>
      <Input type="number" min="0.001" step="0.001" value={item.quantity} onChange={(e) => onUpdate('quantity', e.target.value)} required />
      <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => onUpdate('unitPrice', e.target.value)} required />
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-30"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function AddSaleModal({ open, onClose }: Props) {
  const createSale = useCreateSale();
  const { data: products = [] } = useProducts();
  const { data: customersData } = useCustomers();
  const customers = customersData ?? [];

  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>(() => [makeItem()]);

  const addItem = () => setItems((prev) => [...prev, makeItem()]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));
  const updateItem = (id: string, field: string, value: string) =>
    setItems((prev) => prev.map((it) => (it.id === id ? patchItem(it, field, value, products) : it)));

  const total = items.reduce((sum, it) => {
    return sum + (Number.parseFloat(it.quantity) || 0) * (Number.parseFloat(it.unitPrice) || 0);
  }, 0);

  const reset = () => {
    setCustomerId('');
    setPaymentMethod('cash');
    setNotes('');
    setItems([makeItem()]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const saleItems = toSaleItems(items, products);
    if (saleItems.length === 0) return;
    createSale.mutate(
      { customerId: customerId || null, paymentMethod, notes: notes || undefined, items: saleItems },
      { onSuccess: () => { onClose(); reset(); } },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="New Sale" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Customer (optional)">
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Walk-in customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </Select>
          </Field>
          <Field label="Payment Method" required>
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="credit">Credit</option>
            </Select>
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">Items</span>
            <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              <Plus className="w-3.5 h-3.5" /> Add item
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_80px_80px_32px] gap-2 px-1">
              <span className="text-[11px] text-slate-400 font-medium">Product</span>
              <span className="text-[11px] text-slate-400 font-medium">Qty</span>
              <span className="text-[11px] text-slate-400 font-medium">Price</span>
              <span />
            </div>
            {items.map((item) => (
              <LineItemRow
                key={item.id}
                item={item}
                products={products}
                canRemove={items.length > 1}
                onUpdate={(field, value) => updateItem(item.id, field, value)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <div className="bg-slate-50 rounded-lg px-4 py-2 text-right">
            <p className="text-[11px] text-slate-400">Total</p>
            <p className="text-base font-semibold text-slate-800">{total.toFixed(2)}</p>
          </div>
        </div>

        <Field label="Notes">
          <Textarea placeholder="Optional notes…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </Field>

        {createSale.isError && (
          <p className="text-xs text-red-500">Failed to record sale. Please try again.</p>
        )}
        <FormActions onCancel={onClose} loading={createSale.isPending} submitLabel="Record Sale" />
      </form>
    </Modal>
  );
}
