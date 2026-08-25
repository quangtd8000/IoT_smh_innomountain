import { apiClient } from './client';
import { ApiResponse, LoginResponse, User } from '../types';

export const authApi = {
  login: async (credentials: { username: string; password: string }): Promise<LoginResponse> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    // Support both direct response and wrapped response
    return res.data.data || (res.data as any);
  },

  register: async (payload: { username: string; email: string; password: string; full_name?: string }): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/auth/register', payload);
    return res.data.data || (res.data as any);
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data || (res.data as any);
  },
};
