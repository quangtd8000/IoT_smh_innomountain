import React, { useState } from 'react';
import {
  Home,
  Moon,
  Wind,
  PowerOff,
  Zap,
  Check,
  Sparkles,
} from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { cn } from '../../lib/utils';

export const QuickSceneBar: React.FC = () => {
  const { devices, toggleRelayChannel } = useHome();
  const [activeScene, setActiveScene] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleRunScene = async (sceneId: string) => {
    setActiveScene(sceneId);

    if (sceneId === 'all_off') {
      // Turn off all relays
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
      showToast(`⚡ Đã tắt ${count} thiết bị/công tắc đang chạy!`);
    } else if (sceneId === 'arrive_home') {
      // Turn on primary relays (channel 1)
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
      showToast(`🏠 Chế độ Về Nhà: Đã bật ${count} đèn chính.`);
    } else if (sceneId === 'good_night') {
      // Keep only fan/essential (turn off lights)
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
      showToast(`🌙 Chế độ Đi Ngủ: Đã tắt ${count} đèn sinh hoạt.`);
    } else if (sceneId === 'air_clean') {
      // Turn on fan (channel 2 or name with quạt)
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
      showToast(`🍃 Chế độ Lọc Khí: Đã kích hoạt ${count} quạt thông gió.`);
    }

    setTimeout(() => setActiveScene(null), 1000);
  };

  const scenes = [
    {
      id: 'arrive_home',
      name: 'Về Nhà',
      desc: 'Bật đèn chính & khởi động',
      icon: Home,
      color: 'hover:border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400',
      activeColor: 'bg-cyan-500 text-white',
    },
    {
      id: 'good_night',
      name: 'Đi Ngủ',
      desc: 'Tắt đèn sinh hoạt',
      icon: Moon,
      color: 'hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-400',
      activeColor: 'bg-purple-500 text-white',
    },
    {
      id: 'air_clean',
      name: 'Lọc Không Khí',
      desc: 'Bật quạt & thông gió',
      icon: Wind,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400',
      activeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'all_off',
      name: 'Tắt Toàn Bộ',
      desc: 'Tắt nhanh mọi tải điện',
      icon: PowerOff,
      color: 'hover:border-rose-500/50 hover:bg-rose-500/10 text-rose-400',
      activeColor: 'bg-rose-500 text-white',
    },
  ];

  return (
    <div className="relative">
      {/* Toast popup */}
      {toastMessage && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-30 bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2 rounded-2xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles size={14} className="text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {scenes.map((s) => {
          const Icon = s.icon;
          const isTriggered = activeScene === s.id;

          return (
            <button
              key={s.id}
              onClick={() => handleRunScene(s.id)}
              className={cn(
                'p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-3 text-left group',
                isTriggered
                  ? s.activeColor
                  : 'bg-slate-900/60 border-slate-800/80 backdrop-blur-xl',
                s.color
              )}
            >
              <div
                className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                  isTriggered ? 'bg-white/20 text-white' : 'bg-slate-800/80 border border-slate-700'
                )}
              >
                {isTriggered ? <Check size={18} /> : <Icon size={18} />}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-100 group-hover:text-white truncate">
                  {s.name}
                </p>
                <p className="text-[10px] text-slate-400 group-hover:text-slate-200 truncate mt-0.5">
                  {s.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
