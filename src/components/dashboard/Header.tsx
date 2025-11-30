'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useUIStore } from '@/lib/stores/uiStore';
import { TourStatusDialog } from './TourStatusDialog';
import { useGuideDialogStore } from '@/lib/stores/guideDialogStore';
import { useSidebarStore } from '@/lib/stores/sidebarStore';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

// Memoized User Avatar
const UserAvatar = memo(({ displayName, email }: { displayName?: string; email?: string }) => {
  const initial = useMemo(() => {
    return displayName?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || null;
  }, [displayName, email]);

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-semibold shadow-lg">
      {initial || <User className="h-4 w-4" />}
    </div>
  );
});
UserAvatar.displayName = 'UserAvatar';

// Memoized User Info
const UserInfo = memo(({ displayName, email }: { displayName?: string; email?: string }) => (
  <div className="flex flex-col space-y-1">
    <p className="text-sm font-medium leading-none">
      {displayName || 'User'}
    </p>
    <p className="text-xs leading-none text-muted-foreground">
      {email}
    </p>
  </div>
));
UserInfo.displayName = 'UserInfo';

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, signOut } = useAuth();
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);
  const { open: openGuideDialog } = useGuideDialogStore();
  const [isTourStatusOpen, setTourStatusOpen] = useState(false);

  // Memoize user data to prevent unnecessary re-renders
  const userData = useMemo(() => {
    if (!user) return null;
    
    return {
      displayName: user.user_metadata?.display_name,
      email: user.email,
    };
  }, [user?.user_metadata?.display_name, user?.email]);

  // Memoize sign out handler
  const handleSignOut = useCallback(async () => {
    await signOut();
    window.location.href = '/';
  }, [signOut]);

  // Memoize mobile menu toggle handler
  const handleMobileMenuToggle = useCallback(() => {
    toggleMobileMenu();
    onMobileMenuToggle?.();
  }, [toggleMobileMenu, onMobileMenuToggle]);

  const handleGuideTour = useCallback(() => {
    openGuideDialog();
  }, [openGuideDialog]);

  return (
    <>
      <header 
        className={cn(
          'sticky top-5 z-50 rounded-[14px]',
          'bg-[var(--color-card)]/80 backdrop-blur-md',
          'border border-[var(--color-border)]',
          'shadow-sm',
          'transition-all duration-300',
          'mb-5',
          'mx-5',
          'lg:ml-[calc(var(--sidebar-width,240px)+25px)]',
          'lg:mr-5',
          'lg:w-[calc(100vw-var(--sidebar-width,240px)-50px)]',
          'lg:max-w-none'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          {/* Left side - Empty space for balance */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button is now in sidebar */}
          </div>

          {/* Right side - Theme toggle and user menu */}
          <div className="flex items-center space-x-3" data-tour="shortcuts-hint" id="keyboard-shortcuts-help">
            <Button 
              variant="outline" 
              size="sm"
              asChild
              className="h-9 bg-[var(--color-card)]/50 hover:bg-[var(--color-card)] border-[var(--color-border)]"
            >
              <a href="mailto:support@stralysltd.co.tz">
                Feedback
              </a>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGuideTour}
              className="h-9 bg-[var(--color-card)]/50 hover:bg-[var(--color-card)] border-[var(--color-border)]"
            >
              Guide me
            </Button>
            <ThemeToggle />
           
            {/* User Menu */}
            {userData && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-9 w-9 rounded-full p-0 hover:bg-[var(--color-muted)]"
                  >
                    <UserAvatar 
                      displayName={userData.displayName} 
                      email={userData.email} 
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <UserInfo 
                      displayName={userData.displayName} 
                      email={userData.email} 
                    />
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTourStatusOpen(true)}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Tour status</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-[var(--color-destructive)]"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>
      <TourStatusDialog open={isTourStatusOpen} onOpenChange={setTourStatusOpen} />
    </>
  );
}
