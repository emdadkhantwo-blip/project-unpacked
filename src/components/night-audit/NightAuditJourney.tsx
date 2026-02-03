import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Moon, Play, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
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
import { AuditPhaseIndicator, type AuditPhase } from './AuditPhaseIndicator';
import { PropertyWalkCard } from './PropertyWalkCard';
import { RoomChargeProgress } from './RoomChargeProgress';
import { AuditCompletionCelebration } from './AuditCompletionCelebration';
import { formatCurrency } from '@/lib/currency';
import type { NightAudit, AuditStatistics } from '@/hooks/useNightAudit';

interface PreAuditChecklist {
  allReservationsCheckedIn: boolean;
  noShowsMarked: boolean;
  posOrdersPosted: boolean;
  pendingPaymentsRecorded: boolean;
  housekeepingComplete: boolean;
}

interface RoomDetail {
  id: string;
  room_number: string;
  room_type_name: string;
  rate_per_night: number;
  status: string;
}

interface NightAuditJourneyProps {
  businessDate: string;
  hotelName?: string;
  currentAudit: NightAudit | null | undefined;
  preAuditData?: PreAuditChecklist;
  auditStats?: AuditStatistics;
  roomDetails: RoomDetail[];
  outstandingFoliosCount: number;
  outstandingBalance: number;
  onStartAudit: () => void;
  onPostCharges: () => void;
  onCompleteAudit: (notes?: string) => void;
  onViewReport: () => void;
  onExportPDF: () => void;
  isStarting: boolean;
  isPostingCharges: boolean;
  isCompleting: boolean;
}

export function NightAuditJourney({
  businessDate,
  hotelName,
  currentAudit,
  preAuditData,
  auditStats,
  roomDetails,
  outstandingFoliosCount,
  outstandingBalance,
  onStartAudit,
  onPostCharges,
  onCompleteAudit,
  onViewReport,
  onExportPDF,
  isStarting,
  isPostingCharges,
  isCompleting,
}: NightAuditJourneyProps) {
  const [notes, setNotes] = useState('');
  const [chargesComplete, setChargesComplete] = useState(false);

  // Determine current phase based on audit state
  const getCurrentPhase = (): AuditPhase => {
    if (!currentAudit || currentAudit.status === 'pending') return 'idle';
    if (currentAudit.status === 'completed') return 'complete';
    if (isPostingCharges) return 'posting';
    if (isCompleting) return 'completing';
    if (chargesComplete) return 'settling';
    if (currentAudit.status === 'in_progress') return 'reviewing';
    return 'idle';
  };

  const phase = getCurrentPhase();
  const isAuditCompleted = currentAudit?.status === 'completed';
  const isAuditStarted = currentAudit?.status === 'in_progress';

  const allChecklistComplete = preAuditData
    ? Object.values(preAuditData).every(Boolean)
    : false;

  const hasIncompleteItems = preAuditData
    ? Object.values(preAuditData).some((v) => !v)
    : false;

  // Prepare room charge data
  const occupiedRooms = roomDetails
    .filter(r => r.status === 'occupied')
    .map(r => ({
      id: r.id,
      room_number: r.room_number,
      room_type: r.room_type_name,
      rate: r.rate_per_night,
      status: 'pending' as const,
    }));

  const handleChargesComplete = useCallback(() => {
    setChargesComplete(true);
  }, []);

  return (
    <div className="min-h-[600px] bg-twilight-gradient rounded-2xl p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-twilight-glow pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[hsl(262_60%_55%/0.2)] mb-4">
            <Moon className="h-6 w-6 text-[hsl(262_60%_65%)]" />
          </div>
          <h2 className="text-xl font-semibold text-[hsl(220_15%_95%)]">
            {isAuditCompleted 
              ? 'The Day is Closed'
              : hotelName 
                ? `The evening settles over ${hotelName}`
                : 'The evening settles over the property'}
          </h2>
          <p className="text-sm text-[hsl(220_15%_60%)] mt-2">
            {isAuditCompleted
              ? 'Records are preserved and protected'
              : "Let's review and close this business day together"}
          </p>
          <p className="text-xs text-[hsl(220_15%_50%)] mt-1">
            Business Date: {format(new Date(businessDate), 'MMMM d, yyyy')}
          </p>
        </motion.div>

        {/* Phase indicator - only show when audit is in progress */}
        {(isAuditStarted || isAuditCompleted) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <AuditPhaseIndicator currentPhase={phase} />
          </motion.div>
        )}

        {/* Content based on phase */}
        <AnimatePresence mode="wait">
          {/* IDLE - Not started */}
          {phase === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <PropertyWalkCard checklist={preAuditData} />

              {/* Quick stats preview */}
              {auditStats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-twilight-card rounded-xl p-4 border border-[hsl(230_30%_25%)] text-center">
                    <p className="text-2xl font-bold text-[hsl(217_91%_60%)]">
                      {auditStats.occupiedRooms}
                    </p>
                    <p className="text-xs text-[hsl(220_15%_50%)]">Occupied Rooms</p>
                  </div>
                  <div className="bg-twilight-card rounded-xl p-4 border border-[hsl(230_30%_25%)] text-center">
                    <p className="text-2xl font-bold text-[hsl(160_60%_45%)]">
                      {formatCurrency(auditStats.totalRevenue)}
                    </p>
                    <p className="text-xs text-[hsl(220_15%_50%)]">Today's Revenue</p>
                  </div>
                  <div className="bg-twilight-card rounded-xl p-4 border border-[hsl(230_30%_25%)] text-center">
                    <p className="text-2xl font-bold text-[hsl(262_60%_65%)]">
                      {auditStats.occupancyRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-[hsl(220_15%_50%)]">Occupancy</p>
                  </div>
                </div>
              )}

              {/* Start button */}
              <div className="text-center pt-4">
                <Button
                  size="lg"
                  onClick={onStartAudit}
                  disabled={isStarting}
                  className="bg-gradient-to-r from-[hsl(262_60%_55%)] to-[hsl(217_91%_60%)] hover:opacity-90 text-white px-8"
                >
                  {isStarting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-5 w-5" />
                  )}
                  Begin Closing the Day
                </Button>
                <p className="text-xs text-[hsl(220_15%_50%)] mt-3">
                  This will start the night audit process
                </p>
              </div>
            </motion.div>
          )}

          {/* REVIEWING - Audit started, confirming before posting */}
          {phase === 'reviewing' && !chargesComplete && (
            <motion.div
              key="reviewing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <PropertyWalkCard checklist={preAuditData} />

              {/* Ready to post charges */}
              <div className="bg-twilight-card rounded-2xl p-6 border border-[hsl(230_30%_25%)]">
                <h3 className="text-lg font-semibold text-[hsl(220_15%_90%)] mb-2">
                  Ready to Post Charges
                </h3>
                <p className="text-sm text-[hsl(220_15%_60%)] mb-4">
                  {occupiedRooms.length} occupied rooms will be charged tonight's rate.
                  Taxes and service charges will be applied.
                </p>

                <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(230_30%_18%)] mb-4">
                  <span className="text-sm text-[hsl(220_15%_70%)]">Estimated room revenue:</span>
                  <span className="text-lg font-semibold text-[hsl(160_60%_45%)]">
                    {formatCurrency(occupiedRooms.reduce((sum, r) => sum + r.rate, 0))}
                  </span>
                </div>

                <Button
                  onClick={onPostCharges}
                  disabled={isPostingCharges}
                  className="w-full bg-gradient-to-r from-[hsl(262_60%_55%)] to-[hsl(38_80%_55%)] hover:opacity-90 text-white"
                >
                  {isPostingCharges ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Post Tonight's Charges
                </Button>
              </div>
            </motion.div>
          )}

          {/* POSTING - Room charges being posted */}
          {phase === 'posting' && (
            <motion.div
              key="posting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RoomChargeProgress
                rooms={occupiedRooms}
                isPosting={isPostingCharges}
                onComplete={handleChargesComplete}
              />
            </motion.div>
          )}

          {/* SETTLING - Outstanding items review */}
          {phase === 'settling' && (
            <motion.div
              key="settling"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Charges posted success */}
              <div className="bg-[hsl(160_60%_45%/0.1)] border border-[hsl(160_60%_45%/0.2)] rounded-xl p-4">
                <p className="text-sm text-[hsl(160_60%_45%)]">
                  ✓ Room charges have been posted successfully
                </p>
              </div>

              {/* Outstanding folios */}
              {outstandingFoliosCount > 0 && (
                <div className="bg-twilight-card rounded-2xl p-6 border border-[hsl(38_80%_55%/0.2)]">
                  <h3 className="text-lg font-semibold text-[hsl(220_15%_90%)] mb-2">
                    A Few Things to Note
                  </h3>
                  <p className="text-sm text-[hsl(220_15%_60%)] mb-4">
                    Before we close the day
                  </p>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-[hsl(38_80%_55%/0.08)]">
                    <AlertCircle className="h-5 w-5 text-[hsl(38_80%_55%)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-[hsl(38_80%_60%)]">
                        {outstandingFoliosCount} folio{outstandingFoliosCount > 1 ? 's have' : ' has'} open balances
                        totaling {formatCurrency(outstandingBalance)}
                      </p>
                      <p className="text-xs text-[hsl(220_15%_50%)] mt-1">
                        These can be settled tomorrow morning.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Completion section */}
              <div className="bg-twilight-card rounded-2xl p-6 border border-[hsl(230_30%_25%)]">
                <h3 className="text-lg font-semibold text-[hsl(220_15%_90%)] mb-4">
                  Close and Preserve
                </h3>

                <Textarea
                  placeholder="Add any notes for this night audit (optional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="bg-[hsl(230_30%_18%)] border-[hsl(230_30%_30%)] text-[hsl(220_15%_85%)] placeholder:text-[hsl(220_15%_40%)] mb-4"
                />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full bg-gradient-to-r from-[hsl(160_60%_45%)] to-[hsl(168_76%_42%)] hover:opacity-90 text-white"
                      disabled={isCompleting}
                    >
                      {isCompleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Moon className="mr-2 h-4 w-4" />
                      )}
                      Close and Preserve
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[hsl(230_35%_16%)] border-[hsl(230_30%_25%)]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-[hsl(220_15%_95%)]">
                        Close the Business Day?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-[hsl(220_15%_60%)]">
                        Once closed, this day becomes part of your permanent record.
                        All transactions are preserved and the business date will advance.
                        {hasIncompleteItems && (
                          <span className="block mt-3 text-[hsl(38_80%_60%)]">
                            Note: Some checklist items are still pending. These will carry over to tomorrow.
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-[hsl(230_30%_35%)] text-[hsl(220_15%_85%)] hover:bg-[hsl(230_30%_20%)]">
                        Go Back
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onCompleteAudit(notes || undefined)}
                        className="bg-gradient-to-r from-[hsl(160_60%_45%)] to-[hsl(168_76%_42%)] text-white"
                      >
                        Close and Preserve
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <p className="text-xs text-[hsl(220_15%_50%)] text-center mt-3">
                  Once closed, this day becomes part of your permanent record
                </p>
              </div>
            </motion.div>
          )}

          {/* COMPLETE - Celebration */}
          {phase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <AuditCompletionCelebration
                businessDate={businessDate}
                hotelName={hotelName}
                stats={{
                  roomsCharged: auditStats?.occupiedRooms || 0,
                  totalRevenue: auditStats?.totalRevenue || 0,
                  occupancyRate: auditStats?.occupancyRate || 0,
                  adr: auditStats?.adr || 0,
                  revpar: auditStats?.revpar || 0,
                }}
                completedAt={currentAudit?.completed_at || undefined}
                onViewReport={onViewReport}
                onExportPDF={onExportPDF}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
