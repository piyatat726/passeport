'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { OnboardingOverlay, useOnboarding } from '@/components/onboarding';

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}

function AuthPageInner() {
  const [mode, setMode] = useState<'login' | 'signup' | 'confirm' | 'forgot' | 'reset-sent'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword, demoLogin, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showOnboarding, completeOnboarding] = useOnboarding();

  // Where to go after login (middleware may set ?redirect=/create etc.)
  const redirectTo = searchParams.get('redirect') || '/';

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) router.replace(redirectTo);
  }, [isAuthenticated, router, redirectTo]);

  // Check for error from callback
  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'confirmation_failed') {
      setError('信箱驗證失敗，請重新點擊確認連結或重新註冊');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.push(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '發生錯誤，請再試一次');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (username.length < 3) {
      setError('用戶名稱至少需要 3 個字元');
      return;
    }
    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      setError('用戶名稱只能包含英文、數字、點和底線');
      return;
    }
    if (password.length < 6) {
      setError('密碼需至少 6 個字元');
      return;
    }

    setLoading(true);
    try {
      const { confirmEmail } = await signUp(email, password, username);
      if (confirmEmail) {
        setMode('confirm');
      } else {
        // Auto-confirmed (e.g., in dev mode)
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '發生錯誤，請再試一次');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('請輸入電子郵件');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setMode('reset-sent');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '發生錯誤，請再試一次');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    demoLogin();
    router.push(redirectTo);
  };

  // ─── Confirmation Screen ───
  if (mode === 'confirm') {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm text-center">
          {/* Mail Icon */}
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-surface border border-border flex items-center justify-center">
            <svg className="w-9 h-9 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13L2 4" />
            </svg>
          </div>

          <h1 className="font-playfair italic text-2xl tracking-editorial text-ink mb-3">
            CHECK YOUR INBOX
          </h1>
          <p className="font-noto text-taupe text-sm leading-relaxed mb-2">
            確認信已發送至
          </p>
          <p className="font-inter text-ink text-sm font-medium mb-6">
            {email}
          </p>
          <p className="font-noto text-taupe/70 text-xs leading-relaxed mb-10">
            請點擊信中的連結完成註冊。<br />
            若未收到，請檢查垃圾郵件資料夾。
          </p>

          <div className="space-y-3">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className="w-full py-3.5 bg-ink text-cream rounded-lg text-sm font-medium tracking-editorial uppercase font-inter hover:bg-ink/90 transition-colors"
            >
              BACK TO LOGIN
            </button>
            <button
              onClick={handleDemo}
              className="w-full py-3.5 bg-transparent border border-border text-taupe rounded-lg text-sm font-medium tracking-editorial uppercase font-inter hover:border-taupe hover:text-ink transition-colors"
            >
              EXPLORE AS GUEST
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Reset Password Sent Screen ───
  if (mode === 'reset-sent') {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-surface border border-border flex items-center justify-center">
            <svg className="w-9 h-9 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
          </div>

          <h1 className="font-playfair italic text-2xl tracking-editorial text-ink mb-3">
            CHECK YOUR EMAIL
          </h1>
          <p className="font-noto text-taupe text-sm leading-relaxed mb-2">
            密碼重設連結已發送至
          </p>
          <p className="font-inter text-ink text-sm font-medium mb-6">
            {email}
          </p>
          <p className="font-noto text-taupe/70 text-xs leading-relaxed mb-10">
            請點擊信中的連結重設密碼。<br />
            連結有效期限為 24 小時。
          </p>

          <button
            onClick={() => { setMode('login'); setError(''); }}
            className="w-full py-3.5 bg-ink text-cream rounded-lg text-sm font-medium tracking-editorial uppercase font-inter hover:bg-ink/90 transition-colors"
          >
            BACK TO LOGIN
          </button>
        </div>
      </div>
    );
  }

  // ─── Login / Signup Screen ───
  return (
    <>
    {showOnboarding && <OnboardingOverlay onComplete={completeOnboarding} />}
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-14">
          <h1 className="font-playfair italic text-4xl tracking-editorial text-ink mb-4">
            PASSEPORT
          </h1>
          <p className="font-noto text-taupe text-sm tracking-wide">
            把生活，寫成風格
          </p>
        </div>

        {/* Form */}
        <form onSubmit={mode === 'login' ? handleLogin : mode === 'forgot' ? handleForgotPassword : handleSignUp} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <input
                type="text"
                placeholder="用戶名稱（英文、數字）"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full px-4 py-3.5 bg-surface border border-border rounded-lg text-sm text-ink placeholder:text-taupe/60 focus:outline-none focus:border-taupe transition-colors font-inter"
                required
                autoComplete="username"
                maxLength={30}
              />
              {username && (
                <p className="mt-1.5 text-[10px] text-taupe font-inter px-1">
                  @{username.replace(/[^a-z0-9._]/g, '')}
                </p>
              )}
            </div>
          )}

          <input
            type="email"
            placeholder="電子郵件"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 bg-surface border border-border rounded-lg text-sm text-ink placeholder:text-taupe/60 focus:outline-none focus:border-taupe transition-colors font-noto"
            required
            autoComplete="email"
          />

          {mode !== 'forgot' && (
            <div>
              <input
                type="password"
                placeholder="密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-surface border border-border rounded-lg text-sm text-ink placeholder:text-taupe/60 focus:outline-none focus:border-taupe transition-colors font-noto"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
              />
              {mode === 'signup' && password && (
                <div className="mt-2 px-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          getPasswordStrength(password) >= level
                            ? level <= 1 ? 'bg-red-400'
                            : level <= 2 ? 'bg-amber-400'
                            : level <= 3 ? 'bg-emerald-400'
                            : 'bg-emerald-500'
                            : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-taupe mt-1 font-noto">
                    {password.length < 6 ? '至少 6 個字元' : '密碼強度：' + getPasswordLabel(password)}
                  </p>
                </div>
              )}
              {mode === 'login' && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-[11px] text-taupe hover:text-ink transition-colors font-noto"
                  >
                    忘記密碼？
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
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

          {/* Submit Button */}
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
                {mode === 'login' ? '登入中...' : mode === 'forgot' ? '發送中...' : '註冊中...'}
              </span>
            ) : mode === 'login' ? 'LOG IN' : mode === 'forgot' ? 'SEND RESET LINK' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="mt-6 text-center">
          {mode === 'forgot' ? (
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className="text-taupe text-sm font-noto hover:text-ink transition-colors"
            >
              <span className="text-ink font-medium">← 返回登入</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
              }}
              className="text-taupe text-sm font-noto hover:text-ink transition-colors"
            >
              {mode === 'login' ? '還沒有帳號？' : '已有帳號？'}
              <span className="text-ink font-medium ml-1">
                {mode === 'login' ? '註冊' : '登入'}
              </span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="mt-10 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-cream px-4 text-taupe font-noto">或</span>
          </div>
        </div>

        {/* Guest Button */}
        <button
          onClick={handleDemo}
          className="mt-6 w-full py-3.5 bg-transparent border border-border text-taupe rounded-lg text-sm font-medium tracking-editorial uppercase font-inter hover:border-taupe hover:text-ink transition-colors"
        >
          EXPLORE AS GUEST
        </button>

        <div className="mt-10 text-center space-y-2">
          <p className="text-[10px] text-taupe/50 font-inter tracking-widest uppercase">
            A lifestyle magazine in your pocket
          </p>
          <div className="flex justify-center gap-3 text-[10px] text-taupe/40 font-inter">
            <a href="/privacy" className="hover:text-taupe transition-colors">隱私權政策</a>
            <span>·</span>
            <a href="/terms" className="hover:text-taupe transition-colors">使用條款</a>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function getPasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
}

function getPasswordLabel(password: string): string {
  const s = getPasswordStrength(password);
  if (s <= 1) return '弱';
  if (s <= 2) return '普通';
  if (s <= 3) return '強';
  return '非常強';
}
