import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Recommendation } from '@/types/api.types';
import { toast } from 'sonner';

export const useRecommendations = () => {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const res = await api.get('/ai/insights');
      return res.data.data as Recommendation[];
    },
  });
};

export const useInventoryAnalysis = () => {
  return useQuery({
    queryKey: ['inventory-analysis'],
    queryFn: async () => {
      const res = await api.get('/ai/inventory-analysis');
      return res.data.data;
    },
  });
};

export const useExpenseAnalysis = () => {
  return useQuery({
    queryKey: ['expense-analysis'],
    queryFn: async () => {
      const res = await api.get('/ai/expense-analysis');
      return res.data.data;
    },
  });
};

export const useBusinessReport = () => {
  return useQuery({
    queryKey: ['ai-report'],
    queryFn: async () => {
      const res = await api.get('/ai/report');
      return res.data.data;
    },
    enabled: false, // Don't fetch on mount, trigger manually maybe? Or fetch on tab change.
  });
};

export const useTriggerInsights = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/ai/insights/trigger');
    },
    onSuccess: () => {
      toast.success('Insights generated successfully');
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['expense-analysis'] });
    },
  });
};

export const useTriggerForecasts = () => {
  return useMutation({
    mutationFn: async () => {
      await api.post('/ai/forecast/trigger');
    },
    onSuccess: () => {
      toast.success('Forecast generation triggered in background');
    },
  });
};
