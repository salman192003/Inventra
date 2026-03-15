'use client';

import { useState, FormEvent } from 'react';
import Modal, { Field, Input, Textarea, FormActions } from '@/components/Modal';
import { useCreateCustomer } from '@/hooks/useCustomers';

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
}

export default function AddCustomerModal({ open, onClose }: Props) {
  const createCustomer = useCreateCustomer();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    tags: '',
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    createCustomer.mutate(
      {
        fullName: form.fullName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
        tags: tags.length > 0 ? tags : undefined,
      },
      {
        onSuccess: () => {
          onClose();
          setForm({ fullName: '', email: '', phone: '', address: '', notes: '', tags: '' });
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Customer">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Full Name" required>
          <Input placeholder="e.g. Jane Doe" value={form.fullName} onChange={set('fullName')} required />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <Input type="email" placeholder="jane@example.com" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Phone">
            <Input type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={set('phone')} />
          </Field>
        </div>

        <Field label="Address">
          <Textarea placeholder="Street address…" value={form.address} onChange={set('address')} rows={2} />
        </Field>

        <Field label="Tags">
          <Input placeholder="vip, wholesale, retail (comma-separated)" value={form.tags} onChange={set('tags')} />
        </Field>

        <Field label="Notes">
          <Textarea placeholder="Internal notes…" value={form.notes} onChange={set('notes')} rows={2} />
        </Field>

        {createCustomer.isError && (
          <p className="text-xs text-red-500">Failed to add customer. Please try again.</p>
        )}

        <FormActions onCancel={onClose} loading={createCustomer.isPending} submitLabel="Add Customer" />
      </form>
    </Modal>
  );
}
