import React, { useState } from 'react';
import { Lightbulb, Zap, AlertCircle, Fan, Power, CheckCheck, ToggleLeft } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { Switch } from '../ui/Switch';
import { cn } from '../../lib/utils';

export const QuickRelays: React.FC = () => {
  const { devices, rooms, toggleRelayChannel } = useHome();
  const [selectedRoom, setSelectedRoom] = useState<number | 'all'>('all');

  // Flatten all relay channels with their parent device & room
  const relayList = React.useMemo(() => {
    const list: Array<{
      device: typeof devices[0];
      channel: NonNullable<typeof devices[0]['relay_channels']>[0];
      roomName: string;
      roomId?: number | null;
    }> = [];

    devices.forEach((dev) => {
      const room = rooms.find((r) => r.id === dev.room_id);
      dev.relay_channels?.forEach((ch) => {
        list.push({
          device: dev,
          channel: ch,
          roomName: room?.name || 'Chưa gán phòng',
          roomId: dev.room_id,
        });
      });
    });

    return list;
  }, [devices, rooms]);

  const filteredRelays = relayList.filter((r) => {
    if (selectedRoom === 'all') return true;
    return r.roomId === selectedRoom;
  });

  const activeCount = relayList.filter((r) => r.channel.state).length;

  const handleToggleAll = async (targetState: boolean) => {
    for (const item of filteredRelays) {
      if (item.channel.state !== targetState) {
        await toggleRelayChannel(item.device.id, item.channel.id, item.channel.state);
      }
    }
  };

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Zap size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-100">Công Tắc & Tải Điện Nhanh</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Bật/tắt các kênh Relay và đèn trực tiếp theo thời gian thực (MQTT 1883)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filteredRelays.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleToggleAll(true)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold transition-colors"
              >
                Bật hết
              </button>
              <button
                onClick={() => handleToggleAll(false)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold transition-colors"
              >
                Tắt hết
              </button>
            </div>
          )}

          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-amber-400 font-bold">{activeCount}</span>/{relayList.length} Đang Bật
          </span>
        </div>
      </div>

      {/* Room Filter Pills */}
      {rooms.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 border-b border-slate-800/60 scrollbar-none">
          <button
            onClick={() => setSelectedRoom('all')}
            className={cn(
              'px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
              selectedRoom === 'all'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
            )}
          >
            Tất Cả ({relayList.length})
          </button>
          {rooms.map((r) => {
            const count = relayList.filter((item) => item.roomId === r.id).length;
            const isSelected = selectedRoom === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoom(r.id)}
                className={cn(
                  'px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
                  isSelected
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                )}
              >
                {r.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Relays Grid */}
      <div className="pt-4 flex-1">
        {filteredRelays.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/60">
            <AlertCircle size={32} className="mx-auto mb-2 opacity-50 text-slate-400" />
            <p className="text-sm font-medium text-slate-300">Chưa có kênh Relay nào trong mục này.</p>
            <p className="text-xs text-slate-500 mt-1">
              Hãy vào tab "Phòng & Thiết Bị" để đăng ký thiết bị ESP32 và thêm kênh Relay.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredRelays.map(({ device, channel, roomName }) => {
              const isOnline = device.status === 'online';
              const isOn = channel.state;
              const isFan = channel.name.toLowerCase().includes('quạt') || channel.channel === 2;

              return (
                <div
                  key={`${device.id}-${channel.id}`}
                  className={cn(
                    'p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group',
                    isOn
                      ? 'bg-gradient-to-br from-amber-500/15 via-slate-900/90 to-slate-900/90 border-amber-500/30 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={cn(
                        'h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-300',
                        isOn
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner'
                          : 'bg-slate-800/80 text-slate-500 border border-slate-700/60'
                      )}
                    >
                      {isFan ? (
                        <Fan size={22} className={isOn ? 'animate-spin text-cyan-400' : ''} />
                      ) : (
                        <Lightbulb size={22} className={isOn ? 'fill-amber-400 text-amber-400 animate-pulse-subtle' : ''} />
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">
                        {channel.name}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-400 font-medium">{roomName}</span>
                        <span className="text-slate-600 text-[10px]">•</span>
                        <span
                          className={cn(
                            'text-[10px] font-semibold flex items-center gap-1',
                            isOnline ? 'text-emerald-400' : 'text-slate-500'
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                            )}
                          />
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Switch
                      checked={channel.state}
                      onChange={() => toggleRelayChannel(device.id, channel.id, channel.state)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
