import api from '@/lib/api';
import type { AuthResponse } from '@/types/api.types';

export const authService = {
  async login(email: string, password: string, businessSlug: string): Promise<AuthResponse> {
    const res = await api.post<{ data: AuthResponse }>('/auth/login', {
      email,
      password,
      businessSlug,
    });
    return res.data.data;
  },

  async register(payload: {
    business: { name: string; slug: string; email: string; country: string; currency: string; timezone: string };
    user: { fullName: string; email: string; password: string };
  }): Promise<AuthResponse> {
    const res = await api.post<{ data: AuthResponse }>('/auth/register', payload);
    return res.data.data;
  },

  async me(): Promise<AuthResponse> {
    const res = await api.get<{ data: { id: string; email: string; fullName: string; isOwner: boolean; businessId: string; business: AuthResponse['business'] } }>('/auth/me');
    const d = res.data.data;
    return {
      token: '',
      user: {
        id: d.id,
        email: d.email,
        fullName: d.fullName,
        isOwner: d.isOwner,
        businessId: d.businessId,
      },
      business: d.business,
    };
  },
};
