import React, { useState } from 'react';
import { Zap, Lock, User, Server } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { getBaseUrl, setBaseUrl } from '../api/client';

export interface LoginPageProps {
  onGoToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onGoToRegister }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [apiUrl, setApiUrl] = useState(getBaseUrl());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login({ username: username.trim(), password });
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiUrl = () => {
    setBaseUrl(apiUrl);
    setShowConfig(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-blue-500/25">
            <Zap size={30} className="fill-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">SmartHome Control</h2>
          <p className="text-xs text-slate-400 mt-1">Hệ Thống Quản Lý & Điều Khiển Nhà Thông Minh</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tên đăng nhập"
            placeholder="quang"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Input
            label="Mật khẩu"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" loading={loading} className="w-full py-3 mt-2">
            Đăng Nhập
          </Button>
        </form>

        {/* Footer info & Register link */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-3">
          <p className="text-xs text-slate-400">
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={onGoToRegister}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              Đăng ký ngay
            </button>
          </p>

          <div>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="text-[11px] text-slate-500 hover:text-slate-400 flex items-center gap-1 mx-auto transition-colors"
            >
              <Server size={12} />
              <span>Cấu hình địa chỉ Server API</span>
            </button>
          </div>

          {showConfig && (
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 mt-2 text-left">
              <Input
                label="API URL Prefix"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://192.168.1.35:8000/api"
              />
              <Button size="sm" variant="secondary" onClick={handleSaveApiUrl} className="w-full">
                Lưu địa chỉ
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
