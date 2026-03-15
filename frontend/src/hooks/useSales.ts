import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saleService } from '@/services/saleService';
import { expenseService } from '@/services/expenseService';
import { cashflowService } from '@/services/cashflowService';
import type { CreateSaleInput, CreateExpenseInput } from '@/types/api.types';

export const SALES_KEY = ['sales'] as const;
export const EXPENSES_KEY = ['expenses'] as const;
export const CASHFLOW_KEY = ['cashflow'] as const;

export function useSales(params?: { from?: string; to?: string; customerId?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: [...SALES_KEY, params],
    queryFn: () => saleService.getAll(params),
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: [...SALES_KEY, id],
    queryFn: () => saleService.getById(id),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSaleInput) => saleService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SALES_KEY });
      qc.invalidateQueries({ queryKey: CASHFLOW_KEY });
    },
  });
}

export function useExpenses(params?: { from?: string; to?: string; category?: string }) {
  return useQuery({
    queryKey: [...EXPENSES_KEY, params],
    queryFn: () => expenseService.getAll(params),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseInput) => expenseService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EXPENSES_KEY });
      qc.invalidateQueries({ queryKey: CASHFLOW_KEY });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPENSES_KEY }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExpenseInput> }) =>
      expenseService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPENSES_KEY }),
  });
}

export function useCashflowSummary(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: [...CASHFLOW_KEY, 'summary', params],
    queryFn: () => cashflowService.getSummary(params),
  });
}

export function useCashflowEvents(params?: { from?: string; to?: string; direction?: 'inflow' | 'outflow' }) {
  return useQuery({
    queryKey: [...CASHFLOW_KEY, 'events', params],
    queryFn: () => cashflowService.getEvents(params),
  });
}
