import { apiClient } from './client';
import { ApiResponse, Home, HomeMember, HomeRole } from '../types';

export const homesApi = {
  getHomes: async (): Promise<Home[]> => {
    const res = await apiClient.get<ApiResponse<Home[]>>('/homes');
    return res.data.data || (res.data as any) || [];
  },

  getHomeById: async (homeId: number): Promise<Home> => {
    const res = await apiClient.get<ApiResponse<Home>>(`/homes/${homeId}`);
    return res.data.data || (res.data as any);
  },

  createHome: async (name: string): Promise<Home> => {
    const res = await apiClient.post<ApiResponse<Home>>('/homes', { name });
    return res.data.data || (res.data as any);
  },

  updateHome: async (homeId: number, name: string): Promise<Home> => {
    const res = await apiClient.put<ApiResponse<Home>>(`/homes/${homeId}`, { name });
    return res.data.data || (res.data as any);
  },

  deleteHome: async (homeId: number): Promise<void> => {
    await apiClient.delete(`/homes/${homeId}`);
  },

  getMembers: async (homeId: number): Promise<HomeMember[]> => {
    const res = await apiClient.get<ApiResponse<HomeMember[]>>(`/homes/${homeId}/members`);
    return res.data.data || (res.data as any) || [];
  },

  addMember: async (homeId: number, payload: { user_id?: number; username?: string; role: HomeRole }): Promise<HomeMember> => {
    const res = await apiClient.post<ApiResponse<HomeMember>>(`/homes/${homeId}/members`, payload);
    return res.data.data || (res.data as any);
  },

  deleteMember: async (homeId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/homes/${homeId}/members/${userId}`);
  },

  // Cấu hình provisioning ESP32 qua BLE (broker + MQTT credential).
  // Chỉ owner/admin — credential do backend cấp lúc ghép nối, không hardcode.
  getProvisionConfig: async (
    homeId: number
  ): Promise<{ broker: string; user: string; pass_mqtt: string }> => {
    const res = await apiClient.get<ApiResponse<{ broker: string; user: string; pass_mqtt: string }>>(
      `/homes/${homeId}/provision-config`
    );
    return res.data.data || (res.data as any);
  },
};
