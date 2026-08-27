import { Home, LayoutGrid, AirVent, LineChart, Settings, LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  /** Nhãn ngắn cho tab dưới, tầm ngón cái trên điện thoại */
  label: string;
  /** Tiêu đề trang khi mục này đang mở */
  title: string;
  icon: LucideIcon;
}

// Một nguồn sự thật cho cả Sidebar lẫn BottomNav — hai chỗ không được lệch nhau.
export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Nhà", title: "Nhà", icon: Home },
  { id: "devices", label: "Thiết bị", title: "Thiết bị", icon: LayoutGrid },
  { id: "ir", label: "Điều khiển", title: "Điều khiển", icon: AirVent },
  { id: "analytics", label: "Số liệu", title: "Số liệu", icon: LineChart },
  { id: "settings", label: "Cài đặt", title: "Cài đặt", icon: Settings },
];

export const pageTitle = (id: string): string =>
  NAV_ITEMS.find((i) => i.id === id)?.title ?? "Nhà";
