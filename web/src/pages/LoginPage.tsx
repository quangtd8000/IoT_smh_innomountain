import React, { useState } from 'react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Notice } from '../components/ui/Notice';
import { useAuth } from '../context/AuthContext';
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
      setError('Nhập tên đăng nhập và mật khẩu để tiếp tục.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login({ username: username.trim(), password });
    } catch (err: any) {
      setError(err.message || 'Sai tên đăng nhập hoặc mật khẩu.');
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
    <div className="min-h-screen bg-ground flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-7">
          <h1 className="font-display text-2xl font-semibold text-ink">SmartHome</h1>
          <p className="text-sm text-ink-2 mt-1">Đăng nhập để điều khiển ngôi nhà của bạn.</p>
        </div>

        <div className="plate p-5 space-y-4">
          {error && <Notice tone="error">{error}</Notice>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />

            <Input
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Đăng nhập
            </Button>
          </form>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <p className="text-ink-2">
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={onGoToRegister}
              className="text-ink underline underline-offset-2 hover:no-underline"
            >
              Tạo tài khoản
            </button>
          </p>

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            aria-expanded={showConfig}
            className="text-ink-2 underline underline-offset-2 hover:text-ink"
          >
            Địa chỉ máy chủ
          </button>

          {showConfig && (
            <div className="plate p-4 space-y-3">
              <Input
                label="Địa chỉ máy chủ"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="/api"
                helper="Mặc định là /api trên chính máy chủ này. Chỉ đổi khi backend nằm ở nơi khác."
              />
              <Button size="sm" variant="secondary" onClick={handleSaveApiUrl} className="w-full">
                Lưu và tải lại
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
