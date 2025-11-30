'use client';

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTodayStats } from '@/lib/hooks/useTodayStats';
import {
  BarChart3,
  PlusCircle,
  Settings,
  Menu,
  X,
  Home,
  Users,
  User,
  Wallet,
  DollarSign,
  Loader2,
  LucideIcon,
  InboxIcon,
  LogOut,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/uiStore';
import { useSidebarStore } from '@/lib/stores/sidebarStore';
import { useTheme } from '@/components/theme/ThemeProvider';
import { ForexJournalIcon } from '@/components/ui/ForexJournalIcon';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

const navIdMap: Record<string, string> = {
  '/dashboard': 'sidebar-dashboard',
  '/dashboard/trades': 'sidebar-all-trades',
  '/dashboard/trades/new': 'sidebar-add-trade',
  '/dashboard/analytics': 'sidebar-analytics',
  '/dashboard/balance': 'sidebar-account-balance',
  '/dashboard/profile': 'sidebar-profile',
  '/dashboard/settings': 'sidebar-settings',
  '/dashboard/billing': 'sidebar-billing',
  '/dashboard/export-data': 'sidebar-export',
};

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'All Trades', href: '/dashboard/trades', icon: DollarSign },
  { name: 'Add Trade', href: '/dashboard/trades/new', icon: PlusCircle, permission: 'trades.create' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, permission: 'analytics.view' },
  { name: 'Account Balance', href: '/dashboard/balance', icon: Wallet },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: 'settings.modify_own' },
  { name: 'Billing History', href: '/dashboard/billing', icon: Receipt },
  { name: 'Export Data', href: '/dashboard/export-data', icon: InboxIcon },
];

const adminNavigation: NavigationItem[] = [
  { name: 'Users', href: '/dashboard/users', icon: Users, permission: 'users.manage' },
];

// Memoized Navigation Item Component
const NavItem = memo(({ 
  item, 
  isActive, 
  isAdminOnly,
  isOpen,
  onClick
}: { 
  item: NavigationItem; 
  isActive: boolean;
  isAdminOnly: boolean;
  isOpen: boolean;
  onClick?: () => void;
}) => {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'group relative flex items-center h-11 w-11 gap-3 px-3 rounded-lg transition-all duration-300',
        'text-sm font-medium capitalize',
        'text-[var(--color-sidebar-foreground)]/80 hover:text-[var(--color-sidebar-foreground)]',
        'hover:bg-[var(--color-sidebar-accent)]',
        isOpen && 'w-full',
        isActive && 'bg-[var(--color-sidebar-primary)] text-[var(--color-sidebar-primary-foreground)]',
        isActive && 'hover:bg-[var(--color-sidebar-primary)]/80'
      )}
      id={navIdMap[item.href]}
    >
      <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
      <span
        className={cn(
          'whitespace-nowrap font-medium transition-opacity duration-250',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
          !isOpen && 'group-hover:opacity-100 group-hover:pointer-events-auto',
          !isOpen && 'absolute left-full ml-2 px-3 py-2 rounded-md',
          !isOpen && 'bg-[var(--color-sidebar)] backdrop-blur-md',
          !isOpen && 'shadow-lg z-[100] text-[var(--color-sidebar-foreground)]',
          !isOpen && 'group-hover:before:content-[""] group-hover:before:absolute',
          !isOpen && 'group-hover:before:left-[-4px] group-hover:before:top-1/2',
          !isOpen && 'group-hover:before:-translate-y-1/2',
          !isOpen && 'group-hover:before:h-2 group-hover:before:w-2',
          !isOpen && 'group-hover:before:rotate-45 group-hover:before:rounded-sm',
          !isOpen && 'group-hover:before:bg-[var(--color-sidebar)]'
        )}
      >
        {item.name}
      </span>
      {isAdminOnly && isOpen && (
        <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-[var(--color-sidebar-primary)]/30 text-[var(--color-sidebar-primary-foreground)] rounded font-medium">
          Admin
        </span>
      )}
    </Link>
  );
});
NavItem.displayName = 'NavItem';

// Memoized User Info Component
const UserInfo = memo(({ email, displayName, isOpen }: { 
  email?: string; 
  displayName?: string;
  isOpen: boolean;
}) => {
  const initial = useMemo(() => email?.charAt(0).toUpperCase() || 'U', [email]);

  if (!isOpen) return null;

  return (
    <div className="mt-auto px-1.5 py-3 border-t border-[var(--color-sidebar-border)]">
      <div className="flex items-center gap-3 px-3 h-11">
        <div className="h-8 w-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-sm font-semibold text-[var(--color-primary-foreground)] flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-[var(--color-sidebar-foreground)] whitespace-nowrap overflow-hidden text-ellipsis">
            {displayName || 'User'}
          </div>
          <div className="text-[11px] text-[var(--color-sidebar-foreground)]/70 whitespace-nowrap overflow-hidden text-ellipsis">
            {email}
          </div>
        </div>
      </div>
    </div>
  );
});
UserInfo.displayName = 'UserInfo';

// Memoized Today's Stats Component
const TodayStats = memo(({ 
  todayPnL, 
  todayTradesCount, 
  loading,
  isOpen
}: { 
  todayPnL: number; 
  todayTradesCount: number; 
  loading: boolean;
  isOpen: boolean;
}) => {
  const pnlDisplay = useMemo(() => {
    const formatted = todayPnL.toFixed(2);
    const isPositive = todayPnL > 0;
    const isNegative = todayPnL < 0;
    
    if (isPositive) {
      return { value: `+$${formatted}`, className: 'text-green-400' };
    } else if (isNegative) {
      return { value: `-$${Math.abs(todayPnL).toFixed(2)}`, className: 'text-red-400' };
    }
    return { value: '$0.00', className: 'text-[var(--color-sidebar-foreground)]/70' };
  }, [todayPnL]);

  if (!isOpen) return null;

  return (
    <div className="px-1.5 py-3 border-t border-[var(--color-sidebar-border)]">
      <div className="px-3">
        <div className="text-[11px] font-medium text-[var(--color-sidebar-foreground)]/70 uppercase tracking-wider mb-2">
          Today's Performance
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--color-sidebar-foreground)]/70">P&L:</span>
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin text-[var(--color-sidebar-foreground)]/70" />
            ) : (
              <span className={cn('font-semibold', pnlDisplay.className)}>
                {pnlDisplay.value}
              </span>
            )}
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--color-sidebar-foreground)]/70">Trades:</span>
            <span className="font-semibold text-[var(--color-sidebar-foreground)]">
              {todayTradesCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
TodayStats.displayName = 'TodayStats';

// Memoized Sign Out Button Component
const SignOutButton = memo(({ onSignOut, isOpen }: { 
  onSignOut: () => void;
  isOpen: boolean;
}) => {
  return (
    <div className="px-1.5 py-2 pb-3 border-t border-[var(--color-sidebar-border)]">
      <button
        type="button"
        className={cn(
          'flex items-center gap-3 h-11 px-3 rounded-lg transition-all duration-300',
          'text-sm font-medium',
          'text-[var(--color-destructive)]/80 hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/15',
          isOpen ? 'w-full opacity-100' : 'w-11 opacity-0 pointer-events-none'
        )}
        onClick={onSignOut}
      >
        <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
        <span className="whitespace-nowrap">Sign Out</span>
      </button>
    </div>
  );
});
SignOutButton.displayName = 'SignOutButton';

export const Sidebar = memo(() => {
  const { isOpen, toggle, setOpen } = useSidebarStore();
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const openMobileMenu = useUIStore((state) => state.openMobileMenu);
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);
  const pathname = usePathname();
  const { user, hasPermission, permissions, signOut } = useAuth();
  const { todayPnL, todayTradesCount, loading } = useTodayStats();
  const { resolvedTheme } = useTheme();

  // Initialize and update CSS variable for layout padding
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    
    const updateSidebarWidth = () => {
      const isMobileView = window.innerWidth < 1024;
      if (isMobileView) {
        document.documentElement.style.setProperty('--sidebar-width', '0px');
      } else {
        document.documentElement.style.setProperty(
          '--sidebar-width', 
          isOpen ? '240px' : '76px'
        );
      }
    };

    // Initialize on mount
    updateSidebarWidth();
  }, [isOpen]);

  // Handle window resize
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const handleResize = () => {
      const isMobileView = window.innerWidth < 1024;
      if (isMobileView) {
        document.documentElement.style.setProperty('--sidebar-width', '0px');
      } else {
        document.documentElement.style.setProperty(
          '--sidebar-width', 
          isOpen ? '240px' : '76px'
        );
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Memoize user data
  const userData = useMemo(() => ({
    email: user?.email,
    displayName: user?.user_metadata?.display_name,
  }), [user?.email, user?.user_metadata?.display_name]);

  // Memoize filtered navigation
  const visibleNavigation = useMemo(() => 
    navigation.filter(item => !item.permission || hasPermission(item.permission)),
    [hasPermission, permissions]
  );

  const visibleAdminNavigation = useMemo(() =>
    adminNavigation.filter(item => !item.permission || hasPermission(item.permission)),
    [hasPermission, permissions]
  );

  const allNavigation = useMemo(() => 
    [...visibleNavigation, ...visibleAdminNavigation],
    [visibleNavigation, visibleAdminNavigation]
  );

  // Memoize admin items set for quick lookup
  const adminHrefs = useMemo(() => 
    new Set(adminNavigation.map(item => item.href)),
    []
  );

  // Memoized handlers
  const handleSignOut = useCallback(async () => {
    await signOut();
    globalThis.location.href = '/';
  }, [signOut]);

  const handleToggle = useCallback(() => {
    toggle();
  }, [toggle]);

  const handleMobileMenuOpen = useCallback(() => {
    openMobileMenu();
  }, [openMobileMenu]);

  const handleMobileMenuClose = useCallback(() => {
    closeMobileMenu();
  }, [closeMobileMenu]);

  const handleOverlayClick = useCallback(() => {
    closeMobileMenu();
  }, [closeMobileMenu]);

  const handleNavClick = useCallback(() => {
    // Close mobile menu when navigating
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      closeMobileMenu();
    }
  }, [closeMobileMenu]);

  // Reactive mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-5 left-5 z-[60]">
        <button
          type="button"
          onClick={handleMobileMenuOpen}
          className="h-10 w-10 flex items-center justify-center rounded-lg bg-black/20 dark:bg-white/10 backdrop-blur-md border border-white/10 dark:border-gray-700/50 text-gray-100 dark:text-gray-100 hover:bg-black/30 dark:hover:bg-white/20 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && isMobile && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm border-0 p-0 cursor-pointer"
          onClick={handleOverlayClick}
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleOverlayClick();
          }}
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed z-30 top-5 left-5 bottom-5 rounded-[14px] overflow-hidden',
          'bg-[var(--color-sidebar)] backdrop-blur-md',
          'border border-[var(--color-sidebar-border)]',
          'shadow-xl shadow-black/20',
          'transition-all duration-300 ease-out',
          'w-14',
          isOpen && 'w-[220px]',
          // Mobile styles
          'lg:block',
          isMobile && 'top-0 left-0 bottom-0 rounded-none w-[280px]',
          isMobile && 'transform transition-transform duration-300',
          isMobile && (!isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'),
          // Scrollbar styling
          '[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:bg-transparent',
          '[&::-webkit-scrollbar-thumb]:bg-[var(--color-sidebar-accent)] [&::-webkit-scrollbar-thumb]:rounded-full',
          '[&::-webkit-scrollbar-thumb]:hover:bg-[var(--color-sidebar-accent-foreground)]'
        )}
      >
        <div className="absolute top-0 left-0 w-[220px] h-full flex flex-col overflow-y-auto overflow-x-hidden">
          {/* Header */}
          <header className="flex items-center h-16 px-1.5 gap-3">
            <button
              type="button"
              className="h-11 w-11 grid place-items-center rounded-lg text-[var(--color-sidebar-foreground)] hover:bg-[var(--color-sidebar-accent)] transition-colors"
              onClick={handleToggle}
              aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div
              className={cn(
                'flex items-center gap-2 transition-opacity duration-250',
                isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              )}
            >
              <ForexJournalIcon 
                size={18}
                className="h-[18px] w-[18px]"
              />
              <span className="text-sm font-semibold text-[var(--color-sidebar-foreground)] whitespace-nowrap">
                FX Journal
              </span>
            </div>
          </header>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col px-1.5 py-2 gap-0.5 overflow-y-auto">
            {allNavigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const isAdminOnly = adminHrefs.has(item.href);
              
              return (
                <NavItem
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  isAdminOnly={isAdminOnly}
                  isOpen={isOpen}
                  onClick={handleNavClick}
                />
              );
            })}
          </nav>

          {/* User info */}
          <UserInfo 
            email={userData.email} 
            displayName={userData.displayName}
            isOpen={isOpen}
          />

          {/* Today's Stats */}
          <TodayStats 
            todayPnL={todayPnL} 
            todayTradesCount={todayTradesCount} 
            loading={loading}
            isOpen={isOpen}
          />

          {/* Sign out */}
          <SignOutButton 
            onSignOut={handleSignOut}
            isOpen={isOpen}
          />
        </div>
      </aside>
    </>
  );
});
Sidebar.displayName = 'Sidebar';
