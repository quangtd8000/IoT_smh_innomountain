import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { homesApi } from '../../api/homes';
import { HomeRole } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';
import { ROLE_LABEL, roleLabel } from '../../lib/roles';

export interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({ isOpen, onClose }) => {
  const { activeHome, members, refreshHomeDetails, isOwnerOrAdmin } = useHome();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<HomeRole>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHome || !username.trim()) return;

    setLoading(true);
    setError('');
    try {
      await homesApi.addMember(activeHome.id, {
        username: username.trim(),
        role,
      });
      await refreshHomeDetails();
      setUsername('');
    } catch (err: any) {
      setError(err.message || 'Không thể thêm thành viên');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: number, memberName: string) => {
    if (!activeHome) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thành viên "${memberName}" khỏi nhà?`)) return;

    try {
      await homesApi.deleteMember(activeHome.id, userId);
      await refreshHomeDetails();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa thành viên');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thành viên"
      description={activeHome?.name}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {isOwnerOrAdmin && (
          <form onSubmit={handleAddMember} className="space-y-3">
            {error && <Notice tone="error">{error}</Notice>}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-6">
                <Input
                  label="Thêm thành viên"
                  placeholder="Tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as HomeRole)}
                  aria-label="Vai trò"
                  className="w-full min-h-11 px-3 bg-surface border border-line rounded-md text-ink text-base"
                >
                  <option value="member">{ROLE_LABEL.member}</option>
                  <option value="admin">{ROLE_LABEL.admin}</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" variant="primary" loading={loading} className="w-full">
                  Thêm
                </Button>
              </div>
            </div>
          </form>
        )}

        <div>
          <h3 className="text-sm font-medium text-ink-2 mb-2">
            Đang có ({members.length})
          </h3>

          <ul className="border border-line rounded-md overflow-hidden">
            {members.map((m) => {
              const isOwner = m.role === 'owner' || m.user_id === activeHome?.owner_id;
              const displayName = m.user?.full_name || m.user?.username || `Người dùng ${m.user_id}`;

              return (
                <li
                  key={m.user_id}
                  className="px-4 py-3 flex items-center justify-between gap-3 border-b border-line last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">{displayName}</p>
                    {/* Không bịa email khi backend không trả về */}
                    {m.user?.email && (
                      <p className="text-xs text-ink-2 truncate">{m.user.email}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-ink-2">{roleLabel(m.role)}</span>

                    {isOwnerOrAdmin && !isOwner && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id, displayName)}
                        aria-label={`Xoá ${displayName}`}
                        title={`Xoá ${displayName}`}
                        className="p-2 text-ink-2 hover:text-air-bad transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
