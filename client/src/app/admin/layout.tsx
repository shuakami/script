"use client";
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '../../services/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      (async () => {
        const valid = await checkAuth();
        if (!valid) {
          router.replace('/login');
        }
      })();
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated ? children : null}
    </div>
  );
}
