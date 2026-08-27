import React, { useMemo, useState } from 'react';
import { useHome } from '../../context/HomeContext';
import { Device, RelayChannel } from '../../types';
import { roomTone, RoomTone } from '../../lib/roomTone';
import { cn } from '../../lib/utils';

interface Key {
  channel: RelayChannel;
  device: Device;
}

interface Plate {
  roomId: number | string;
  roomName: string;
  tone: RoomTone;
  keys: Key[];
}

const UNASSIGNED = 'unassigned';

/**
 * Mặt công tắc ốp tường — điểm nhấn của giao diện.
 *
 * Công tắc gạt báo trạng thái bằng vị trí của núm chứ không bằng màu.
 * Nhờ vậy màu được rảnh tay mang danh tính của phòng: mỗi phòng một tone
 * riêng phủ rất nhạt lên mặt bảng, mà vẫn không ai phải đoán phím nào
 * đang bật.
 */
export interface SwitchPlateProps {
  selectedRoomId?: number | 'all';
}

export const SwitchPlate: React.FC<SwitchPlateProps> = ({ selectedRoomId = 'all' }) => {
  const { devices, rooms, toggleRelayChannel } = useHome();
  const [pending, setPending] = useState<Set<number>>(new Set());

  const plates = useMemo<Plate[]>(() => {
    const byRoom = new Map<number | string, Plate>();

    for (const device of devices) {
      if (!device.relay_channels?.length) continue;

      const roomId = device.room_id ?? UNASSIGNED;
      const roomName =
        device.room?.name ??
        rooms.find((r) => r.id === device.room_id)?.name ??
        'Chưa gán phòng';

      if (!byRoom.has(roomId)) {
        byRoom.set(roomId, { roomId, roomName, tone: roomTone(roomName), keys: [] });
      }
      for (const channel of device.relay_channels) {
        byRoom.get(roomId)!.keys.push({ channel, device });
      }
    }

    // Sắp xếp cố định các công tắc trong từng phòng theo số thứ tự kênh
    for (const plate of byRoom.values()) {
      plate.keys.sort((a, b) => (a.channel.channel || 0) - (b.channel.channel || 0) || a.channel.id - b.channel.id);
    }

    // Sắp xếp cố định thứ tự các phòng theo danh sách rooms, phòng chưa gán nằm cuối
    const roomIndexMap = new Map(rooms.map((r, idx) => [r.id, idx]));
    const sorted = Array.from(byRoom.values()).sort((a, b) => {
      if (a.roomId === UNASSIGNED) return 1;
      if (b.roomId === UNASSIGNED) return -1;
      const idxA = roomIndexMap.get(Number(a.roomId)) ?? 999;
      const idxB = roomIndexMap.get(Number(b.roomId)) ?? 999;
      if (idxA !== idxB) return idxA - idxB;
      return String(a.roomName).localeCompare(String(b.roomName));
    });

    if (selectedRoomId === 'all') return sorted;
    return sorted.filter((p) => p.roomId === selectedRoomId);
  }, [devices, rooms, selectedRoomId]);

  const handlePress = async ({ channel, device }: Key) => {
    if (pending.has(channel.id)) return;
    setPending((prev) => new Set(prev).add(channel.id));
    try {
      await toggleRelayChannel(device.id, channel.id, channel.state);
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(channel.id);
        return next;
      });
    }
  };

  if (plates.length === 0) {
    return (
      <div className="plate p-5">
        <p className="text-sm text-ink-2">
          Chưa có công tắc nào. Thêm công tắc từ mục Phòng & Thiết bị để điều khiển từ đây.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {plates.map((plate) => {
        const Icon = plate.tone.icon;
        const onCount = plate.keys.filter((k) => k.channel.state).length;

        return (
          <section
            key={plate.roomId}
            className="plate plate--toned overflow-hidden p-0"
            style={{ ['--tone' as string]: plate.tone.rgb } as React.CSSProperties}
          >
            <header className="plate__head flex items-center gap-2.5 px-4 py-3 border-b border-line">
              <Icon
                size={17}
                strokeWidth={1.75}
                aria-hidden="true"
                style={{ color: 'rgb(var(--tone))' }}
              />
              <h3 className="flex-1 text-sm font-medium text-ink truncate">{plate.roomName}</h3>
              <span className="text-sm text-ink-2 tnum flex-shrink-0">
                {onCount}/{plate.keys.length}
              </span>
            </header>

            <ul>
              {plate.keys.map((key) => {
                const { channel, device } = key;
                const isOn = channel.state;
                const isPending = pending.has(channel.id);
                const isOffline = device.status === 'offline';

                return (
                  <li key={channel.id} className="border-b border-line last:border-b-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOn}
                      aria-label={channel.name}
                      disabled={isPending || isOffline}
                      data-on={isOn}
                      onClick={() => handlePress(key)}
                      className={cn(
                        'switch-row w-full flex items-center gap-3 px-4 py-3 text-left',
                        'transition-colors duration-150 hover:bg-ink/[0.03]',
                        isPending && 'opacity-60'
                      )}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-ink truncate" title={channel.name}>
                          {channel.name}
                        </span>
                        <span className="block text-xs text-ink-2">
                          {isOffline ? 'Mất kết nối' : isOn ? 'Bật' : 'Tắt'}
                        </span>
                      </span>

                      <span className="gat" aria-hidden="true">
                        <span className="gat__knob" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
};
