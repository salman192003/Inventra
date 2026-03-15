import api from '@/lib/api';
import type { Category } from '@/types/api.types';

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const res = await api.get('/categories');
    return res.data.data;
  },

  async create(data: { name: string; description?: string; parentId?: string | null }): Promise<Category> {
    const res = await api.post('/categories', data);
    return res.data.data;
  },

  async update(id: string, data: { name?: string; description?: string }): Promise<void> {
    await api.put(`/categories/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
