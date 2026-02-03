import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Play, Wallet, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { NightAudit } from '@/hooks/useNightAudit';

interface PreAuditChecklist {
  allReservationsCheckedIn: boolean;
  noShowsMarked: boolean;
  posOrdersPosted: boolean;
  pendingPaymentsRecorded: boolean;
  housekeepingComplete: boolean;
}

interface AuditStatistics {
  occupiedRooms: number;
  roomRevenue: number;
  totalRevenue: number;
}

interface NightAuditActionsProps {
  currentAudit: NightAudit | null | undefined;
  preAuditData?: PreAuditChecklist;
  auditStats?: AuditStatistics;
  onStartAudit: () => void;
  onPostCharges: () => void;
  onCompleteAudit: (notes?: string) => void;
  isStarting: boolean;
  isPostingCharges: boolean;
  isCompleting: boolean;
}

export function NightAuditActions({
  currentAudit,
  preAuditData,
  auditStats,
  onStartAudit,
  onPostCharges,
  onCompleteAudit,
  isStarting,
  isPostingCharges,
  isCompleting,
}: NightAuditActionsProps) {
  const [notes, setNotes] = useState('');

  const isAuditStarted = currentAudit?.status === 'in_progress';
  const isAuditCompleted = currentAudit?.status === 'completed';

  const allChecklistComplete = preAuditData
    ? Object.values(preAuditData).every(Boolean)
    : false;

  const hasIncompleteItems = preAuditData
    ? Object.values(preAuditData).some((v) => !v)
    : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Actions</CardTitle>
        <CardDescription>
          Execute the night audit process step by step
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Start Audit */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
              1
            </div>
            <div>
              <p className="font-medium">Start Night Audit</p>
              <p className="text-sm text-muted-foreground">
                Begin the audit process for today's business date
              </p>
            </div>
          </div>
          <Button
            onClick={onStartAudit}
            disabled={isAuditStarted || isAuditCompleted || isStarting}
          >
            {isStarting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isAuditStarted ? 'Started' : isAuditCompleted ? 'Completed' : 'Start Audit'}
          </Button>
        </div>

        {/* Step 2: Post Room Charges */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
              2
            </div>
            <div>
              <p className="font-medium">Post Room Charges</p>
              <p className="text-sm text-muted-foreground">
                Automatically post room charges for {auditStats?.occupiedRooms || 0} occupied rooms
              </p>
            </div>
          </div>
          <Button
            onClick={onPostCharges}
            disabled={!isAuditStarted || isAuditCompleted || isPostingCharges}
            variant="secondary"
          >
            {isPostingCharges ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="mr-2 h-4 w-4" />
            )}
            Post Charges
          </Button>
        </div>

        {/* Step 3: Complete Audit */}
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Complete Night Audit</p>
                <p className="text-sm text-muted-foreground">
                  Close the business day and generate reports
                </p>
              </div>
            </div>
          </div>

          {hasIncompleteItems && isAuditStarted && (
            <div className="flex items-center gap-2 rounded-md bg-yellow-500/10 px-3 py-2 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              Some checklist items are incomplete. Review before completing.
            </div>
          )}

          <Textarea
            placeholder="Add any notes for this night audit (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!isAuditStarted || isAuditCompleted}
            rows={3}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="w-full"
                disabled={!isAuditStarted || isAuditCompleted || isCompleting}
              >
                {isCompleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Complete Night Audit
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Complete Night Audit?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will close the business day and finalize all reports. This action cannot be undone.
                  {hasIncompleteItems && (
                    <span className="block mt-2 text-yellow-600 dark:text-yellow-400">
                      ⚠️ Warning: Some checklist items are still incomplete.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onCompleteAudit(notes || undefined)}>
                  Complete Audit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {isAuditCompleted && (
          <div className="flex items-center gap-2 rounded-md bg-green-500/10 px-4 py-3 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Night audit has been completed for this business date.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
