'use client'
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SectionHeading } from '@/components/dashboard/SectionHeading';

// Lazy load the ExportDataComponent
const ExportDataComponent = lazy(() => import('@/components/trades/ExportData'));

// Loading skeleton component
function ExportDataSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Card skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-6">
        {/* Export options skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Date range skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    </div>
  );
}

export default function ExportDataPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        id="export-data-heading"
        title="Export Data"
        description="Generate and download PDF reports of your trading performance and history"
      />
      <Suspense fallback={<ExportDataSkeleton />}>
        <ExportDataComponent />
      </Suspense>
    </div>
  );
}