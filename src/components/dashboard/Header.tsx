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
import { User, Settings, LogOut, Menu, Sparkles, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useUIStore } from '@/lib/stores/uiStore';
import { useTourStore, type TourKey } from '@/lib/stores/tourStore';
import { usePathname } from 'next/navigation';
import { TourStatusDialog } from './TourStatusDialog';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

const mapPathToTour = (path?: string | null): TourKey => {
  if (!path) return 'dashboard';
  if (path.startsWith('/dashboard/trades')) return 'trades';
  if (path.startsWith('/dashboard/analytics')) return 'analytics';
  if (path.startsWith('/login')) return 'login';
  return 'dashboard';
};


// Memoized Mobile Menu Button
const MobileMenuButton = memo(({ onClick }: { onClick: () => void }) => (
  <Button
    variant="ghost"
    size="sm"
    className="md:hidden"
    onClick={onClick}
  >
    <Menu className="h-5 w-5" />
    <span className="sr-only">Toggle menu</span>
  </Button>
));
MobileMenuButton.displayName = 'MobileMenuButton';

// Memoized User Avatar
const UserAvatar = memo(({ displayName, email }: { displayName?: string; email?: string }) => {
  const initial = useMemo(() => {
    return displayName?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || null;
  }, [displayName, email]);

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
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
  const { open: openTour } = useTourStore();
  const pathname = usePathname();
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
    const tourKey = mapPathToTour(pathname);
    openTour(tourKey);
  }, [openTour, pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Left side - Logo and mobile menu */}
          <div className="flex items-center space-x-4">
            <MobileMenuButton onClick={handleMobileMenuToggle} />

          </div>

          {/* Right side - Theme toggle and user menu */}
          <div className="flex items-center space-x-4" data-tour="shortcuts-hint">
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <a href="mailto:support@stralysltd.co.tz">
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={handleGuideTour}>
              <Sparkles className="h-4 w-4 mr-2" />
              Guide me
            </Button>
            <ThemeToggle />
           
            {/* User Menu */}
            {userData && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-16 w-16 rounded-full">
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
                    className="text-red-600 dark:text-red-400"
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