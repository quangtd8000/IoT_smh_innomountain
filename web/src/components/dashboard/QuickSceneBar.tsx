import React, { useState } from 'react';
import { Home, Moon, Wind, PowerOff } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { cn } from '../../lib/utils';

export const QuickSceneBar: React.FC = () => {
  const { devices, toggleRelayChannel } = useHome();
  const [runningScene, setRunningScene] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleRunScene = async (sceneId: string) => {
    setRunningScene(sceneId);
    setResult(null);

    // Logic chạy kịch bản giữ nguyên như bản cũ
    if (sceneId === 'all_off') {
      let count = 0;
      for (const dev of devices) {
        if (dev.relay_channels) {
          for (const ch of dev.relay_channels) {
            if (ch.state) {
              await toggleRelayChannel(dev.id, ch.id, true);
              count++;
            }
          }
        }
      }
      setResult(`Đã tắt hết — ${count} công tắc`);
    } else if (sceneId === 'arrive_home') {
      let count = 0;
      for (const dev of devices) {
        if (dev.relay_channels && dev.relay_channels.length > 0) {
          const firstCh = dev.relay_channels[0];
          if (!firstCh.state) {
            await toggleRelayChannel(dev.id, firstCh.id, false);
            count++;
          }
        }
      }
      setResult(`Đã về nhà — bật ${count} đèn chính`);
    } else if (sceneId === 'good_night') {
      let count = 0;
      for (const dev of devices) {
        if (dev.relay_channels) {
          for (const ch of dev.relay_channels) {
            if (ch.state && ch.name.toLowerCase().includes('đèn')) {
              await toggleRelayChannel(dev.id, ch.id, true);
              count++;
            }
          }
        }
      }
      setResult(`Đã đi ngủ — tắt ${count} đèn`);
    } else if (sceneId === 'air_clean') {
      let count = 0;
      for (const dev of devices) {
        if (dev.relay_channels) {
          for (const ch of dev.relay_channels) {
            if (!ch.state && (ch.name.toLowerCase().includes('quạt') || ch.channel === 2)) {
              await toggleRelayChannel(dev.id, ch.id, false);
              count++;
            }
          }
        }
      }
      setResult(`Đã lọc không khí — bật ${count} quạt`);
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

      <p role="status" aria-live="polite" className="mt-2 h-5 text-sm text-ink-2">
        {result}
      </p>
    </div>
  );
};
