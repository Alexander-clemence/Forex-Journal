import React from 'react';
import { cn } from '@/lib/utils';

interface ForexJournalIconProps {
  className?: string;
  size?: number;
}

export const ForexJournalIcon: React.FC<ForexJournalIconProps> = ({ 
  className, 
  size = 18 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0', className)}
      aria-hidden="true"
    >
      {/* Background circle - fixed black, not theme-sensitive */}
      <circle
        cx="12"
        cy="12"
        r="11"
        fill="#000000"
      />
      
      {/* Chart/Graph lines representing trading data - fixed white */}
      <path
        d="M6 17 L8 13 L10 15 L12 9 L14 11 L16 7 L18 9"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
      />
      
      {/* Key data points on the chart - fixed white */}
      <circle cx="8" cy="13" r="1.5" fill="#ffffff" opacity="0.95" />
      <circle cx="12" cy="9" r="1.5" fill="#ffffff" opacity="0.95" />
      <circle cx="16" cy="7" r="1.5" fill="#ffffff" opacity="0.95" />
    </svg>
  );
};

