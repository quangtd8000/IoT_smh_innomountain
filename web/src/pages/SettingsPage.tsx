import React, { useState } from 'react';
import { Users, Trash2 } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemePref } from '../context/ThemeContext';
import { homesApi } from '../api/homes';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Notice } from '../components/ui/Notice';
import { ManageMembersModal } from '../components/homes/ManageMembersModal';
import { getBaseUrl, setBaseUrl } from '../api/client';
import { cn } from '../lib/utils';
import { roleLabel } from '../lib/roles';

const THEME_OPTIONS: { id: ThemePref; label: string }[] = [
  { id: 'light', label: 'Sáng' },
  { id: 'dark', label: 'Tối' },
  { id: 'system', label: 'Theo hệ thống' },
];

export const SettingsPage: React.FC = () => {
  const { activeHome, userRole, isOwnerOrAdmin, refreshHomes } = useHome();
  const { user } = useAuth();
  const { pref, setPref } = useTheme();
  const [homeName, setHomeName] = useState(activeHome?.name || '');
  const [apiUrl, setApiUrl] = useState(getBaseUrl());
  const [savingHome, setSavingHome] = useState(false);
  const [homeMsg, setHomeMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const handleUpdateHome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHome || !homeName.trim()) return;

    setSavingHome(true);
    setHomeMsg(null);
    try {
      await homesApi.updateHome(activeHome.id, homeName.trim());
      await refreshHomes();
      setHomeMsg({ tone: 'success', text: 'Đã đổi tên nhà.' });
      setTimeout(() => setHomeMsg(null), 2500);
    } catch (err: any) {
      setHomeMsg({ tone: 'error', text: err.message || 'Không đổi được tên nhà.' });
    } finally {
      setSavingHome(false);
    }
  };

  const handleDeleteHome = async () => {
    if (!activeHome) return;
    if (
      !window.confirm(
        `Xoá nhà “${activeHome.name}” cùng toàn bộ phòng, thiết bị và số liệu? Không khôi phục lại được.`
      )
    ) {
      return;
    }
    setDeleteError(null);
    try {
      await homesApi.deleteHome(activeHome.id);
      await refreshHomes();
    } catch (err: any) {
      setDeleteError(err.message || 'Không xoá được nhà.');
    }
  };

  const handleSaveApiUrl = () => {
    setBaseUrl(apiUrl);
    window.location.reload();
  };

  const account = [
    { label: 'Tên đăng nhập', value: user?.username },
    { label: 'Email', value: user?.email },
    { label: 'Họ và tên', value: user?.full_name || 'Chưa đặt' },
    { label: 'Mã người dùng', value: user?.id != null ? String(user.id) : '—' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {activeHome && (
        <section className="plate p-5 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-ink-2">Ngôi nhà</h2>
            <span className="text-xs text-ink-2">{roleLabel(userRole)}</span>
          </div>

          {homeMsg && <Notice tone={homeMsg.tone}>{homeMsg.text}</Notice>}

          <form onSubmit={handleUpdateHome} className="space-y-4">
            <Input
              label="Tên nhà"
              value={homeName}
              onChange={(e) => setHomeName(e.target.value)}
              disabled={!isOwnerOrAdmin}
              helper={!isOwnerOrAdmin ? 'Chỉ chủ nhà hoặc quản trị mới đổi được tên.' : undefined}
            />

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowMembersModal(true)}>
                <Users size={14} aria-hidden="true" />
                Thành viên
              </Button>

              {isOwnerOrAdmin && (
                <Button type="submit" variant="primary" size="sm" loading={savingHome}>
                  Lưu
                </Button>
              )}
            </div>
          </form>

          {userRole === 'owner' && (
            <div className="pt-4 border-t border-line space-y-3">
              {deleteError && <Notice tone="error">{deleteError}</Notice>}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-ink-2 flex-1 min-w-[12rem]">
                  Xoá nhà sẽ xoá luôn mọi phòng, thiết bị và số liệu. Không khôi phục lại được.
                </p>
                <Button variant="danger" size="sm" onClick={handleDeleteHome}>
                  <Trash2 size={14} aria-hidden="true" />
                  Xoá nhà
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="plate p-5 space-y-3">
        <h2 className="text-sm font-medium text-ink-2">Giao diện</h2>
        <div
          role="radiogroup"
          aria-label="Nền sáng hoặc tối"
          className="flex rounded-md border border-line overflow-hidden w-fit"
        >
          {THEME_OPTIONS.map((o) => (
            <button
              key={o.id}
              role="radio"
              aria-checked={pref === o.id}
              onClick={() => setPref(o.id)}
              className={cn(
                'min-h-9 px-3 text-sm transition-colors duration-150',
                pref === o.id ? 'bg-sunken text-ink font-medium' : 'text-ink-2 hover:bg-sunken'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <section className="plate p-5 space-y-4">
        <h2 className="text-sm font-medium text-ink-2">Máy chủ</h2>
        <Input
          label="Địa chỉ máy chủ"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="http://192.168.1.35:8000/api"
          helper="Đổi khi máy chủ chạy ở địa chỉ khác. Trang sẽ tải lại sau khi lưu."
        />
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={handleSaveApiUrl}>
            Lưu và tải lại
          </Button>
        </div>
      </section>

      <section className="plate p-5">
        <h2 className="text-sm font-medium text-ink-2 mb-3">Tài khoản</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {account.map((a) => (
            <div key={a.label}>
              <dt className="text-xs text-ink-2">{a.label}</dt>
              <dd className="text-sm text-ink break-words">{a.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {showMembersModal && (
        <ManageMembersModal isOpen={showMembersModal} onClose={() => setShowMembersModal(false)} />
      )}
    </div>
  );
};
