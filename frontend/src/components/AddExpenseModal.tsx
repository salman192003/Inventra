'use client';

import { useState, FormEvent } from 'react';
import Modal, { Field, Input, Select, Textarea, FormActions } from '@/components/Modal';
import { useCreateExpense } from '@/hooks/useSales';

const EXPENSE_CATEGORIES = [
  'Rent', 'Utilities', 'Salaries', 'Marketing', 'Supplies',
  'Transport', 'Maintenance', 'Insurance', 'Taxes', 'Other',
];

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
}

export default function AddExpenseModal({ open, onClose }: Props) {
  const createExpense = useCreateExpense();

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    category: '',
    description: '',
    amount: '',
    expenseDate: today,
    paymentMethod: 'cash',
    notes: '',
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createExpense.mutate(
      {
        category: form.category,
        description: form.description || undefined,
        amount: Number.parseFloat(form.amount),
        expenseDate: form.expenseDate,
        paymentMethod: form.paymentMethod || undefined,
        notes: form.notes || undefined,
        branchId: null,
      },
      {
        onSuccess: () => {
          onClose();
          setForm({ category: '', description: '', amount: '', expenseDate: today, paymentMethod: 'cash', notes: '' });
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Expense">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" required>
            <Select value={form.category} onChange={set('category')} required>
              <option value="">Select category…</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Amount" required>
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={set('amount')} required />
          </Field>
        </div>

        <Field label="Description">
          <Input placeholder="Short description…" value={form.description} onChange={set('description')} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required>
            <Input type="date" value={form.expenseDate} onChange={set('expenseDate')} required />
          </Field>
          <Field label="Payment Method">
            <Select value={form.paymentMethod} onChange={set('paymentMethod')}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="other">Other</option>
            </Select>
          </Field>
        </div>

        <Field label="Notes">
          <Textarea placeholder="Additional notes…" value={form.notes} onChange={set('notes')} rows={2} />
        </Field>

        {createExpense.isError && (
          <p className="text-xs text-red-500">Failed to add expense. Please try again.</p>
        )}

        <FormActions onCancel={onClose} loading={createExpense.isPending} submitLabel="Add Expense" />
      </form>
    </Modal>
  );
}
