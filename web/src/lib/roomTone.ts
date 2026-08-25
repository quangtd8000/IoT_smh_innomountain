import {
  Bed,
  Sofa,
  CookingPot,
  ShowerHead,
  Laptop,
  Trees,
  DoorOpen,
  LucideIcon,
} from 'lucide-react';

export interface RoomTone {
  /** Kênh RGB, dùng qua rgb(var(--tone) / …) */
  rgb: string;
  icon: LucideIcon;
}

/**
 * API chỉ trả về tên phòng, không có trường phân loại, nên tone được suy
 * từ tên. Màu cố ý giữ độ bão hoà thấp và độ sáng trung bình để đọc được
 * trên cả nền sáng lẫn nền tối.
 */
const RULES: { words: string[]; tone: RoomTone }[] = [
  { words: ['ngu', 'bedroom'], tone: { rgb: '178 126  96', icon: Bed } },
  { words: ['khach', 'living'], tone: { rgb: '158 134 104', icon: Sofa } },
  { words: ['bep', 'kitchen'], tone: { rgb: '166 142  74', icon: CookingPot } },
  { words: ['tam', 'wc', 'toilet', 've sinh', 'bathroom'], tone: { rgb: '102 148 154', icon: ShowerHead } },
  { words: ['lam viec', 'hoc', 'office', 'study'], tone: { rgb: '112 132 166', icon: Laptop } },
  { words: ['san', 'vuon', 'ban cong', 'ngoai', 'garden'], tone: { rgb: '110 152 112', icon: Trees } },
];

const DEFAULT_TONE: RoomTone = { rgb: '130 138 132', icon: DoorOpen };

/** Bỏ dấu tiếng Việt về ASCII. NFD không xử lý đ/Đ nên phải thay riêng. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function roomTone(name: string): RoomTone {
  const n = normalize(name);
  const words = n.split(/[^a-z0-9]+/).filter(Boolean);

  for (const rule of RULES) {
    for (const w of rule.words) {
      // Cụm nhiều từ khớp theo chuỗi con; từ đơn phải khớp trọn vẹn,
      // nếu không "ngu" sẽ khớp nhầm vào "nguyen".
      const hit = w.includes(' ') ? n.includes(w) : words.includes(w);
      if (hit) return rule.tone;
    }
  }
  return DEFAULT_TONE;
}
