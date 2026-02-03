import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Progress } from '@/components/ui/progress';

interface RoomChargeItem {
  id: string;
  room_number: string;
  room_type: string;
  rate: number;
  status: 'pending' | 'posting' | 'done';
}

interface RoomChargeProgressProps {
  rooms: RoomChargeItem[];
  isPosting: boolean;
  onComplete?: () => void;
}

export function RoomChargeProgress({ 
  rooms, 
  isPosting,
  onComplete 
}: RoomChargeProgressProps) {
  const [processedCount, setProcessedCount] = useState(0);
  const [displayRooms, setDisplayRooms] = useState<RoomChargeItem[]>(rooms);

  // Simulate progressive room charging animation
  useEffect(() => {
    if (!isPosting) {
      setProcessedCount(0);
      setDisplayRooms(rooms.map(r => ({ ...r, status: 'pending' as const })));
      return;
    }

    const interval = setInterval(() => {
      setProcessedCount(prev => {
        const next = prev + 1;
        if (next >= rooms.length) {
          clearInterval(interval);
          onComplete?.();
          return rooms.length;
        }
        return next;
      });
    }, 150); // 150ms per room for visual effect

    return () => clearInterval(interval);
  }, [isPosting, rooms.length, onComplete]);

  // Update display rooms based on processed count
  useEffect(() => {
    setDisplayRooms(rooms.map((room, idx) => ({
      ...room,
      status: idx < processedCount ? 'done' : idx === processedCount && isPosting ? 'posting' : 'pending'
    })));
  }, [processedCount, rooms, isPosting]);

  const progress = rooms.length > 0 ? (processedCount / rooms.length) * 100 : 0;
  const totalRevenue = rooms.slice(0, processedCount).reduce((sum, r) => sum + r.rate, 0);

  return (
    <div className="bg-twilight-card rounded-2xl p-6 border border-[hsl(230_30%_25%)]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[hsl(220_15%_90%)]">
          Posting Tonight's Charges
        </h3>
        <p className="text-sm text-[hsl(220_15%_60%)] mt-1">
          {isPosting 
            ? 'The hotel is settling into balance...'
            : processedCount === rooms.length && rooms.length > 0
            ? 'All room charges have been posted'
            : 'Ready to post room charges'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[hsl(220_15%_60%)]">
            {processedCount} of {rooms.length} rooms processed
          </span>
          <span className="text-[hsl(160_60%_45%)] font-medium">
            {formatCurrency(totalRevenue)}
          </span>
        </div>
        <div className="relative h-2 rounded-full overflow-hidden bg-[hsl(230_30%_25%)]">
          <motion.div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              isPosting ? 'animate-progress-shimmer' : 'bg-[hsl(160_60%_45%)]'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Room list with staggered animation */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin pr-2">
        <AnimatePresence mode="popLayout">
          {displayRooms.slice(0, Math.min(processedCount + 5, rooms.length)).map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-colors duration-300',
                room.status === 'done' && 'bg-[hsl(160_60%_45%/0.1)]',
                room.status === 'posting' && 'bg-[hsl(262_60%_55%/0.15)] border-glow-purple',
                room.status === 'pending' && 'bg-[hsl(230_30%_20%)]'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                    room.status === 'done' && 'bg-[hsl(160_60%_45%/0.2)] text-[hsl(160_60%_45%)]',
                    room.status === 'posting' && 'bg-[hsl(262_60%_55%/0.2)] text-[hsl(262_60%_65%)]',
                    room.status === 'pending' && 'bg-[hsl(230_30%_30%)] text-[hsl(220_15%_50%)]'
                  )}
                >
                  {room.room_number}
                </div>
                <div>
                  <p className="text-sm font-medium text-[hsl(220_15%_85%)]">
                    Room {room.room_number}
                  </p>
                  <p className="text-xs text-[hsl(220_15%_50%)]">{room.room_type}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[hsl(220_15%_85%)]">
                  {formatCurrency(room.rate)}
                </span>
                {room.status === 'done' ? (
                  <Check className="h-4 w-4 text-[hsl(160_60%_45%)]" />
                ) : room.status === 'posting' ? (
                  <Loader2 className="h-4 w-4 text-[hsl(262_60%_65%)] animate-spin" />
                ) : (
                  <div className="h-4 w-4" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Completion message */}
      {processedCount === rooms.length && rooms.length > 0 && !isPosting && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-xl bg-[hsl(160_60%_45%/0.1)] border border-[hsl(160_60%_45%/0.2)]"
        >
          <p className="text-sm text-[hsl(160_60%_45%)]">
            All charges have settled. The property is in balance.
          </p>
        </motion.div>
      )}
    </div>
  );
}
