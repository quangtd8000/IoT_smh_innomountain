import {
  Home,
  Moon,
  Wind,
  PowerOff,
  Sun,
  Coffee,
  Users,
  Tv,
  Film,
  LucideIcon,
} from 'lucide-react';
import { Device, RelayChannel } from '../types';

export const SCENE_ICONS: Record<string, LucideIcon> = {
  Home,
  Moon,
  Wind,
  PowerOff,
  Sun,
  Coffee,
  Users,
  Tv,
  Film,
};

export const SCENE_ICON_LABELS: Record<string, string> = {
  Home: 'Ngôi nhà',
  Moon: 'Mặt trăng / Đi ngủ',
  Sun: 'Mặt trời / Buổi sáng',
  Wind: 'Gió / Quạt',
  Coffee: 'Cà phê / Thư giãn',
  Film: 'Xem phim',
  Tv: 'Tivi',
  Users: 'Tiếp khách / Lễ hội',
  PowerOff: 'Tắt nguồn',
};

export interface SceneAction {
  deviceId: number;
  channelId: number;
  targetState: boolean; // true = ON, false = OFF
  deviceName?: string;
  channelName?: string;
}

export interface CustomScene {
  id: string;
  name: string;
  iconName: string;
  isCustom?: boolean;
  actions: SceneAction[];
}

export const DEFAULT_SCENES: CustomScene[] = [
  {
    id: 'arrive_home',
    name: 'Về nhà',
    iconName: 'Home',
    actions: [],
  },
  {
    id: 'good_night',
    name: 'Đi ngủ',
    iconName: 'Moon',
    actions: [],
  },
  {
    id: 'air_clean',
    name: 'Lọc không khí',
    iconName: 'Wind',
    actions: [],
  },
  {
    id: 'all_off',
    name: 'Tắt hết',
    iconName: 'PowerOff',
    actions: [],
  },
];

export function getHomeScenes(homeId: number | string): CustomScene[] {
  try {
    const raw = localStorage.getItem(`smarthome_scenes_${homeId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Chuẩn hoá icon cũ bị cấm theo spec UI (Sparkles → Users)
        return parsed.map((s: CustomScene) =>
          s.iconName === 'Sparkles' ? { ...s, iconName: 'Users' } : s
        );
      }
    }
  } catch (e) {
    console.error('Error reading scenes from storage:', e);
  }
  return DEFAULT_SCENES;
}

export function saveHomeScenes(homeId: number | string, scenes: CustomScene[]): void {
  try {
    localStorage.setItem(`smarthome_scenes_${homeId}`, JSON.stringify(scenes));
  } catch (e) {
    console.error('Error saving scenes to storage:', e);
  }
}
