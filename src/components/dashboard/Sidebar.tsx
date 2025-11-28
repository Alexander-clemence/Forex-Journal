'use client';

import { useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTodayStats } from '@/lib/hooks/useTodayStats';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  PlusCircle,
  Settings,
  Menu,
  X,
  Home,
  DollarSign,
  Users,
  Wallet,
  Shield,
  Loader2,
  LucideIcon,
  InboxIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/uiStore';

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
  '/dashboard/settings': 'sidebar-settings',
  '/dashboard/export-data': 'sidebar-export',
};

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'All Trades', href: '/dashboard/trades', icon: DollarSign },
  { name: 'Add Trade', href: '/dashboard/trades/new', icon: PlusCircle, permission: 'trades.create' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, permission: 'analytics.view' },
  { name: 'Account Balance', href: '/dashboard/balance', icon: Wallet },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: 'settings.modify_own' },
  { name: 'Export Data', href: '/dashboard/export-data', icon: InboxIcon,},
];

const adminNavigation: NavigationItem[] = [
  { name: 'Users', href: '/dashboard/users', icon: Users, permission: 'users.manage' },
];

// Memoized Header Component
const SidebarHeader = memo(({ onClose }: { onClose: () => void }) => (
  <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-2">
      <Image 
        src="/Forex Journal Logo.png" 
        alt="Forex Journal Logo" 
        width={32} 
        height={32}
        className="h-8 w-8 object-contain"
        priority
      />
      <span className="text-lg font-semibold text-gray-900 dark:text-white">
        Forex Journal
      </span>
    </div>
    
    <Button
      variant="ghost"
      size="sm"
      className="lg:hidden"
      onClick={onClose}
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
));
SidebarHeader.displayName = 'SidebarHeader';

// Memoized User Info Component
const UserInfo = memo(({ email, displayName }: { email?: string; displayName?: string }) => {
  const initial = useMemo(() => email?.charAt(0).toUpperCase() || 'U', [email]);

  return (
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {initial}
            </span>
          </div>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {displayName || 'User'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {email}
          </p>
        </div>
      </div>
    </div>
  );
});
UserInfo.displayName = 'UserInfo';

// Memoized Navigation Item Component
const NavItem = memo(({ 
  item, 
  isActive, 
  isAdminOnly, 
  onClose 
}: { 
  item: NavigationItem; 
  isActive: boolean; 
  isAdminOnly: boolean;
  onClose: () => void;
}) => {
  const handleClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Determine icon color class
  let iconClass: string;
  if (isActive) {
    iconClass = 'text-blue-600 dark:text-blue-400';
  } else if (isAdminOnly) {
    iconClass = 'text-blue-500 group-hover:text-blue-600';
  } else {
    iconClass = 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300';
  }

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      className={cn(
        'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
        isActive
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
        isAdminOnly && 'border-l-2 border-blue-400'
      )}
      id={navIdMap[item.href]}
    >
      <item.icon
        className={cn('mr-3 h-5 w-5 flex-shrink-0', iconClass)}
      />
      {item.name}
      {isAdminOnly && (
        <Shield className="ml-auto h-3 w-3 text-blue-500" />
      )}
    </Link>
  );
});
NavItem.displayName = 'NavItem';

// Memoized Today's Stats Component
const TodayStats = memo(({ 
  todayPnL, 
  todayTradesCount, 
  loading 
}: { 
  todayPnL: number; 
  todayTradesCount: number; 
  loading: boolean;
}) => {
  const pnlDisplay = useMemo(() => {
    const formatted = todayPnL.toFixed(2);
    const isPositive = todayPnL > 0;
    const isNegative = todayPnL < 0;
    
    if (isPositive) {
      return { value: `+$${formatted}`, className: 'text-green-600 dark:text-green-400' };
    } else if (isNegative) {
      return { value: `-$${Math.abs(todayPnL).toFixed(2)}`, className: 'text-red-600 dark:text-red-400' };
    }
    return { value: '$0.00', className: 'text-gray-600 dark:text-gray-400' };
  }, [todayPnL]);

  return (
    <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
        Today's Performance
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">P&L:</span>
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <span className={`text-xs font-medium ${pnlDisplay.className}`}>
              {pnlDisplay.value}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">Trades:</span>
          <span className="text-xs font-medium text-gray-900 dark:text-white">
            {todayTradesCount}
          </span>
        </div>
      </div>
    </div>
  );
});
TodayStats.displayName = 'TodayStats';

// Memoized Sign Out Button Component
const SignOutButton = memo(({ onSignOut }: { onSignOut: () => void }) => (
  <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
    <Button
      variant="outline"
      className="w-full bg-red-500 text-white hover:bg-red-600"
      onClick={onSignOut}
    >
      Sign Out
    </Button>
  </div>
));
SignOutButton.displayName = 'SignOutButton';

export const Sidebar = memo(() => {
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const openMobileMenu = useUIStore((state) => state.openMobileMenu);
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);
  const pathname = usePathname();
  const { user, hasPermission, permissions, signOut } = useAuth();
  const { todayPnL, todayTradesCount, loading } = useTodayStats();

  // Memoize user data
  const userData = useMemo(() => ({
    email: user?.email,
    displayName: user?.user_metadata?.display_name,
  }), [user?.email, user?.user_metadata?.display_name]);

  // Memoize filtered navigation - include permissions in dependency array for role consistency
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

  const handleMobileMenuOpen = useCallback(() => {
    openMobileMenu();
  }, [openMobileMenu]);

  const handleMobileMenuClose = useCallback(() => {
    closeMobileMenu();
  }, [closeMobileMenu]);

  const handleOverlayClick = useCallback(() => {
    closeMobileMenu();
  }, [closeMobileMenu]);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleMobileMenuOpen}
          className="bg-white dark:bg-gray-800"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 border-0 p-0 cursor-pointer"
          onClick={handleOverlayClick}
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleOverlayClick();
          }}
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <SidebarHeader onClose={handleMobileMenuClose} />

        {/* User info */}
        <UserInfo email={userData.email} displayName={userData.displayName} />

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
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
                onClose={handleMobileMenuClose}
              />
            );
          })}
        </nav>

        {/* Today's Stats */}
        <TodayStats 
          todayPnL={todayPnL} 
          todayTradesCount={todayTradesCount} 
          loading={loading} 
        />

        {/* Sign out */}
        <div className="text-black">
                  <SignOutButton onSignOut={handleSignOut}/>
        </div>

      </div>
    </>
  );
});
Sidebar.displayName = 'Sidebar';