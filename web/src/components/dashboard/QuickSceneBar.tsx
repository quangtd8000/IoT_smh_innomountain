import React, { useState } from 'react';
import { Home, Moon, Wind, PowerOff } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { matchesAny, KEYWORDS } from '../../lib/text';
import { Device, RelayChannel } from '../../types';
import { cn } from '../../lib/utils';

interface Target {
  device: Device;
  channel: RelayChannel;
}

/**
 * Kịch bản phải đoán xem kênh nào là đèn, kênh nào là quạt, mà dữ liệu
 * chỉ có tên do người dùng tự gõ — có thể tiếng Việt hoặc tiếng Anh, có
 * dấu hoặc không. Nên việc khớp làm trên tên đã bỏ dấu, với từ khoá cả
 * hai thứ tiếng.
 *
 * Đây vẫn là phỏng đoán. Cách bền vững là backend có trường phân loại
 * cho từng kênh (đèn / quạt / ổ cắm / khác) thay vì suy từ tên.
 * Khi không nhận ra kênh nào, kịch bản phải nói thẳng ra chứ không
 * báo "đã tắt 0 đèn".
 */
export const QuickSceneBar: React.FC = () => {
  const { devices, toggleRelayChannel } = useHome();
  const [runningScene, setRunningScene] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const allChannels = (): Target[] =>
    devices.flatMap((device) =>
      (device.relay_channels ?? []).map((channel) => ({ device, channel }))
    );

  const apply = async (targets: Target[]) => {
    for (const t of targets) {
      await toggleRelayChannel(t.device.id, t.channel.id, t.channel.state);
    }
  };

  const handleRunScene = async (sceneId: string) => {
    setRunningScene(sceneId);
    setResult(null);

    const channels = allChannels();

    if (sceneId === 'all_off') {
      const targets = channels.filter((t) => t.channel.state);
      await apply(targets);
      setResult(targets.length ? `Đã tắt hết — ${targets.length} công tắc` : 'Mọi thứ đã tắt sẵn');
    } else if (sceneId === 'arrive_home') {
      const targets = devices
        .filter((d) => d.relay_channels?.length)
        .map((d) => ({ device: d, channel: d.relay_channels![0] }))
        .filter((t) => !t.channel.state);
      await apply(targets);
      setResult(
        targets.length ? `Đã về nhà — bật ${targets.length} đèn chính` : 'Các đèn chính đã bật sẵn'
      );
    } else if (sceneId === 'good_night') {
      const lights = channels.filter((t) => matchesAny(t.channel.name, KEYWORDS.light));
      if (lights.length === 0) {
        setResult('Chưa nhận ra kênh nào là đèn. Đổi tên kênh có chữ “đèn” hoặc “light”.');
      } else {
        const targets = lights.filter((t) => t.channel.state);
        await apply(targets);
        setResult(targets.length ? `Đã đi ngủ — tắt ${targets.length} đèn` : 'Đèn đã tắt sẵn');
      }
    } else if (sceneId === 'air_clean') {
      const fans = channels.filter((t) => matchesAny(t.channel.name, KEYWORDS.fan));
      if (fans.length === 0) {
        setResult('Chưa nhận ra kênh nào là quạt. Đổi tên kênh có chữ “quạt” hoặc “fan”.');
      } else {
        const targets = fans.filter((t) => !t.channel.state);
        await apply(targets);
        setResult(
          targets.length ? `Đã lọc không khí — bật ${targets.length} quạt` : 'Quạt đã chạy sẵn'
        );
      }
    }

    setRunningScene(null);
  };

  // Tên nút giữ nguyên xuyên suốt: bấm "Tắt hết" thì báo "Đã tắt hết"
  const scenes = [
    { id: 'arrive_home', name: 'Về nhà', icon: Home },
    { id: 'good_night', name: 'Đi ngủ', icon: Moon },
    { id: 'air_clean', name: 'Lọc không khí', icon: Wind },
    { id: 'all_off', name: 'Tắt hết', icon: PowerOff },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {scenes.map((s) => {
          const Icon = s.icon;
          const isRunning = runningScene === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleRunScene(s.id)}
              disabled={runningScene !== null}
              className={cn(
                'min-h-12 px-3 rounded-md border border-line bg-surface text-ink',
                'flex items-center justify-center gap-2 text-sm',
                'transition-colors duration-150 hover:bg-sunken',
                'disabled:opacity-45 disabled:pointer-events-none'
              )}
            >
              <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
              <span className="truncate">{isRunning ? 'Đang chạy' : s.name}</span>
            </button>
          );
        })}
      </div>

      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-ink-2">
        {result}
      </p>
    </div>
  );
};
