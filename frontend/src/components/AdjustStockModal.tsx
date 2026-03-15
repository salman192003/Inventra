'use client';

import { useState, FormEvent } from 'react';
import Modal, { Field, Input, Select, Textarea, FormActions } from '@/components/Modal';
import { useAdjustStock } from '@/hooks/useInventory';
import { useProducts } from '@/hooks/useProducts';

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly productId?: string; // pre-select a product
}

const MOVEMENT_TYPES = [
  { value: 'adjustment', label: 'Manual Adjustment' },
  { value: 'purchase', label: 'Purchase / Restock' },
  { value: 'return', label: 'Customer Return' },
  { value: 'waste', label: 'Waste / Shrinkage' },
  { value: 'opening_stock', label: 'Opening Stock' },
] as const;

export default function AdjustStockModal({ open, onClose, productId: defaultProductId }: Props) {
  const adjustStock = useAdjustStock();
  const { data: products = [] } = useProducts();

  const [form, setForm] = useState({
    productId: defaultProductId ?? '',
    movementType: 'adjustment' as typeof MOVEMENT_TYPES[number]['value'],
    quantityDelta: '',
    unitCost: '',
    notes: '',
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    adjustStock.mutate(
      {
        productId: form.productId,
        movementType: form.movementType,
        quantityDelta: Number.parseFloat(form.quantityDelta),
        unitCost: form.unitCost ? Number.parseFloat(form.unitCost) : undefined,
        notes: form.notes || undefined,
        branchId: null,
      },
      {
        onSuccess: () => {
          onClose();
          setForm({ productId: defaultProductId ?? '', movementType: 'adjustment', quantityDelta: '', unitCost: '', notes: '' });
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Adjust Stock">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Product" required>
          <Select value={form.productId} onChange={set('productId')} required>
            <option value="">Select product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </Select>
        </Field>

        <Field label="Movement Type" required>
          <Select value={form.movementType} onChange={set('movementType')} required>
            {MOVEMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity Change" required>
            <Input
              type="number"
              step="0.001"
              placeholder="e.g. 50 or -5"
              value={form.quantityDelta}
              onChange={set('quantityDelta')}
              required
            />
          </Field>
          <Field label="Unit Cost (optional)">
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.unitCost} onChange={set('unitCost')} />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea placeholder="Reason for adjustment…" value={form.notes} onChange={set('notes')} />
        </Field>

        {adjustStock.isError && (
          <p className="text-xs text-red-500">Failed to adjust stock. Please try again.</p>
        )}

        <FormActions onCancel={onClose} loading={adjustStock.isPending} submitLabel="Save Adjustment" />
      </form>
    </Modal>
  );
}
