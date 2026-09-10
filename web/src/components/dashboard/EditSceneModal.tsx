import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { CustomScene, SceneAction, SCENE_ICONS, SCENE_ICON_LABELS } from '../../lib/scenes';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';
import { cn } from '../../lib/utils';

export interface EditSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: CustomScene;
  onUpdate: (scene: CustomScene) => void;
  onDelete?: (sceneId: string) => void;
}

export const EditSceneModal: React.FC<EditSceneModalProps> = ({
  isOpen,
  onClose,
  scene,
  onUpdate,
  onDelete,
}) => {
  const { devices, rooms } = useHome();
  const [name, setName] = useState(scene.name);
  const [iconName, setIconName] = useState(scene.iconName || 'Home');
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

  useEffect(() => {
    setName(scene.name);
    setIconName(scene.iconName || 'Home');
    const map: Record<number, 'on' | 'off' | 'ignore'> = {};
    (scene.actions || []).forEach((act) => {
      map[act.channelId] = act.targetState ? 'on' : 'off';
    });
    setChannelActions(map);
    setError('');
  }, [scene, isOpen]);

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

    const updatedScene: CustomScene = {
      ...scene,
      name: name.trim(),
      iconName,
      actions,
    };

    onUpdate(updatedScene);
    onClose();
  };

  const handleDelete = () => {
    if (!window.confirm(`Xoá kịch bản “${scene.name}”?`)) return;
    onDelete?.(scene.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa kịch bản"
      description={`Cài đặt tên gọi, biểu tượng và các công tắc điều khiển cho kịch bản.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}

        <Input
          label="Tên kịch bản"
          placeholder="VD: Tiếp khách, Xem phim, Ra ngoài..."
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
            Hành động cho các công tắc ({allRelays.length} công tắc)
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

        <div className="flex items-center justify-between pt-3 border-t border-line">
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-xs text-air-bad hover:bg-air-bad/10 flex items-center gap-1"
            >
              <Trash2 size={13} />
              <span>Xoá kịch bản</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
