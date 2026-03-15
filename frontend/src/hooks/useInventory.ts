import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventoryService';
import type { AdjustStockInput } from '@/types/api.types';

export const STOCK_KEY = ['stock'] as const;
export const MOVEMENTS_KEY = ['movements'] as const;

export function useStockLevels(params?: { branchId?: string; lowStock?: boolean }) {
  return useQuery({
    queryKey: [...STOCK_KEY, params],
    queryFn: () => inventoryService.getStockLevels(params),
  });
}

export function useInventoryMovements(params?: {
  productId?: string;
  movementType?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: [...MOVEMENTS_KEY, params],
    queryFn: () => inventoryService.getMovements(params),
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AdjustStockInput) => inventoryService.adjustStock(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STOCK_KEY });
      qc.invalidateQueries({ queryKey: MOVEMENTS_KEY });
    },
  });
}
