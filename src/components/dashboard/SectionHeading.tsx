'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  id: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  tourId?: string;
}

export function SectionHeading({
  id,
  title,
  description,
  children,
  className,
  tourId,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
      aria-labelledby={id}
      {...(tourId ? { 'data-tour': tourId } : {})}
    >
      <div>
        <h2 id={id} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

