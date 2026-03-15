import api from '@/lib/api';

export interface SettingsData {
  business: {
    id: string;
    name: string;
    slug: string;
    email: string;
    country: string;
    currency: string;
    timezone: string;
  };
  settings: {
    lowStockThreshold: number;
    defaultTaxRate: number;
    fiscalYearStart: number;
  };
}

export interface UpdateSettingsInput {
  name?: string;
  email?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  lowStockThreshold?: number;
  defaultTaxRate?: number;
  fiscalYearStart?: number;
}

export const settingsService = {
  async get(): Promise<SettingsData> {
    const res = await api.get<{ data: SettingsData }>('/settings');
    return res.data.data;
  },

  async update(data: UpdateSettingsInput): Promise<SettingsData> {
    const res = await api.put<{ data: SettingsData }>('/settings', data);
    return res.data.data;
  },
};
