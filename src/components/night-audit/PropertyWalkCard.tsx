import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  BedDouble, 
  UtensilsCrossed, 
  SprayCan, 
  DoorClosed,
  CheckCircle2,
  AlertCircle 
} from 'lucide-react';

interface PropertyWalkCardProps {
  checklist?: {
    allReservationsCheckedIn: boolean;
    noShowsMarked: boolean;
    posOrdersPosted: boolean;
    pendingPaymentsRecorded: boolean;
    housekeepingComplete: boolean;
  };
  onViewPendingOrders?: () => void;
  onViewPendingArrivals?: () => void;
}

const departments = [
  {
    key: 'frontDesk',
    label: 'Front Desk',
    icon: DoorClosed,
    checkKeys: ['allReservationsCheckedIn', 'noShowsMarked', 'pendingPaymentsRecorded'] as const,
    pendingLabel: 'Arrivals to confirm',
  },
  {
    key: 'rooms',
    label: 'Rooms',
    icon: BedDouble,
    checkKeys: [] as const,
    pendingLabel: 'Room status',
  },
  {
    key: 'restaurant',
    label: 'Restaurant',
    icon: UtensilsCrossed,
    checkKeys: ['posOrdersPosted'] as const,
    pendingLabel: 'Orders to close',
  },
  {
    key: 'housekeeping',
    label: 'Housekeeping',
    icon: SprayCan,
    checkKeys: ['housekeepingComplete'] as const,
    pendingLabel: 'Tasks pending',
  },
];

export function PropertyWalkCard({ 
  checklist,
  onViewPendingOrders,
  onViewPendingArrivals 
}: PropertyWalkCardProps) {
  const getStatus = (checkKeys: readonly string[]) => {
    if (!checklist) return 'loading';
    if (checkKeys.length === 0) return 'ok';
    return checkKeys.every(key => checklist[key as keyof typeof checklist]) ? 'ok' : 'attention';
  };

  const allComplete = checklist 
    ? Object.values(checklist).every(Boolean) 
    : false;

  return (
    <div className="bg-twilight-card rounded-2xl p-6 border border-[hsl(230_30%_25%)]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[hsl(220_15%_90%)]">
          Walking the Property
        </h3>
        <p className="text-sm text-[hsl(220_15%_60%)] mt-1">
          {allComplete 
            ? 'Everything looks ready for closing'
            : 'A few areas need attention before we close'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {departments.map((dept, index) => {
          const status = getStatus(dept.checkKeys);
          const Icon = dept.icon;

          return (
            <motion.div
              key={dept.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className={cn(
                'flex flex-col items-center p-4 rounded-xl transition-all duration-300 cursor-default',
                status === 'ok' && 'bg-[hsl(160_60%_45%/0.1)] border border-[hsl(160_60%_45%/0.2)]',
                status === 'attention' && 'bg-[hsl(38_80%_55%/0.08)] border border-[hsl(38_80%_55%/0.2)] animate-gentle-pulse',
                status === 'loading' && 'bg-[hsl(230_30%_25%/0.5)] border border-[hsl(230_30%_30%)]'
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full mb-3',
                  status === 'ok' && 'bg-[hsl(160_60%_45%/0.15)]',
                  status === 'attention' && 'bg-[hsl(38_80%_55%/0.15)]',
                  status === 'loading' && 'bg-[hsl(230_30%_30%)]'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    status === 'ok' && 'text-[hsl(160_60%_45%)]',
                    status === 'attention' && 'text-[hsl(38_80%_55%)]',
                    status === 'loading' && 'text-[hsl(220_15%_50%)]'
                  )}
                />
              </div>
              <p className="text-sm font-medium text-[hsl(220_15%_85%)]">
                {dept.label}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {status === 'ok' ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-[hsl(160_60%_45%)]" />
                    <span className="text-[10px] text-[hsl(160_60%_45%)]">Ready</span>
                  </>
                ) : status === 'attention' ? (
                  <>
                    <AlertCircle className="h-3 w-3 text-[hsl(38_80%_55%)]" />
                    <span className="text-[10px] text-[hsl(38_80%_55%)]">Review</span>
                  </>
                ) : (
                  <span className="text-[10px] text-[hsl(220_15%_50%)]">Checking...</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Gentle attention message */}
      {!allComplete && checklist && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-6 p-4 rounded-xl bg-[hsl(38_80%_55%/0.05)] border border-[hsl(38_80%_55%/0.15)]"
        >
          <p className="text-sm text-[hsl(38_80%_65%)]">
            {!checklist.posOrdersPosted
              ? 'The kitchen has open orders waiting to be closed or posted to guest folios.'
              : !checklist.allReservationsCheckedIn
              ? "Some expected arrivals haven't checked in yet. Consider marking them as no-shows."
              : !checklist.housekeepingComplete
              ? 'There are housekeeping tasks still in progress.'
              : 'A few items need attention before closing.'}
          </p>
          <p className="text-xs text-[hsl(220_15%_50%)] mt-2">
            You can proceed anyway — these can be resolved tomorrow.
          </p>
        </motion.div>
      )}
    </div>
  );
}
