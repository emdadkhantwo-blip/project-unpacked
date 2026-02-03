import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface GentleAttentionBadgeProps {
  isComplete: boolean;
  pendingCount?: number;
  label: string;
  description?: string;
  className?: string;
}

export function GentleAttentionBadge({
  isComplete,
  pendingCount,
  label,
  description,
  className,
}: GentleAttentionBadgeProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl p-4 transition-all duration-500',
        isComplete
          ? 'bg-[hsl(160_60%_45%/0.1)] border border-[hsl(160_60%_45%/0.2)]'
          : 'bg-[hsl(38_80%_55%/0.08)] border border-[hsl(38_80%_55%/0.2)] animate-gentle-pulse',
        className
      )}
    >
      {isComplete ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(160_60%_45%/0.15)]">
          <CheckCircle2 className="h-4 w-4 text-[hsl(160_60%_45%)]" />
        </div>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(38_80%_55%/0.15)]">
          <AlertCircle className="h-4 w-4 text-[hsl(38_80%_55%)]" />
        </div>
      )}
      <div className="flex-1">
        <p
          className={cn(
            'text-sm font-medium',
            isComplete ? 'text-[hsl(160_60%_45%)]' : 'text-[hsl(38_80%_55%)]'
          )}
        >
          {label}
          {!isComplete && pendingCount && pendingCount > 0 && (
            <span className="ml-2 text-xs opacity-80">
              ({pendingCount} pending)
            </span>
          )}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}
