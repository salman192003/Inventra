import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService } from '@/services/aiService';

export const AI_KEYS = {
  insights: ['ai', 'insights'] as const,
  inventoryAnalysis: ['ai', 'inventory-analysis'] as const,
  expenseAnalysis: ['ai', 'expense-analysis'] as const,
  businessAnalysis: ['ai', 'business-analysis'] as const,
  report: ['ai', 'report'] as const,
};

export function useAIInsights() {
  return useQuery({
    queryKey: AI_KEYS.insights,
    queryFn: () => aiService.getInsights(),
  });
}

export function useInventoryAnalysis() {
  return useQuery({
    queryKey: AI_KEYS.inventoryAnalysis,
    queryFn: () => aiService.getInventoryAnalysis(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useExpenseAnalysis() {
  return useQuery({
    queryKey: AI_KEYS.expenseAnalysis,
    queryFn: () => aiService.getExpenseAnalysis(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBusinessAnalysis() {
  return useQuery({
    queryKey: AI_KEYS.businessAnalysis,
    queryFn: () => aiService.getBusinessAnalysis(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: () => aiService.generateReport(),
  });
}

export function useTriggerForecasting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => aiService.triggerForecasting(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecasts'] });
    },
  });
}

export function useTriggerInsights() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => aiService.triggerInsights(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_KEYS.insights });
    },
  });
}

export function useUpdateRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'acted_on' | 'dismissed' | 'acknowledged' }) => 
      aiService.updateRecommendationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_KEYS.insights });
    },
  });
}
