import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, RefreshCw, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreAuditChecklist {
  allReservationsCheckedIn: boolean;
  noShowsMarked: boolean;
  posOrdersPosted: boolean;
  pendingPaymentsRecorded: boolean;
  housekeepingComplete: boolean;
}

interface NightAuditChecklistProps {
  checklist?: PreAuditChecklist;
  onRefresh: () => void;
}

const checklistItems = [
  {
    key: 'allReservationsCheckedIn' as const,
    label: 'All Arrivals Checked In',
    description: 'All expected arrivals have been processed',
  },
  {
    key: 'noShowsMarked' as const,
    label: 'No-Shows Marked',
    description: 'All no-show reservations have been marked',
  },
  {
    key: 'posOrdersPosted' as const,
    label: 'POS Orders Posted',
    description: 'All restaurant/bar orders posted to folios',
  },
  {
    key: 'pendingPaymentsRecorded' as const,
    label: 'Payments Recorded',
    description: 'All pending payments have been entered',
  },
  {
    key: 'housekeepingComplete' as const,
    label: 'Housekeeping Complete',
    description: 'All housekeeping tasks are completed',
  },
];

export function NightAuditChecklist({ checklist, onRefresh }: NightAuditChecklistProps) {
  const completedCount = checklist
    ? Object.values(checklist).filter(Boolean).length
    : 0;
  const totalCount = checklistItems.length;
  const allComplete = completedCount === totalCount;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Pre-Audit Checklist</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          {allComplete
            ? 'All items complete - ready to proceed'
            : `${completedCount} of ${totalCount} items complete`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {checklistItems.map((item) => {
          const isComplete = checklist?.[item.key] ?? false;
          return (
            <div
              key={item.key}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                isComplete
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-yellow-500/20 bg-yellow-500/5'
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={cn(
                  'font-medium text-sm',
                  isComplete ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'
                )}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
