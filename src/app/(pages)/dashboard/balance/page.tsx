'use client'
import { lazy, Suspense } from 'react';
import { Loader2, DollarSign, TrendingUp, Calendar } from 'lucide-react';

// Lazy load the AccountBalanceManager
const AccountBalanceManager = lazy(() => import('@/components/trades/AccountBalance'));

// Loading skeleton component
function AccountBalanceSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Main content card skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-6">
          {/* Balance history header */}
          <div className="flex items-center justify-between">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          {/* Chart skeleton */}
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
            <TrendingUp className="h-12 w-12 text-gray-300 dark:text-gray-600" />
          </div>

          {/* Table skeleton */}
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-4 pb-3 border-b">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 py-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Loading account balance...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountBalancePage() {
  return (
    <Suspense fallback={<AccountBalanceSkeleton />}>
      <div>
        <AccountBalanceManager />
      </div>
    </Suspense>
  );
}