'use client';

import { useState, FormEvent } from 'react';
import Modal, { Field, Input, Textarea, FormActions } from '@/components/Modal';
import { useCreateSupplier } from '@/hooks/useSuppliers';

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
}

export default function AddSupplierModal({ open, onClose }: Props) {
  const createSupplier = useCreateSupplier();

  const [form, setForm] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createSupplier.mutate(
      {
        name: form.name,
        contactName: form.contactName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      },
      {
        onSuccess: () => {
          onClose();
          setForm({ name: '', contactName: '', email: '', phone: '', address: '' });
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Supplier">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Supplier Name" required>
          <Input placeholder="e.g. Acme Distributors" value={form.name} onChange={set('name')} required />
        </Field>

        <Field label="Contact Person">
          <Input placeholder="e.g. John Smith" value={form.contactName} onChange={set('contactName')} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <Input type="email" placeholder="supplier@example.com" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Phone">
            <Input type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={set('phone')} />
          </Field>
        </div>

        <Field label="Address">
          <Textarea placeholder="Street address, city, country…" value={form.address} onChange={set('address')} />
        </Field>

        {createSupplier.isError && (
          <p className="text-xs text-red-500">Failed to add supplier. Please try again.</p>
        )}

        <FormActions onCancel={onClose} loading={createSupplier.isPending} submitLabel="Add Supplier" />
      </form>
    </Modal>
  );
}
