import React, { useState } from 'react';
import { useHome } from '../context/HomeContext';
import { useAuth } from '../context/AuthContext';
import { homesApi } from '../api/homes';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ManageMembersModal } from '../components/homes/ManageMembersModal';
import { getBaseUrl, setBaseUrl } from '../api/client';
import {
  Settings,
  Home,
  Users,
  Server,
  User,
  Trash2,
  Save,
  CheckCircle,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { activeHome, userRole, isOwnerOrAdmin, refreshHomes } = useHome();
  const { user } = useAuth();
  const [homeName, setHomeName] = useState(activeHome?.name || '');
  const [apiUrl, setApiUrl] = useState(getBaseUrl());
  const [savingHome, setSavingHome] = useState(false);
  const [homeMsg, setHomeMsg] = useState<string | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const handleUpdateHome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHome || !homeName.trim()) return;

    setSavingHome(true);
    setHomeMsg(null);
    try {
      await homesApi.updateHome(activeHome.id, homeName.trim());
      await refreshHomes();
      setHomeMsg('Đã cập nhật tên ngôi nhà thành công!');
      setTimeout(() => setHomeMsg(null), 2500);
    } catch (err: any) {
      setHomeMsg(`Lỗi: ${err.message}`);
    } finally {
      setSavingHome(false);
    }
  };

  const handleDeleteHome = async () => {
    if (!activeHome) return;
    if (
      !window.confirm(
        `CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn xóa vĩnh viễn ngôi nhà "${activeHome.name}" cùng toàn bộ phòng, thiết bị và dữ liệu liên quan?`
      )
    ) {
      return;
    }
    try {
      await homesApi.deleteHome(activeHome.id);
      await refreshHomes();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa ngôi nhà');
    }
  };

  const handleSaveApiUrl = () => {
    setBaseUrl(apiUrl);
    alert('Đã cập nhật URL API Backend. Trang sẽ được tải lại.');
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-base font-bold text-slate-100">Cài Đặt Hệ Thống</h3>
        <p className="text-xs text-slate-400">
          Quản lý thông tin ngôi nhà, thành viên gia đình và kết nối máy chủ
        </p>
      </div>

      {/* Home Settings Card */}
      {activeHome && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                <Home className="text-blue-400" size={18} />
                Thông Tin Ngôi Nhà
              </CardTitle>
              <CardDescription>Cập nhật tên hoặc cấu hình của ngôi nhà hiện tại</CardDescription>
            </div>
            <Badge variant="warning" className="text-xs uppercase font-bold">
              Vai trò của bạn: {userRole}
            </Badge>
          </CardHeader>

          {homeMsg && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-medium">
              {homeMsg}
            </div>
          )}

          <form onSubmit={handleUpdateHome} className="space-y-4">
            <Input
              label="Tên Ngôi Nhà"
              value={homeName}
              onChange={(e) => setHomeName(e.target.value)}
              disabled={!isOwnerOrAdmin}
              helper={!isOwnerOrAdmin ? 'Chỉ Owner hoặc Admin mới có quyền đổi tên nhà' : ''}
            />

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowMembersModal(true)}
              >
                <Users size={14} />
                Quản lý thành viên ({activeHome.name})
              </Button>

              {isOwnerOrAdmin && (
                <Button type="submit" variant="primary" size="sm" loading={savingHome}>
                  <Save size={14} />
                  Lưu Thay Đổi
                </Button>
              )}
            </div>
          </form>

          {/* Danger Zone: Delete Home */}
          {userRole === 'owner' && (
            <div className="mt-6 pt-5 border-t border-rose-500/20 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-semibold text-rose-400">Xóa Ngôi Nhà Này</h5>
                <p className="text-[11px] text-slate-500">
                  Hành động này không thể hoàn tác, sẽ xóa sạch toàn bộ thiết bị và dữ liệu cảm biến.
                </p>
              </div>
              <Button variant="danger" size="sm" onClick={handleDeleteHome}>
                <Trash2 size={14} />
                Xóa Vĩnh Viễn
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Backend API Connection Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              <Server className="text-cyan-400" size={18} />
              Máy Chủ Kết Nối (FastAPI Server)
            </CardTitle>
            <CardDescription>
              Đường dẫn REST API Backend (Mặc định máy chủ Ubuntu IP 192.168.1.35)
            </CardDescription>
          </div>
        </CardHeader>

        <div className="space-y-4">
          <Input
            label="API Base URL Prefix"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://192.168.1.35:8000/api"
            helper="Ví dụ: http://192.168.1.35:8000/api hoặc http://localhost:8000/api"
          />

          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={handleSaveApiUrl}>
              <Save size={14} />
              Lưu & Kết Nối Lại
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              <User className="text-purple-400" size={18} />
              Thông Tin Tài Khoản
            </CardTitle>
            <CardDescription>Tài khoản người dùng đang đăng nhập</CardDescription>
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">Tên đăng nhập</span>
            <span className="font-semibold text-slate-200">{user?.username}</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">Email</span>
            <span className="font-semibold text-slate-200">{user?.email}</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">Họ và tên</span>
            <span className="font-semibold text-slate-200">{user?.full_name || 'Chưa cập nhật'}</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">User ID trong Database</span>
            <span className="font-mono font-semibold text-blue-400">#{user?.id}</span>
          </div>
        </div>
      </Card>

      {/* Manage Members Modal */}
      {showMembersModal && (
        <ManageMembersModal
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
        />
      )}
    </div>
  );
};
