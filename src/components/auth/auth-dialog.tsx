'use client';

import { useState } from 'react';
import { LogIn, UserPlus, AlertCircle, CheckCircle2, KeyRound, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';

export function AuthDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isConfigured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError('Chưa cấu hình NEXT_PUBLIC_SUPABASE_URL và ANON_KEY trong .env.local');
      return;
    }

    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải từ 6 ký tự trở lên');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
        } else if (data.session) {
          setMessage('Đăng ký tài khoản thành công!');
          setTimeout(() => {
            onOpenChange(false);
            onSuccess?.();
          }, 800);
        } else {
          setMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản (nếu bật confirm email).');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message === 'Invalid login credentials'
            ? 'Email hoặc mật khẩu không chính xác'
            : signInError.message
          );
        } else {
          setMessage('Đăng nhập thành công!');
          setTimeout(() => {
            onOpenChange(false);
            onSuccess?.();
          }, 600);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="auth-dialog-content">
        <DialogTitle className="auth-title">
          {mode === 'signin' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Tài Khoản'}
        </DialogTitle>
        <DialogDescription className="auth-description">
          Đăng nhập để lưu trữ vĩnh viễn kho vật phẩm và diễn viên bạn đã quay được.
        </DialogDescription>

        {!isConfigured && (
          <div className="auth-notice-box">
            <AlertCircle size={16} />
            <span>
              Chưa thiết lập Supabase trong <code>.env.local</code>. Hãy thêm <code>NEXT_PUBLIC_SUPABASE_URL</code> và <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> để bật tính năng đám mây.
            </span>
          </div>
        )}

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setMode('signin');
              setError(null);
              setMessage(null);
            }}
          >
            <LogIn size={15} /> Đăng nhập
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup');
              setError(null);
              setMessage(null);
            }}
          >
            <UserPlus size={15} /> Đăng ký
          </button>
        </div>

        {error && (
          <div className="auth-error-message" role="alert">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="auth-success-message" role="status">
            <CheckCircle2 size={15} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-input-icon" />
              <input
                id="auth-email"
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Mật khẩu</label>
            <div className="auth-input-wrapper">
              <KeyRound size={16} className="auth-input-icon" />
              <input
                id="auth-password"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Đang xử lý…' : mode === 'signin' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
