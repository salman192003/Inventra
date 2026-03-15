import api from '@/lib/api';
import type { Forecast } from '@/types/api.types';

export const forecastService = {
  async getAll(params?: { productId?: string; branchId?: string }): Promise<Forecast[]> {
    const res = await api.get('/forecasts', { params });
    return res.data.data;
  },
};
