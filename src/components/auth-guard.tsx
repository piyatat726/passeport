'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="text-center">
            <p className="font-playfair italic text-xl tracking-editorial text-ink animate-pulse">
              PASSEPORT
            </p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
