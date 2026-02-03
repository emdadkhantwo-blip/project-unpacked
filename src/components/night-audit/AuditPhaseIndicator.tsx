import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';

export type AuditPhase = 
  | 'idle'
  | 'reviewing'
  | 'confirming'
  | 'posting'
  | 'settling'
  | 'completing'
  | 'complete';

interface PhaseConfig {
  key: AuditPhase;
  label: string;
  description: string;
}

const phases: PhaseConfig[] = [
  { key: 'reviewing', label: 'Review', description: 'Walking the property' },
  { key: 'confirming', label: 'Confirm', description: 'Reviewing summary' },
  { key: 'posting', label: 'Post', description: 'Room charges' },
  { key: 'settling', label: 'Settle', description: 'Outstanding items' },
  { key: 'complete', label: 'Close', description: 'Day preserved' },
];

interface AuditPhaseIndicatorProps {
  currentPhase: AuditPhase;
  className?: string;
}

const phaseOrder: AuditPhase[] = ['idle', 'reviewing', 'confirming', 'posting', 'settling', 'completing', 'complete'];

function getPhaseIndex(phase: AuditPhase): number {
  return phaseOrder.indexOf(phase);
}

export function AuditPhaseIndicator({ currentPhase, className }: AuditPhaseIndicatorProps) {
  const currentIndex = getPhaseIndex(currentPhase);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {phases.map((phase, index) => {
          const phaseIdx = getPhaseIndex(phase.key);
          const isComplete = currentIndex > phaseIdx;
          const isCurrent = phase.key === currentPhase || 
            (currentPhase === 'completing' && phase.key === 'complete');
          const isPending = currentIndex < phaseIdx;

          return (
            <div key={phase.key} className="flex flex-col items-center relative flex-1">
              {/* Connecting line */}
              {index > 0 && (
                <div 
                  className={cn(
                    'absolute top-4 right-1/2 w-full h-0.5 -z-10',
                    isComplete ? 'bg-[hsl(160_60%_45%)]' : 'bg-[hsl(230_30%_35%)]'
                  )}
                />
              )}
              
              {/* Phase circle */}
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  boxShadow: isCurrent 
                    ? '0 0 20px hsl(262 60% 55% / 0.4)' 
                    : 'none',
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 z-10 transition-colors duration-300',
                  isComplete && 'bg-[hsl(160_60%_45%)] border-[hsl(160_60%_45%)]',
                  isCurrent && 'bg-[hsl(262_60%_55%)] border-[hsl(262_60%_55%)]',
                  isPending && 'bg-[hsl(230_35%_22%)] border-[hsl(230_30%_35%)]'
                )}
              >
                {isComplete ? (
                  <Check className="h-4 w-4 text-white" />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Circle className="h-3 w-3 text-white fill-white" />
                  </motion.div>
                ) : (
                  <Circle className="h-3 w-3 text-[hsl(230_30%_35%)]" />
                )}
              </motion.div>

              {/* Phase label */}
              <p
                className={cn(
                  'mt-2 text-xs font-medium transition-colors duration-300',
                  isComplete && 'text-[hsl(160_60%_45%)]',
                  isCurrent && 'text-[hsl(262_60%_65%)]',
                  isPending && 'text-[hsl(220_15%_60%)]'
                )}
              >
                {phase.label}
              </p>
              <p className="text-[10px] text-[hsl(220_15%_50%)] mt-0.5 hidden sm:block">
                {phase.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
