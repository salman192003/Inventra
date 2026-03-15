import api from '@/lib/api';
import type { CashflowSummary, CashflowEvent } from '@/types/api.types';

export const cashflowService = {
  async getSummary(params?: { from?: string; to?: string }): Promise<CashflowSummary> {
    const res = await api.get('/cashflow/summary', { params });
    return res.data.data;
  },

  async getEvents(params?: { from?: string; to?: string; direction?: 'inflow' | 'outflow' }): Promise<CashflowEvent[]> {
    const res = await api.get('/cashflow', { params });
    return res.data.data;
  },
};
