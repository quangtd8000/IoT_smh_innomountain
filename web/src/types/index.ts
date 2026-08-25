// API Response Wrappers according to spec
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// User & Auth
export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Home & Members
export type HomeRole = 'owner' | 'admin' | 'member';

export interface HomeMember {
  home_id: number;
  user_id: number;
  role: HomeRole;
  joined_at?: string;
  user?: User;
}

export interface Home {
  id: number;
  name: string;
  owner_id: number;
  created_at?: string;
  role?: HomeRole; // Current user's role in this home
  members?: HomeMember[];
}

// Room
export interface Room {
  id: number;
  home_id: number;
  name: string;
  device_count?: number;
}

// Device & Hardware
export type DeviceType = 'controller' | 'sensor' | 'relay' | 'ir' | 'gateway';
export type DeviceStatus = 'online' | 'offline';

export interface RelayChannel {
  id: number;
  device_id: number;
  channel: number;
  name: string;
  state: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IRCommand {
  id: number;
  ir_device_id: number;
  name: string;
  protocol?: string;
  address?: number;
  command?: number;
  bits?: number;
  repeats?: number;
  frequency?: number;
  raw_data?: number[];
  extra_data?: Record<string, any>;
  created_at?: string;
}

export interface IRDevice {
  id: number;
  device_id: number;
  name: string;
  target_type: 'tv' | 'air_conditioner' | 'fan' | 'custom';
  brand?: string;
  emitter_pin?: number;
  commands?: IRCommand[];
}

export interface Device {
  id: number;
  home_id: number;
  room_id?: number | null;
  device_uid: string;
  name: string;
  device_type: DeviceType;
  status: DeviceStatus;
  created_at?: string;
  last_seen?: string | null;
  room?: Room;
  relay_channels?: RelayChannel[];
  ir_devices?: IRDevice[];
}

// Telemetry & Sensor Data
export interface SensorData {
  id: number;
  device_id: number;
  timestamp: string;
  temperature?: number | null;
  humidity?: number | null;
  pm25?: number | null;
  co2?: number | null;
  extra_metrics?: Record<string, any> | null;
}
