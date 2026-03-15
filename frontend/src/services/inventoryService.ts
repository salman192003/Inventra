import api from '@/lib/api';
import type { StockLevel, InventoryMovement, AdjustStockInput } from '@/types/api.types';

export const inventoryService = {
  async getStockLevels(params?: { branchId?: string; lowStock?: boolean }): Promise<StockLevel[]> {
    const res = await api.get('/inventory/stock', { params });
    return res.data.data;
  },

  async getMovements(params?: {
    productId?: string;
    branchId?: string;
    movementType?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<InventoryMovement[]> {
    const res = await api.get('/inventory/movements', { params });
    return res.data.data;
  },

  async adjustStock(data: AdjustStockInput): Promise<InventoryMovement> {
    const res = await api.post('/inventory/movements', data);
    return res.data.data;
  },
};
