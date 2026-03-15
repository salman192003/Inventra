import { useQuery } from '@tanstack/react-query';
import { forecastService } from '@/services/forecastService';

export const FORECASTS_KEY = ['forecasts'] as const;

export function useForecasts(params?: { productId?: string; branchId?: string }) {
  return useQuery({
    queryKey: [...FORECASTS_KEY, params],
    queryFn: () => forecastService.getAll(params),
  });
}
