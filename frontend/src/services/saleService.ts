import api from '@/lib/api';
import type { Sale, CreateSaleInput } from '@/types/api.types';

export const saleService = {
  async getAll(params?: {
    from?: string;
    to?: string;
    customerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Sale[]> {
    const res = await api.get('/sales', { params });
    return res.data.data;
  },

  async getById(id: string): Promise<Sale> {
    const res = await api.get(`/sales/${id}`);
    return res.data.data;
  },

  async create(data: CreateSaleInput): Promise<Sale> {
    const res = await api.post('/sales', data);
    return res.data.data;
  },
};
