import type { ReactNode } from 'react';
import { Card } from './Card';
import { cn } from '../../lib/cn';

export interface PanelProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function Panel({ title, description, action, children, className, contentClassName }: PanelProps) {
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn('min-h-0 flex-1 px-5 pb-5 sm:px-6', contentClassName)}>{children}</div>
    </Card>
  );
}
