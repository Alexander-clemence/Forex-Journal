'use client';

import { ProtectedRoute } from '@/lib/hooks/useAuth';
import { Sidebar } from '@/app/components/compdash/Sidebar';
import Header from '@/app/components/compdash/Header';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <div className="lg:pl-64">
          {/* Header */}
          <Header/>
          
          {/* Page content */}
          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}