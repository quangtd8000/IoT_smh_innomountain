import { apiClient } from './client';
import { ApiResponse, SensorData } from '../types';

/** Một ô thời gian do máy chủ gộp sẵn. Không có id vì là nhiều bản ghi cộng lại. */
export interface ApiBucket {
  timestamp: string;
  temperature: number | null;
  humidity: number | null;
  pm25: number | null;
  co2: number | null;
  voc_index: number | null;
  nox_index: number | null;
  count: number;
}

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

  /**
   * Lấy số liệu đã gộp theo ô thời gian.
   *
   * Endpoint thô bị chặn ở 1000 bản ghi, mà cảm biến gửi khoảng nửa giây một
   * lần, nên 1000 bản ghi chỉ phủ ~8 phút — không vẽ được 1 giờ hay 6 giờ.
   * Gộp trong SQL thì khoảng bao lâu cũng chỉ trả về vài chục điểm.
   */
  getAggregate: async (
    deviceId: number,
    params: {
      bucket_seconds: number;
      start_time?: string;
      end_time?: string;
      max_points?: number;
    }
  ): Promise<ApiBucket[]> => {
    const res = await apiClient.get<ApiResponse<ApiBucket[]>>(
      `/devices/${deviceId}/telemetry/aggregate`,
      { params }
    );
    return res.data.data || (res.data as any) || [];
  },

  recordTelemetry: async (deviceId: number, data: Partial<SensorData>): Promise<SensorData> => {
    const res = await apiClient.post<ApiResponse<SensorData>>(`/devices/${deviceId}/telemetry`, data);
    return res.data.data || (res.data as any);
  },
};
