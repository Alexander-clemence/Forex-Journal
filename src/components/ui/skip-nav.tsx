'use client';

import type { AnchorHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SkipNavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
}

export function SkipNavLink({ href = '#main-content', className, ...props }: SkipNavLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground shadow-md transition',
        className
      )}
      {...props}
    >
      Skip to main content
    </a>
  );
}

interface SkipNavContentProps {
  id?: string;
  children: React.ReactNode;
}

export function SkipNavContent({ id = 'main-content', children }: SkipNavContentProps) {
  return (
    <div id={id} tabIndex={-1}>
      {children}
    </div>
  );
}

