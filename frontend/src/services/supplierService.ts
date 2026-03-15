import api from '@/lib/api';
import type { Supplier, CreateSupplierInput } from '@/types/api.types';

export const supplierService = {
  async getAll(): Promise<Supplier[]> {
    const res = await api.get('/suppliers');
    return res.data.data;
  },

  async create(data: CreateSupplierInput): Promise<Supplier> {
    const res = await api.post('/suppliers', data);
    return res.data.data;
  },

  async update(id: string, data: Partial<CreateSupplierInput>): Promise<Supplier> {
    const res = await api.put(`/suppliers/${id}`, data);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  },
};
