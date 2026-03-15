import api from '@/lib/api';
import type { Expense, CreateExpenseInput } from '@/types/api.types';

export const expenseService = {
  async getAll(params?: { from?: string; to?: string; category?: string }): Promise<Expense[]> {
    const res = await api.get('/expenses', { params });
    return res.data.data;
  },

  async create(data: CreateExpenseInput): Promise<Expense> {
    const res = await api.post('/expenses', data);
    return res.data.data;
  },

  async update(id: string, data: Partial<CreateExpenseInput>): Promise<void> {
    await api.put(`/expenses/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};
