'use client';

import Header from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { ProtectedRoute } from '@/lib/hooks/useAuth';
import { WhatsNewDialog } from '@/components/dashboard/WhatsNewDialog';
import { ShortcutDialog } from '@/components/dashboard/ShortcutDialog';
import { SkipNavLink, SkipNavContent } from '@/components/ui/skip-nav';
import { useShortcutStore } from '@/lib/stores/shortcutStore';
import { useSidebarStore } from '@/lib/stores/sidebarStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GuidedTourDialog } from '@/components/dashboard/GuidedTourDialog';
import { WelcomeTrialDialog } from '@/components/dashboard/WelcomeTrialDialog';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { open, toggle } = useShortcutStore();
  const { isOpen: sidebarOpen } = useSidebarStore();

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content area - reacts to sidebar state */}
        <div 
          className={cn(
            'transition-all duration-300 ease-out',
            'lg:pl-0' // Header handles its own margin
          )}
        >
          <SkipNavLink href="#dashboard-main" />
          
          {/* Header */}
          <Header/>
          
          {/* Dialogs */}
          <WhatsNewDialog />
          <ShortcutDialog />
          <GuidedTourDialog />
          <WelcomeTrialDialog />
          
          {/* Page content */}
          <SkipNavContent id="dashboard-main">
            <main 
              className="py-6 transition-all duration-300"
              style={{
                paddingLeft: 'calc(var(--sidebar-width, 240px) + 50px)',
                paddingRight: '25px',
              }}
            >
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </main>
          </SkipNavContent>
        </div>
      </div>
    </ProtectedRoute>
  );
}
