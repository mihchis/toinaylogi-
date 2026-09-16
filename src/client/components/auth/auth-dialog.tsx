'use client';

import { useState } from 'react';
import { LogIn, UserPlus, AlertCircle, CheckCircle2, KeyRound, Mail, User as UserIcon, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';

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
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isConfigured = isSupabaseConfigured();
  const { signInLocal } = useAuth();

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }
    signInLocal(displayName.trim());
    setMessage('Tạo hồ sơ thành công!');
    setTimeout(() => {
      onOpenChange(false);
      onSuccess?.();
    }, 600);
  };

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError('Chưa cấu hình Supabase Cloud');
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
          setMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(
            signInError.message === 'Invalid login credentials'
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
          {!isConfigured ? 'Hồ Sơ Người Chơi' : mode === 'signin' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Tài Khoản'}
        </DialogTitle>
        <DialogDescription className="auth-description">
          {!isConfigured
            ? 'Tạo tên người chơi để cá nhân hóa hòm đồ và theo dõi vật phẩm bạn đã quay được.'
            : 'Đăng nhập để đồng bộ kho vật phẩm và diễn viên trên đám mây.'}
        </DialogDescription>

        {!isConfigured ? (
          /* Giao diện Đăng nhập / Tạo Hồ Sơ Nhanh khi chưa cần Supabase Cloud */
          <form onSubmit={handleLocalSubmit} className="auth-form">
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

            <div className="auth-input-group">
              <label htmlFor="auth-display-name">Tên hoặc Biệt danh của bạn</label>
              <div className="auth-input-wrapper">
                <UserIcon size={16} />
                <input
                  id="auth-display-name"
                  type="text"
                  placeholder="Ví dụ: VIP Member, Dũng Sĩ..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={30}
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">
              <Sparkles size={16} />
              <span>Bắt Đầu Trải Nghiệm</span>
            </button>

            <div className="auth-cloud-hint">
              <small>
                💡 Để đồng bộ đám mây nhiều thiết bị: Điền URL và Anon Key vào file <code>.env.local</code>.
              </small>
            </div>
          </form>
        ) : (
          /* Giao diện Supabase Cloud Đầy Đủ */
          <>
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

            <form onSubmit={handleSupabaseSubmit} className="auth-form">
              <div className="auth-input-group">
                <label htmlFor="auth-email">Email</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} />
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="auth-password">Mật khẩu</label>
                <div className="auth-input-wrapper">
                  <KeyRound size={16} />
                  <input
                    id="auth-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span>Đang xử lý...</span>
                ) : mode === 'signin' ? (
                  <>
                    <LogIn size={16} />
                    <span>Đăng nhập</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Tạo tài khoản</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
