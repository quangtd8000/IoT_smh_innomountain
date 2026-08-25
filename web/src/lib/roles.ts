import { HomeRole } from '../types';

/** Nhãn tiếng Việt cho vai trò. Dùng chung để Cài đặt và Thành viên không lệch chữ. */
export const ROLE_LABEL: Record<HomeRole, string> = {
  owner: 'Chủ nhà',
  admin: 'Quản trị',
  member: 'Thành viên',
};

export const roleLabel = (role: string): string =>
  ROLE_LABEL[role as HomeRole] ?? role;
