import api from '@/lib/api';
import type { Product, CreateProductInput } from '@/types/api.types';

export const productService = {
  async getAll(params?: { search?: string; categoryId?: string; page?: number; limit?: number }): Promise<Product[]> {
    const res = await api.get<{ data: Product[] }>('/products', { params });
    return res.data.data;
  },

  async getById(id: string): Promise<Product> {
    const res = await api.get(`/products/${id}`);
    return res.data.data;
  },

  async create(data: CreateProductInput): Promise<Product> {
    const res = await api.post('/products', data);
    return res.data.data;
  },

  async update(id: string, data: Partial<CreateProductInput>): Promise<Product> {
    const res = await api.put(`/products/${id}`, data);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
