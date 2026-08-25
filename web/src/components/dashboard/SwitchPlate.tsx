import React, { useMemo, useState } from 'react';
import { useHome } from '../../context/HomeContext';
import { Device, RelayChannel } from '../../types';
import { cn } from '../../lib/utils';

interface Key {
  channel: RelayChannel;
  device: Device;
}

interface Plate {
  roomId: number | string;
  roomName: string;
  keys: Key[];
}

const UNASSIGNED = 'unassigned';

/**
 * Mặt công tắc ốp tường — điểm nhấn của giao diện.
 *
 * Công tắc trong nhà không phải là toggle trừu tượng: nó là một tấm ốp
 * gắn trên tường, mỗi phòng một tấm, phím có nhãn ghi bên dưới và một đèn
 * báo nhỏ ở góc. Ai cũng đã biết đọc thứ này rồi.
 */
export const SwitchPlate: React.FC = () => {
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
        byRoom.set(roomId, { roomId, roomName, keys: [] });
      }
      for (const channel of device.relay_channels) {
        byRoom.get(roomId)!.keys.push({ channel, device });
      }
    }

    // Phòng có nhiều phím lên trước; tấm chưa gán phòng luôn xuống cuối
    return Array.from(byRoom.values()).sort((a, b) => {
      if (a.roomId === UNASSIGNED) return 1;
      if (b.roomId === UNASSIGNED) return -1;
      return b.keys.length - a.keys.length;
    });
  }, [devices, rooms]);

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
          Chưa có công tắc nào. Thêm một thiết bị relay để điều khiển từ đây.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {plates.map((plate) => {
        const onCount = plate.keys.filter((k) => k.channel.state).length;
        return (
          <section key={plate.roomId} className="plate p-4">
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h3 className="text-sm font-medium text-ink truncate">{plate.roomName}</h3>
              <span className="text-sm text-ink-2 tnum flex-shrink-0">
                {onCount}/{plate.keys.length}
              </span>
            </div>

            <div
              className={cn(
                'grid gap-2.5',
                plate.keys.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'
              )}
            >
              {plate.keys.map((key) => {
                const { channel, device } = key;
                const isOn = channel.state;
                const isPending = pending.has(channel.id);
                const isOffline = device.status === 'offline';

                return (
                  <div key={channel.id} className="min-w-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOn}
                      aria-label={`${channel.name} — ${isOn ? 'đang bật' : 'đang tắt'}`}
                      disabled={isPending || isOffline}
                      data-on={isOn}
                      onClick={() => handlePress(key)}
                      className={cn(
                        'rocker w-full h-20 flex items-end justify-end p-2',
                        isPending && 'opacity-60'
                      )}
                    >
                      {/* Đèn báo ở góc, như công tắc thật */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'h-2 w-2 rounded-full transition-colors duration-150',
                          isOn ? 'bg-live' : 'bg-ink-2/30'
                        )}
                      />
                    </button>

                    {/* Nhãn nằm dưới phím, như nhãn dán trên tấm ốp */}
                    <p className="mt-1.5 text-sm text-ink truncate" title={channel.name}>
                      {channel.name}
                    </p>
                    <p className="text-xs text-ink-2">
                      {isOffline ? 'Mất kết nối' : isOn ? 'Bật' : 'Tắt'}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
