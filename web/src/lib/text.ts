/**
 * Bỏ dấu tiếng Việt về ASCII.
 * NFD tách được dấu thanh nhưng không xử lý đ/Đ, nên phải thay riêng.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Khớp từ khoá trong một tên do người dùng tự đặt.
 *
 * Từ đơn phải khớp trọn vẹn — nếu khớp chuỗi con thì "den" sẽ ăn nhầm
 * vào "garden". Cụm nhiều từ khớp theo chuỗi con vì ranh giới đã đủ rõ.
 */
export function matchesAny(name: string, keywords: string[]): boolean {
  const n = normalize(name);
  const words = n.split(/[^a-z0-9]+/).filter(Boolean);
  return keywords.some((k) => (k.includes(' ') ? n.includes(k) : words.includes(k)));
}

/**
 * Tên kênh là chữ người dùng tự gõ, có thể tiếng Việt hoặc tiếng Anh,
 * có dấu hoặc không. Đây là cách suy đoán tốt nhất có thể từ tên —
 * xem ghi chú trong QuickSceneBar về giới hạn của cách này.
 */
export const KEYWORDS = {
  light: ['den', 'light', 'lamp', 'bulb', 'chandelier', 'downlight'],
  fan: ['quat', 'fan', 'ventilator', 'thong gio', 'exhaust'],
};
