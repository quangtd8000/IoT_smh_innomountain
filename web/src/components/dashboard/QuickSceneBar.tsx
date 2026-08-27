import React, { useState, useEffect } from 'react';
import { Plus, Settings2, Home, Moon, Wind, PowerOff, Sparkles } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { matchesAny, KEYWORDS } from '../../lib/text';
import {
  CustomScene,
  SCENE_ICONS,
  getHomeScenes,
  saveHomeScenes,
} from '../../lib/scenes';
import { AddSceneModal } from './AddSceneModal';
import { EditSceneModal } from './EditSceneModal';
import { cn } from '../../lib/utils';

export const QuickSceneBar: React.FC = () => {
  const { activeHome, devices, toggleRelayChannel, isOwnerOrAdmin } = useHome();
  const [scenes, setScenes] = useState<CustomScene[]>([]);
  const [runningScene, setRunningScene] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingScene, setEditingScene] = useState<CustomScene | null>(null);

  useEffect(() => {
    if (activeHome) {
      setScenes(getHomeScenes(activeHome.id));
    }
  }, [activeHome?.id]);

  const handleSaveNewScene = (newScene: CustomScene) => {
    if (!activeHome) return;
    const updated = [...scenes, newScene];
    setScenes(updated);
    saveHomeScenes(activeHome.id, updated);
  };

  const handleUpdateScene = (updatedScene: CustomScene) => {
    if (!activeHome) return;
    const updated = scenes.map((s) => (s.id === updatedScene.id ? updatedScene : s));
    setScenes(updated);
    saveHomeScenes(activeHome.id, updated);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (!activeHome) return;
    const updated = scenes.filter((s) => s.id !== sceneId);
    setScenes(updated);
    saveHomeScenes(activeHome.id, updated);
  };

  const handleRunScene = async (scene: CustomScene) => {
    setRunningScene(scene.id);
    setResult(null);

    // Nếu là kịch bản có actions cụ thể đã được cấu hình
    if (scene.actions && scene.actions.length > 0) {
      let count = 0;
      for (const act of scene.actions) {
        // Tìm trạng thái hiện tại của kênh
        const dev = devices.find((d) => d.id === act.deviceId);
        const ch = dev?.relay_channels?.find((c) => c.id === act.channelId);
        if (ch && ch.state !== act.targetState) {
          await toggleRelayChannel(act.deviceId, act.channelId, ch.state);
          count++;
        }
      }
      setResult(`Đã kích hoạt kịch bản “${scene.name}” (${count} công tắc thay đổi)`);
      setRunningScene(null);
      return;
    }

    // Xử lý mặc định thông minh theo tên / id mẫu
    const allChannels = devices.flatMap((device) =>
      (device.relay_channels ?? []).map((channel) => ({ device, channel }))
    );

    if (scene.id === 'all_off' || scene.iconName === 'PowerOff') {
      const targets = allChannels.filter((t) => t.channel.state);
      for (const t of targets) {
        await toggleRelayChannel(t.device.id, t.channel.id, t.channel.state);
      }
      setResult(targets.length ? `Đã tắt hết — ${targets.length} công tắc` : 'Mọi thứ đã tắt sẵn');
    } else if (scene.id === 'arrive_home' || scene.iconName === 'Home') {
      const targets = devices
        .filter((d) => d.relay_channels?.length)
        .map((d) => ({ device: d, channel: d.relay_channels![0] }))
        .filter((t) => !t.channel.state);
      for (const t of targets) {
        await toggleRelayChannel(t.device.id, t.channel.id, t.channel.state);
      }
      setResult(
        targets.length ? `Đã về nhà — bật ${targets.length} đèn chính` : 'Các đèn chính đã bật sẵn'
      );
    } else if (scene.id === 'good_night' || scene.iconName === 'Moon') {
      const lights = allChannels.filter((t) => matchesAny(t.channel.name, KEYWORDS.light));
      if (lights.length === 0) {
        setResult('Chưa nhận ra kênh nào là đèn. Đổi tên kênh có chữ “đèn” hoặc “light”.');
      } else {
        const targets = lights.filter((t) => t.channel.state);
        for (const t of targets) {
          await toggleRelayChannel(t.device.id, t.channel.id, t.channel.state);
        }
        setResult(targets.length ? `Đã đi ngủ — tắt ${targets.length} đèn` : 'Đèn đã tắt sẵn');
      }
    } else if (scene.id === 'air_clean' || scene.iconName === 'Wind') {
      const fans = allChannels.filter((t) => matchesAny(t.channel.name, KEYWORDS.fan));
      if (fans.length === 0) {
        setResult('Chưa nhận ra kênh nào là quạt. Đổi tên kênh có chữ “quạt” hoặc “fan”.');
      } else {
        const targets = fans.filter((t) => !t.channel.state);
        for (const t of targets) {
          await toggleRelayChannel(t.device.id, t.channel.id, t.channel.state);
        }
        setResult(
          targets.length ? `Đã lọc không khí — bật ${targets.length} quạt` : 'Quạt đã chạy sẵn'
        );
      }
    } else {
      setResult(`Đã thực hiện kịch bản “${scene.name}”`);
    }

    setRunningScene(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <h2 className="text-sm font-medium text-ink-2">Kịch bản nhanh</h2>
        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="text-xs text-ink-2 hover:text-ink flex items-center gap-1 transition-colors"
          >
            <Plus size={13} aria-hidden="true" />
            Thêm kịch bản
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {scenes.map((s) => {
          const Icon = SCENE_ICONS[s.iconName] || Sparkles;
          const isRunning = runningScene === s.id;
          return (
            <div
              key={s.id}
              className={cn(
                'group relative min-h-12 px-3 rounded-md border border-line bg-surface text-ink',
                'flex items-center justify-between gap-2 text-sm',
                'transition-colors duration-150 hover:bg-sunken'
              )}
            >
              <button
                type="button"
                onClick={() => handleRunScene(s)}
                disabled={runningScene !== null}
                className="flex-1 flex items-center gap-2 py-2 text-left min-w-0 disabled:opacity-45 disabled:pointer-events-none"
              >
                <Icon size={17} strokeWidth={1.75} aria-hidden="true" className="flex-shrink-0" />
                <span className="truncate">{isRunning ? 'Đang chạy' : s.name}</span>
              </button>

              {isOwnerOrAdmin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingScene(s);
                  }}
                  title={`Chỉnh sửa kịch bản ${s.name}`}
                  className="opacity-0 group-hover:opacity-100 p-1 text-ink-2 hover:text-ink transition-opacity rounded"
                >
                  <Settings2 size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-ink-2">
        {result}
      </p>

      {showAddModal && (
        <AddSceneModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveNewScene}
        />
      )}

      {editingScene && (
        <EditSceneModal
          isOpen={editingScene !== null}
          onClose={() => setEditingScene(null)}
          scene={editingScene}
          onUpdate={handleUpdateScene}
          onDelete={handleDeleteScene}
        />
      )}
    </div>
  );
};
