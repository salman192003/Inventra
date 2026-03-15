import api from '@/lib/api';
import type { Customer, CreateCustomerInput } from '@/types/api.types';

export const customerService = {
  async getAll(params?: { search?: string; page?: number; limit?: number }): Promise<Customer[]> {
    const res = await api.get('/customers', { params });
    return res.data.data;
  },

  async getById(id: string): Promise<Customer> {
    const res = await api.get(`/customers/${id}`);
    return res.data.data;
  },

  async getSalesHistory(id: string, params?: { page?: number; limit?: number }) {
    const res = await api.get(`/customers/${id}/sales`, { params });
    return res.data.data as unknown[];
  },

  async create(data: CreateCustomerInput): Promise<Customer> {
    const res = await api.post('/customers', data);
    return res.data.data;
  },

  async update(id: string, data: Partial<CreateCustomerInput>): Promise<Customer> {
    const res = await api.put(`/customers/${id}`, data);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};
