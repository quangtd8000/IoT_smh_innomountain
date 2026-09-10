import React, { useState } from 'react';
import { useHome } from '../../context/HomeContext';
import { CustomScene, SceneAction, SCENE_ICONS, SCENE_ICON_LABELS } from '../../lib/scenes';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';
import { cn } from '../../lib/utils';

export interface AddSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scene: CustomScene) => void;
}

export const AddSceneModal: React.FC<AddSceneModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { devices, rooms } = useHome();
  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('Home');
  // State: Record<channelId, 'on' | 'off' | 'ignore'>
  const [channelActions, setChannelActions] = useState<Record<number, 'on' | 'off' | 'ignore'>>({});
  const [error, setError] = useState('');

  // Thu thập tất cả các kênh công tắc trong nhà
  const allRelays: Array<{
    deviceId: number;
    deviceName: string;
    roomName: string;
    channelId: number;
    channelNum: number;
    channelName: string;
  }> = [];

  devices.forEach((dev) => {
    const room = rooms.find((r) => r.id === dev.room_id);
    const rName = room?.name || 'Chưa gán phòng';
    dev.relay_channels?.forEach((ch) => {
      allRelays.push({
        deviceId: dev.id,
        deviceName: dev.name,
        roomName: rName,
        channelId: ch.id,
        channelNum: ch.channel,
        channelName: ch.name,
      });
    });
  });

  const handleActionChange = (channelId: number, mode: 'on' | 'off' | 'ignore') => {
    setChannelActions((prev) => ({ ...prev, [channelId]: mode }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên kịch bản');
      return;
    }

    const actions: SceneAction[] = [];
    allRelays.forEach((r) => {
      const mode = channelActions[r.channelId] || 'ignore';
      if (mode === 'on') {
        actions.push({
          deviceId: r.deviceId,
          channelId: r.channelId,
          targetState: true,
          deviceName: r.deviceName,
          channelName: r.channelName,
        });
      } else if (mode === 'off') {
        actions.push({
          deviceId: r.deviceId,
          channelId: r.channelId,
          targetState: false,
          deviceName: r.deviceName,
          channelName: r.channelName,
        });
      }
    });

    const newScene: CustomScene = {
      id: `scene_${Date.now()}`,
      name: name.trim(),
      iconName,
      isCustom: true,
      actions,
    };

    onSave(newScene);
    setName('');
    setIconName('Home');
    setChannelActions({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm kịch bản mới"
      description="Tạo kịch bản tự động hoá để kích hoạt hàng loạt công tắc chỉ với 1 chạm."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}

        <Input
          label="Tên kịch bản"
          placeholder="VD: Tiếp khách, Xem phim, Ra ngoài, Nấu ăn..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        {/* Chọn biểu tượng */}
        <div>
          <label className="block text-xs font-medium text-ink-2 mb-1.5">
            Biểu tượng đại diện
          </label>
          <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
            {Object.keys(SCENE_ICONS).map((key) => {
              const Icon = SCENE_ICONS[key];
              const isSelected = iconName === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIconName(key)}
                  title={SCENE_ICON_LABELS[key] || key}
                  className={cn(
                    'h-10 rounded-md border flex items-center justify-center transition-colors',
                    isSelected
                      ? 'border-ink bg-sunken text-ink shadow-sm'
                      : 'border-line bg-surface text-ink-2 hover:bg-sunken hover:text-ink'
                  )}
                >
                  <Icon size={18} strokeWidth={isSelected ? 2.25 : 1.75} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Thiết lập hành động công tắc */}
        <div className="pt-2 border-t border-line space-y-2">
          <label className="block text-xs font-medium text-ink-2">
            Hành động cho các công tắc khi kích hoạt ({allRelays.length} công tắc trong nhà)
          </label>

          {allRelays.length === 0 ? (
            <p className="text-xs text-ink-2">Chưa có công tắc nào trong ngôi nhà.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {allRelays.map((r) => {
                const currentMode = channelActions[r.channelId] || 'ignore';
                return (
                  <div
                    key={r.channelId}
                    className="flex items-center justify-between gap-2 p-2 rounded-md bg-surface border border-line/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-ink truncate">{r.channelName}</p>
                      <p className="text-[11px] text-ink-2 truncate">
                        {r.roomName} · {r.deviceName}
                      </p>
                    </div>

                    <div className="flex rounded-md border border-line overflow-hidden flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleActionChange(r.channelId, 'on')}
                        className={cn(
                          'px-2 py-1 text-xs transition-colors',
                          currentMode === 'on'
                            ? 'bg-live text-black font-medium'
                            : 'text-ink-2 hover:bg-sunken'
                        )}
                      >
                        Bật
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActionChange(r.channelId, 'off')}
                        className={cn(
                          'px-2 py-1 text-xs transition-colors border-x border-line',
                          currentMode === 'off'
                            ? 'bg-ink text-surface font-medium'
                            : 'text-ink-2 hover:bg-sunken'
                        )}
                      >
                        Tắt
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActionChange(r.channelId, 'ignore')}
                        className={cn(
                          'px-2 py-1 text-xs transition-colors',
                          currentMode === 'ignore'
                            ? 'bg-sunken text-ink font-medium'
                            : 'text-ink-2 hover:bg-sunken'
                        )}
                      >
                        Giữ nguyên
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-line">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="primary">
            Tạo kịch bản
          </Button>
        </div>
      </form>
    </Modal>
  );
};
