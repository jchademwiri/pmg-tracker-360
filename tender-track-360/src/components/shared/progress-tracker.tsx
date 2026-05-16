'use client';

import { cn } from '@/lib/utils';
import { Check, X, Clock, FileText, Send } from 'lucide-react';

interface ProgressTrackerProps {
  status: string; // draft, submitted, pending, won, lost
  className?: string;
}

export function ProgressTracker({ status, className }: ProgressTrackerProps) {
  const steps = [
    { id: 'draft', label: 'Draft', icon: FileText },
    { id: 'submitted', label: 'Submitted', icon: Send },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'outcome', label: 'Outcome', icon: Check }, // Icon changes based on win/loss
  ];

  // Determine current step index
  let currentIndex = 0;
  let isWon = false;
  let isLost = false;

  switch (status) {
    case 'draft':
      currentIndex = 0;
      break;
    case 'submitted':
      currentIndex = 1;
      break;
    case 'pending':
      currentIndex = 2;
      break;
    case 'won':
      currentIndex = 3;
      isWon = true;
      break;
    case 'lost':
      currentIndex = 3;
      isLost = true;
      break;
    default:
      currentIndex = 0;
  }

  return (
    <div className={cn('w-full py-4', className)}>
      <div className="relative flex items-center justify-between">
        {/* Progress Bar Background */}
        <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full -translate-y-1/2 bg-muted" />

        {/* Active Progress Bar */}
        <div
          className={cn(
            'absolute left-0 top-1/2 -z-10 h-0.5 -translate-y-1/2 transition-all duration-500',
            isLost ? 'bg-red-500' : 'bg-primary'
          )}
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === steps.length - 1;

          let Icon = step.icon;
          if (isLast && isLost) Icon = X;
          if (isLast && isWon) Icon = Check;

          let colorClass = 'bg-muted text-muted-foreground border-muted'; // Inactive

          if (isActive) {
            if (isLast && isLost) {
              colorClass = 'bg-red-500 text-white border-red-500';
            } else if (isLast && isWon) {
              colorClass = 'bg-green-500 text-white border-green-500';
            } else {
              colorClass = 'bg-primary text-primary-foreground border-primary';
            }
          }

          return (
            <div
              key={step.id}
              className="group relative flex flex-col items-center justify-center gap-2 bg-background px-2"
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300',
                  colorClass,
                  isCurrent && 'ring-4 ring-primary/20'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  'absolute top-10 text-xs font-medium whitespace-nowrap transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {isLast && isLost
                  ? 'Lost'
                  : isLast && isWon
                    ? 'Won'
                    : step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
