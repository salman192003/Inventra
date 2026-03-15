'use client';

import { useState, FormEvent } from 'react';
import Modal, { Field, Input, Select, Textarea, FormActions } from '@/components/Modal';
import { useCreateProduct } from '@/hooks/useProducts';
import { useSuppliers, useCategories } from '@/hooks/useSuppliers';

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
}

export default function AddProductModal({ open, onClose }: Props) {
  const createProduct = useCreateProduct();
  const { data: suppliers = [] } = useSuppliers();
  const { data: categories = [] } = useCategories();

  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    unit: 'pcs',
    costPrice: '',
    sellingPrice: '',
    reorderPoint: '10',
    reorderQuantity: '50',
    categoryId: '',
    supplierId: '',
    barcode: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createProduct.mutate(
      {
        name: form.name,
        sku: form.sku,
        description: form.description || undefined,
        unit: form.unit,
        costPrice: Number.parseFloat(form.costPrice),
        sellingPrice: Number.parseFloat(form.sellingPrice),
        reorderPoint: Number.parseInt(form.reorderPoint, 10),
        reorderQuantity: Number.parseInt(form.reorderQuantity, 10),
        categoryId: form.categoryId || null,
        supplierId: form.supplierId || null,
        barcode: form.barcode || null,
      },
      {
        onSuccess: () => {
          onClose();
          setForm({
            name: '', sku: '', description: '', unit: 'pcs',
            costPrice: '', sellingPrice: '', reorderPoint: '10',
            reorderQuantity: '50', categoryId: '', supplierId: '', barcode: '',
          });
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Product" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Product Name" required>
            <Input placeholder="e.g. Widget Pro" value={form.name} onChange={set('name')} required />
          </Field>
          <Field label="SKU" required>
            <Input placeholder="e.g. WGT-001" value={form.sku} onChange={set('sku')} required />
          </Field>
        </div>

        <Field label="Description">
          <Textarea placeholder="Optional description…" value={form.description} onChange={set('description')} />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Unit" required>
            <Select value={form.unit} onChange={set('unit')} required>
              <option value="pcs">pcs</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="l">l</option>
              <option value="ml">ml</option>
              <option value="box">box</option>
              <option value="pack">pack</option>
            </Select>
          </Field>
          <Field label="Cost Price" required>
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.costPrice} onChange={set('costPrice')} required />
          </Field>
          <Field label="Selling Price" required>
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.sellingPrice} onChange={set('sellingPrice')} required />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Reorder Point">
            <Input type="number" min="0" value={form.reorderPoint} onChange={set('reorderPoint')} />
          </Field>
          <Field label="Reorder Quantity">
            <Input type="number" min="0" value={form.reorderQuantity} onChange={set('reorderQuantity')} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={form.categoryId} onChange={set('categoryId')}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Supplier">
            <Select value={form.supplierId} onChange={set('supplierId')}>
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Barcode">
          <Input placeholder="Optional barcode" value={form.barcode} onChange={set('barcode')} />
        </Field>

        {createProduct.isError && (
          <p className="text-xs text-red-500">Failed to create product. Please try again.</p>
        )}

        <FormActions onCancel={onClose} loading={createProduct.isPending} submitLabel="Add Product" />
      </form>
    </Modal>
  );
}
