'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, Download, LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface Action {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

interface QuickTool {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

// Memoized Action Button Component
const ActionButton = memo(({ action }: { action: Action }) => {
  const Icon = action.icon;
  
  return (
    <Link href={action.href}>
      <Button
        variant="outline"
        className="h-auto p-3 flex flex-col items-center space-y-2 hover:shadow-md transition-all"
      >
        <div className={`p-2 rounded-lg ${action.color} text-white`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-center">
          <div className="font-medium text-xs">{action.title}</div>
          <div className="text-xs text-gray-500">{action.description}</div>
        </div>
      </Button>
    </Link>
  );
});
ActionButton.displayName = 'ActionButton';

// Memoized Quick Tool Component
const QuickToolButton = memo(({ tool }: { tool: QuickTool }) => {
  const Icon = tool.icon;
  
  return (
    <Link href={tool.href}>
      <button className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <Icon className={`h-4 w-4 ${tool.color}`} />
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {tool.title}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {tool.description}
          </div>
        </div>
      </button>
    </Link>
  );
});
QuickToolButton.displayName = 'QuickToolButton';

export const QuickActions = memo(() => {
  // Memoize static data - these never change
  const actions = useMemo<Action[]>(() => [
    {
      title: 'Add Trade',
      description: 'Record a new trade',
      icon: Plus,
      href: '/dashboard/trades/new',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'View Analytics',
      description: 'Check performance',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
  ], []);

  const quickTools = useMemo<QuickTool[]>(() => [
    {
      title: 'Export Data',
      description: 'Download your data',
      icon: Download,
      href: '/dashboard/export-data',
      color: 'text-green-600'
    }
  ], []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <ActionButton key={index} action={action} />
          ))}
        </div>

        {/* Secondary Tools */}
        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Quick Tools
          </h4>
          {quickTools.map((tool, index) => (
            <QuickToolButton key={index} tool={tool} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
QuickActions.displayName = 'QuickActions';