import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { DashboardSummary } from '@/types/api.types';

export const DASHBOARD_KEY = ['dashboard'] as const;

interface RevenueTrendPoint {
  date: string;
  revenue: number;
  expenses: number;
}

async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await api.get<{ data: DashboardSummary }>('/dashboard/summary');
  return res.data.data;
}

async function getRevenueTrend(days = 30): Promise<RevenueTrendPoint[]> {
  const res = await api.get<{ data: RevenueTrendPoint[] }>('/dashboard/revenue-trend', {
    params: { days },
  });
  return res.data.data;
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'summary'],
    queryFn: getDashboardSummary,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useRevenueTrend(days = 30) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'revenue-trend', days],
    queryFn: () => getRevenueTrend(days),
    staleTime: 1000 * 60 * 5,
  });
}
