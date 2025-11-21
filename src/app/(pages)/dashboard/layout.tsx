'use client';

import Header from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { ProtectedRoute } from '@/lib/hooks/useAuth';
import { WhatsNewDialog } from '@/components/dashboard/WhatsNewDialog';
import { ShortcutDialog } from '@/components/dashboard/ShortcutDialog';
import { FeatureTour } from '@/components/dashboard/FeatureTour';
import { SkipNavLink, SkipNavContent } from '@/components/ui/skip-nav';
import { useShortcutStore } from '@/lib/stores/shortcutStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';



export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { open, toggle } = useShortcutStore();
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key === '?') {
        event.preventDefault();
        toggle();
        return;
      }
      if (event.shiftKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        router.push('/dashboard/trades/new');
        return;
      }
      if (event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        router.push('/dashboard/analytics');
        return;
      }
      if (event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        router.push('/dashboard');
        return;
      }
      if (event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        globalThis.window?.dispatchEvent(new CustomEvent('toggle-trade-filters'));
        return;
      }
      if (event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        globalThis.window?.dispatchEvent(new CustomEvent('focus-trade-search'));
        return;
      }
    };
    globalThis.window?.addEventListener('keydown', handler);
    return () => {
      globalThis.window?.removeEventListener('keydown', handler);
    };
  }, [router, toggle]);
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <div className="lg:pl-64">
          <SkipNavLink href="#dashboard-main" />
          {/* Header */}
          <Header/>
          <WhatsNewDialog />
          <ShortcutDialog />
          <FeatureTour />
          
          {/* Page content */}
          <SkipNavContent id="dashboard-main">
            <main className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </SkipNavContent>
        </div>
      </div>
    </ProtectedRoute>
  );
}