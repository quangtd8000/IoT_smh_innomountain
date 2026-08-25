import React, { useState } from 'react';
import { Users, UserPlus, Trash2, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { homesApi } from '../../api/homes';
import { HomeRole } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

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
      title="Quản Lý Thành Viên & Phân Quyền"
      description={`Danh sách thành viên trong ngôi nhà "${activeHome?.name}"`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Add Member Form (Only for Owner/Admin) */}
        {isOwnerOrAdmin && (
          <form
            onSubmit={handleAddMember}
            className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3"
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <UserPlus size={14} className="text-blue-400" />
              Mời / Thêm thành viên
            </h4>

            {error && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <Input
                  placeholder="Nhập username thành viên..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as HomeRole)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="member">Thành viên (Member)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" variant="primary" loading={loading} className="w-full h-full">
                  Thêm
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Member list table */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users size={14} className="text-purple-400" />
            Thành viên hiện tại ({members.length})
          </h4>

          <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
            {members.map((m) => {
              const isOwner = m.role === 'owner' || m.user_id === activeHome?.owner_id;
              const displayName = m.user?.full_name || m.user?.username || `User #${m.user_id}`;
              const email = m.user?.email || 'user@smarthome.local';

              return (
                <div
                  key={m.user_id}
                  className="p-3.5 flex items-center justify-between bg-slate-900/50 hover:bg-slate-900/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                      <UserIcon size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{displayName}</p>
                      <p className="text-[11px] text-slate-400">{email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        isOwner ? 'warning' : m.role === 'admin' ? 'info' : 'neutral'
                      }
                      className="text-[11px] uppercase font-bold"
                    >
                      <ShieldCheck size={12} />
                      {m.role}
                    </Badge>

                    {isOwnerOrAdmin && !isOwner && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id, displayName)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Xóa thành viên"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
