import React, { useState } from 'react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Notice } from '../components/ui/Notice';
import { useAuth } from '../context/AuthContext';

export interface RegisterPageProps {
  onGoToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onGoToLogin }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setError('Điền tên đăng nhập, email và mật khẩu để tiếp tục.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Hai ô mật khẩu chưa giống nhau.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
      });
      setSuccess('Đã tạo tài khoản. Đang chuyển sang trang đăng nhập.');
      setTimeout(() => {
        onGoToLogin();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Không tạo được tài khoản. Thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ground flex items-center justify-center p-4">
      <div className="w-full max-w-sm py-8">
        <div className="mb-7">
          <h1 className="font-display text-2xl font-semibold text-ink">Tạo tài khoản</h1>
          <p className="text-sm text-ink-2 mt-1">Để bắt đầu điều khiển ngôi nhà.</p>
        </div>

        <div className="plate p-5 space-y-4">
          {error && <Notice tone="error">{error}</Notice>}
          {success && <Notice tone="success">{success}</Notice>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <Input
              label="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              helper="Không bắt buộc. Đây là tên hiện cho các thành viên khác."
            />

            <Input
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <Input
              label="Nhập lại mật khẩu"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Tạo tài khoản
            </Button>
          </form>
        </div>

        <p className="mt-5 text-sm text-ink-2">
          Đã có tài khoản?{' '}
          <button
            type="button"
            onClick={onGoToLogin}
            className="text-ink underline underline-offset-2 hover:no-underline"
          >
            Đăng nhập
          </button>
        </p>
      </div>
    </div>
  );
};
