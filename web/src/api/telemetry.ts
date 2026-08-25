import { apiClient } from './client';
import { ApiResponse, SensorData } from '../types';

export const telemetryApi = {
  getTelemetry: async (
    deviceId: number,
    params?: {
      limit?: number;
      start_time?: string;
      end_time?: string;
    }
  ): Promise<SensorData[]> => {
    const res = await apiClient.get<ApiResponse<SensorData[]>>(`/devices/${deviceId}/telemetry`, {
      params,
    });
    return res.data.data || (res.data as any) || [];
  },

  recordTelemetry: async (deviceId: number, data: Partial<SensorData>): Promise<SensorData> => {
    const res = await apiClient.post<ApiResponse<SensorData>>(`/devices/${deviceId}/telemetry`, data);
    return res.data.data || (res.data as any);
  },
};
