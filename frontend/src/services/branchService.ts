import api from '@/lib/api';

export interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
}

export interface CreateBranchInput {
  name: string;
  address?: string;
  phone?: string;
}

export const branchService = {
  async getAll(): Promise<Branch[]> {
    const res = await api.get<{ data: Branch[] }>('/branches');
    return res.data.data;
  },

  async create(data: CreateBranchInput): Promise<Branch> {
    const res = await api.post<{ data: Branch }>('/branches', data);
    return res.data.data;
  },

  async update(id: string, data: Partial<CreateBranchInput>): Promise<Branch> {
    const res = await api.put<{ data: Branch }>(`/branches/${id}`, data);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/branches/${id}`);
  },
};
