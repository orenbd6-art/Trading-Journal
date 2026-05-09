import axios from 'axios';
import { Trade } from '@/types/trade';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL + '/api' });

export const tradesApi = {
  getAll:   (params = {}) => api.get('/trades', { params }).then(r => r.data),
  getById:  (id: string) => api.get<Trade>(`/trades/${id}`).then(r => r.data),
  create:   (data: any) => api.post<Trade>('/trades', data).then(r => r.data),
update: (id: string, data: any) => api.patch(`/trades/${id}`, data).then(r => r.data),  delete:   (id: string) => api.delete(`/trades/${id}`),
  getStats: (account?: string) => api.get('/trades/stats', { params: { account } }).then(r => r.data),
  uploadScreenshots: async (files: File[]): Promise<string[]> => {
    const form = new FormData();
    files.forEach(f => form.append('screenshots', f));
    const res = await api.post<{ urls: string[] }>('/uploads/multiple', form);
    return res.data.urls;
  },
};