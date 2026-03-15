import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService, type CreateBranchInput } from '@/services/branchService';

export const BRANCHES_KEY = ['branches'] as const;

export function useBranches() {
  return useQuery({
    queryKey: BRANCHES_KEY,
    queryFn: () => branchService.getAll(),
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBranchInput) => branchService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: BRANCHES_KEY }),
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBranchInput> }) =>
      branchService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: BRANCHES_KEY }),
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => branchService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: BRANCHES_KEY }),
  });
}
