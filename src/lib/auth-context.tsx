'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from './types';
import { SEED_USER } from './seed-data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const isConfigured = supabaseUrl.length > 0 && !supabaseUrl.includes('your-project');

interface AuthState {
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<{ confirmEmail: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  demoLogin: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // 1. Check for demo user in localStorage
    try {
      const saved = localStorage.getItem('passeport_demo_user');
      if (saved) {
        // Always use latest SEED_USER data (in case seed data changed)
        setUser(SEED_USER);
        localStorage.setItem('passeport_demo_user', JSON.stringify(SEED_USER));
        setIsDemo(true);
        setLoading(false);
        return; // Demo user found, skip Supabase
      }
    } catch {
      // localStorage not available
    }

    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // 2. Check Supabase session
    const supabase = createClient();

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchOrCreateProfile(supabase, session.user);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };

    // 3. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchOrCreateProfile(supabase, session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsDemo(false);
        }
      }
    );

    initAuth();

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile from DB, or create one if first login
  const fetchOrCreateProfile = async (
    supabase: ReturnType<typeof createClient>,
    authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }
  ) => {
    try {
      // Try to fetch existing profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile && !error) {
        setUser(profile);
        setIsDemo(false);
        return;
      }

      // Profile not found — create one
      const username = (authUser.user_metadata?.username as string)
        || authUser.email?.split('@')[0]
        || 'user';

      const newProfile = {
        id: authUser.id,
        username: username.toLowerCase().replace(/[^a-z0-9._]/g, ''),
        display_name: username,
        bio: '',
        avatar_url: '',
        cities: [],
      };

      const { data: created, error: insertError } = await supabase
        .from('users')
        .insert(newProfile)
        .select()
        .single();

      if (created && !insertError) {
        setUser(created);
        setIsDemo(false);
      } else {
        // DB tables might not exist yet — use a local fallback
        console.warn('Could not create profile (tables may not exist):', insertError?.message);
        setUser({
          ...newProfile,
          followers_count: 0,
          following_count: 0,
          created_at: new Date().toISOString(),
        } as User);
        setIsDemo(false);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) throw new Error('Supabase 尚未設定，請使用訪客模式');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Translate common errors to Chinese
      const msg = translateAuthError(error.message);
      throw new Error(msg);
    }
  };

  const signUp = async (email: string, password: string, username: string): Promise<{ confirmEmail: boolean }> => {
    if (!isConfigured) throw new Error('Supabase 尚未設定，請使用訪客模式');

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }, // Store username in user_metadata
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      const msg = translateAuthError(error.message);
      throw new Error(msg);
    }

    // Check if email confirmation is required
    // If user.identities is empty, email might already be registered
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('此信箱已被註冊，請直接登入');
    }

    // Supabase requires email confirmation by default
    const needsConfirmation = !data.session;
    return { confirmEmail: needsConfirmation };
  };

  const signOut = async () => {
    if (isConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    try { localStorage.removeItem('passeport_demo_user'); } catch {}
    setUser(null);
    setIsDemo(false);
  };

  const resetPassword = async (email: string) => {
    if (!isConfigured) throw new Error('Supabase 尚未設定');

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
    });

    if (error) {
      const msg = translateAuthError(error.message);
      throw new Error(msg);
    }
  };

  const refreshUser = async () => {
    if (isDemo || !user) return;
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) setUser(data);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const demoLogin = () => {
    setUser(SEED_USER);
    setIsDemo(true);
    try { localStorage.setItem('passeport_demo_user', JSON.stringify(SEED_USER)); } catch {}
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isDemo,
      isAuthenticated: !!user,
      signIn,
      signUp,
      signOut,
      resetPassword,
      demoLogin,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// Translate Supabase auth errors to Chinese
function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    'invalid login credentials': '帳號或密碼錯誤',
    'email not confirmed': '請先確認你的電子郵件',
    'user already registered': '此信箱已被註冊',
    'password should be at least 6 characters': '密碼需至少 6 個字元',
    'signup requires a valid password': '請輸入有效密碼',
    'unable to validate email address': '電子郵件格式不正確',
    'email rate limit exceeded': '寄信次數過多，請稍後再試',
    'for security purposes, you can only request this after': '為安全考量，請稍後再試',
    'email address invalid': '電子郵件格式不正確',
    'user not found': '找不到此帳號',
    'new password should be different': '新密碼不能與舊密碼相同',
    'email link is invalid or has expired': '連結已失效，請重新操作',
  };

  const lower = message.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    if (lower.includes(key)) return value;
  }
  return message;
}
