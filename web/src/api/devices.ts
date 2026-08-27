import { apiClient } from './client';
import { ApiResponse, Device, RelayChannel, IRDevice, IRCommand } from '../types';

export const devicesApi = {
  getDevicesByHome: async (homeId: number): Promise<Device[]> => {
    const res = await apiClient.get<ApiResponse<Device[]>>(`/homes/${homeId}/devices`);
    return res.data.data || (res.data as any) || [];
  },

  getDeviceById: async (deviceId: number): Promise<Device> => {
    const res = await apiClient.get<ApiResponse<Device>>(`/devices/${deviceId}`);
    return res.data.data || (res.data as any);
  },

  registerDevice: async (
    homeId: number,
    payload: { device_uid: string; name: string; device_type?: string; room_id?: number | null }
  ): Promise<Device> => {
    const res = await apiClient.post<ApiResponse<Device>>(`/homes/${homeId}/devices`, payload);
    return res.data.data || (res.data as any);
  },

  updateDevice: async (
    deviceId: number,
    payload: { name?: string; room_id?: number | null; device_type?: string }
  ): Promise<Device> => {
    const res = await apiClient.put<ApiResponse<Device>>(`/devices/${deviceId}`, payload);
    return res.data.data || (res.data as any);
  },

  deleteDevice: async (deviceId: number): Promise<void> => {
    await apiClient.delete(`/devices/${deviceId}`);
  },

  sendCommand: async (deviceId: number, command: string, value: any): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>(`/devices/${deviceId}/command`, {
      command,
      value,
    });
    return res.data.data || (res.data as any);
  },

  // Relay Channels
  getRelayChannels: async (deviceId: number): Promise<RelayChannel[]> => {
    const res = await apiClient.get<ApiResponse<RelayChannel[]>>(`/devices/${deviceId}/relay-channels`);
    return res.data.data || (res.data as any) || [];
  },

  addRelayChannel: async (deviceId: number, payload: { channel: number; name: string }): Promise<RelayChannel> => {
    const res = await apiClient.post<ApiResponse<RelayChannel>>(`/devices/${deviceId}/relay-channels`, payload);
    return res.data.data || (res.data as any);
  },

  updateRelayChannel: async (
    deviceId: number,
    channelId: number,
    payload: { name?: string; state?: boolean }
  ): Promise<RelayChannel> => {
    const res = await apiClient.put<ApiResponse<RelayChannel>>(`/devices/${deviceId}/relay-channels/${channelId}`, payload);
    return res.data.data || (res.data as any);
  },

  deleteRelayChannel: async (deviceId: number, channelId: number): Promise<void> => {
    await apiClient.delete(`/devices/${deviceId}/relay-channels/${channelId}`);
  },

  // IR Devices & Commands
  getIRDevices: async (deviceId: number): Promise<IRDevice[]> => {
    const res = await apiClient.get<ApiResponse<IRDevice[]>>(`/devices/${deviceId}/ir-devices`);
    return res.data.data || (res.data as any) || [];
  },

  addIRDevice: async (
    deviceId: number,
    payload: { name: string; target_type: string; brand?: string; emitter_pin?: number }
  ): Promise<IRDevice> => {
    const res = await apiClient.post<ApiResponse<IRDevice>>(`/devices/${deviceId}/ir-devices`, payload);
    return res.data.data || (res.data as any);
  },

  getIRCommands: async (irDeviceId: number): Promise<IRCommand[]> => {
    const res = await apiClient.get<ApiResponse<IRCommand[]>>(`/ir-devices/${irDeviceId}/commands`);
    return res.data.data || (res.data as any) || [];
  },

  addIRCommand: async (
    irDeviceId: number,
    payload: {
      name: string;
      protocol?: string;
      address?: number;
      command?: number;
      bits?: number;
      repeats?: number;
      frequency?: number;
      raw_data?: number[];
    }
  ): Promise<IRCommand> => {
    const res = await apiClient.post<ApiResponse<IRCommand>>(`/ir-devices/${irDeviceId}/commands`, payload);
    return res.data.data || (res.data as any);
  },

  sendIRCommand: async (commandId: number): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>(`/ir-commands/${commandId}/send`);
    return res.data.data || (res.data as any);
  },
};
