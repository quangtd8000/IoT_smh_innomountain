import { apiClient } from './client';
import { ApiResponse, Room } from '../types';

export const roomsApi = {
  getRoomsByHome: async (homeId: number): Promise<Room[]> => {
    const res = await apiClient.get<ApiResponse<Room[]>>(`/homes/${homeId}/rooms`);
    return res.data.data || (res.data as any) || [];
  },

  createRoom: async (homeId: number, name: string): Promise<Room> => {
    const res = await apiClient.post<ApiResponse<Room>>(`/homes/${homeId}/rooms`, { name });
    return res.data.data || (res.data as any);
  },

  getRoomById: async (roomId: number): Promise<Room> => {
    const res = await apiClient.get<ApiResponse<Room>>(`/rooms/${roomId}`);
    return res.data.data || (res.data as any);
  },

  updateRoom: async (roomId: number, name: string): Promise<Room> => {
    const res = await apiClient.put<ApiResponse<Room>>(`/rooms/${roomId}`, { name });
    return res.data.data || (res.data as any);
  },

  deleteRoom: async (roomId: number): Promise<void> => {
    await apiClient.delete(`/rooms/${roomId}`);
  },
};
