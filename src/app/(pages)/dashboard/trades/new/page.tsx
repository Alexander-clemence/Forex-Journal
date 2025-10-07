'use client';

import { useState, useCallback, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { TradeService } from '@/lib/services/tradeService';

// Lazy load the TradeEntryForm component
const TradeEntryForm = lazy(() => 
  import('@/components/TradeEntryform/TradeEntryForm').then(module => ({
    default: module.TradeEntryForm
  }))
);

// Loading component
function FormSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Form skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Textarea skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          {/* Button skeleton */}
          <div className="flex justify-end space-x-4">
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewTradePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async (tradeData: any) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      await TradeService.createTrade({
        ...tradeData,
        user_id: user.id
      });
     
      router.push('./dashboard/trades');
    } catch (error) {
      throw error; // Let the form handle the error display
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, router]);

  const handleCancel = useCallback(() => {
    router.push('./dashboard/trades');
  }, [router]);

  return (
    <Suspense fallback={<FormSkeleton />}>
      <div className="container mx-auto py-8 px-4">
        <TradeEntryForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </Suspense>
  );
}