import { motion } from 'framer-motion';
import { Moon, Sun, FileText, Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';

interface CompletionStats {
  roomsCharged: number;
  totalRevenue: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
}

interface AuditCompletionCelebrationProps {
  businessDate: string;
  hotelName?: string;
  stats: CompletionStats;
  completedAt?: string;
  onViewReport: () => void;
  onExportPDF: () => void;
  onStartNewDay?: () => void;
}

export function AuditCompletionCelebration({
  businessDate,
  hotelName,
  stats,
  completedAt,
  onViewReport,
  onExportPDF,
  onStartNewDay,
}: AuditCompletionCelebrationProps) {
  const kpiCards = [
    {
      label: 'Rooms Charged',
      value: stats.roomsCharged.toString(),
      suffix: 'rooms',
      color: 'hsl(262 60% 55%)',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      color: 'hsl(160 60% 45%)',
    },
    {
      label: 'Occupancy',
      value: `${stats.occupancyRate.toFixed(1)}%`,
      color: 'hsl(217 91% 60%)',
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Ambient glow background */}
      <div className="absolute inset-0 bg-twilight-glow pointer-events-none" />
      
      {/* Floating stars decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[hsl(38_80%_55%/0.5)]"
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 3) * 20}%`,
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.2, 0.8],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative bg-twilight-card rounded-2xl p-8 border border-[hsl(230_30%_25%)] animate-celebration-glow">
        {/* Header with moon-to-sun icon */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-[hsl(262_60%_55%)] to-[hsl(38_80%_55%)] mb-4 animate-moon-to-sun"
          >
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Moon className="h-8 w-8 text-white" />
            </motion.div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-[hsl(220_15%_95%)] mb-2"
          >
            The Day is Closed
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[hsl(220_15%_60%)]"
          >
            {format(new Date(businessDate), 'MMMM d, yyyy')} has been successfully audited
            and preserved in your records.
          </motion.p>

          {completedAt && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-[hsl(220_15%_50%)] mt-2"
            >
              Completed at {format(new Date(completedAt), 'h:mm a')}
            </motion.p>
          )}
        </div>

        {/* KPI Cards with spring animation */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {kpiCards.map((kpi, index) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: 0.7 + index * 0.15,
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
              className="text-center p-4 rounded-xl bg-[hsl(230_30%_20%)] border border-[hsl(230_30%_30%)]"
              style={{
                boxShadow: `0 0 20px ${kpi.color}20`,
              }}
            >
              <p
                className="text-2xl font-bold mb-1"
                style={{ color: kpi.color }}
              >
                {kpi.value}
              </p>
              <p className="text-xs text-[hsl(220_15%_50%)]">{kpi.label}</p>
              {kpi.suffix && (
                <p className="text-[10px] text-[hsl(220_15%_40%)]">{kpi.suffix}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Secondary KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="flex justify-center gap-8 mb-8 text-center"
        >
          <div>
            <p className="text-lg font-semibold text-[hsl(38_80%_55%)]">
              {formatCurrency(stats.adr)}
            </p>
            <p className="text-xs text-[hsl(220_15%_50%)]">ADR</p>
          </div>
          <div className="w-px bg-[hsl(230_30%_30%)]" />
          <div>
            <p className="text-lg font-semibold text-[hsl(38_80%_55%)]">
              {formatCurrency(stats.revpar)}
            </p>
            <p className="text-xs text-[hsl(220_15%_50%)]">RevPAR</p>
          </div>
        </motion.div>

        {/* Reassuring message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-center text-sm text-[hsl(160_60%_45%)] mb-6"
        >
          The hotel is ready for a new day.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <Button
            variant="outline"
            onClick={onViewReport}
            className="border-[hsl(230_30%_35%)] bg-transparent hover:bg-[hsl(230_30%_20%)] text-[hsl(220_15%_85%)]"
          >
            <FileText className="mr-2 h-4 w-4" />
            View Report
          </Button>
          <Button
            variant="outline"
            onClick={onExportPDF}
            className="border-[hsl(230_30%_35%)] bg-transparent hover:bg-[hsl(230_30%_20%)] text-[hsl(220_15%_85%)]"
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          {onStartNewDay && (
            <Button
              onClick={onStartNewDay}
              className="bg-gradient-to-r from-[hsl(262_60%_55%)] to-[hsl(217_91%_60%)] hover:opacity-90 text-white"
            >
              Start New Day
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
