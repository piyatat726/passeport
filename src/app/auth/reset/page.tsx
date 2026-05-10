'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('密碼需至少 6 個字元');
      return;
    }
    if (password !== confirmPassword) {
      setError('兩次密碼不一致');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const msg = error.message.toLowerCase().includes('same')
          ? '新密碼不能與舊密碼相同'
          : error.message;
        setError(msg);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/'), 2000);
      }
    } catch {
      setError('發生錯誤，請再試一次');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <svg className="w-9 h-9 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="font-playfair italic text-2xl tracking-editorial text-ink mb-3">
            PASSWORD UPDATED
          </h1>
          <p className="font-noto text-taupe text-sm leading-relaxed">
            密碼已成功更新，即將跳轉⋯⋯
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-14">
          <h1 className="font-playfair italic text-3xl tracking-editorial text-ink mb-3">
            NEW PASSWORD
          </h1>
          <p className="font-noto text-taupe text-sm tracking-wide">
            設定你的新密碼
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-3.5">
          <input
            type="password"
            placeholder="新密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-surface border border-border rounded-lg text-sm text-ink placeholder:text-taupe/60 focus:outline-none focus:border-taupe transition-colors font-noto"
            required
            autoComplete="new-password"
            minLength={6}
          />

          <input
            type="password"
            placeholder="確認新密碼"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-surface border border-border rounded-lg text-sm text-ink placeholder:text-taupe/60 focus:outline-none focus:border-taupe transition-colors font-noto"
            required
            autoComplete="new-password"
            minLength={6}
          />

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <p className="text-red-600 text-xs font-noto leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-ink text-cream rounded-lg text-sm font-medium tracking-editorial uppercase font-inter hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                更新中...
              </span>
            ) : 'UPDATE PASSWORD'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/auth')}
            className="text-taupe text-sm font-noto hover:text-ink transition-colors"
          >
            <span className="text-ink font-medium">← 返回登入</span>
          </button>
        </div>
      </div>
    </div>
  );
}
