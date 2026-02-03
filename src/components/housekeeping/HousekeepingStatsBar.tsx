import { ClipboardList, Clock, CheckCircle2, Home, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface HousekeepingStatsBarProps {
  stats: {
    pending: number;
    inProgress: number;
    completed: number;
    totalRooms: number;
    dirtyRooms: number;
  } | undefined;
  isLoading: boolean;
}

export function HousekeepingStatsBar({ stats, isLoading }: HousekeepingStatsBarProps) {
  const statItems = [
    {
      label: 'Pending Tasks',
      value: stats?.pending || 0,
      icon: ClipboardList,
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-white/20',
    },
    {
      label: 'In Progress',
      value: stats?.inProgress || 0,
      icon: Clock,
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Completed Today',
      value: stats?.completed || 0,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Dirty Rooms',
      value: stats?.dirtyRooms || 0,
      icon: AlertTriangle,
      gradient: 'from-rose-500 to-red-600',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Total Rooms',
      value: stats?.totalRooms || 0,
      icon: Home,
      gradient: 'from-slate-500 to-slate-700',
      iconBg: 'bg-white/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {statItems.map((item) => (
        <Card 
          key={item.label} 
          className={cn(
            "relative overflow-hidden border-none shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
            `bg-gradient-to-br ${item.gradient}`
          )}
        >
          {/* Decorative circles */}
          <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-white/5" />
          
          <CardContent className="relative z-10 flex items-center gap-3 p-4">
            <div className={cn("rounded-xl p-2.5", item.iconBg)}>
              <item.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{item.value}</p>
              <p className="text-xs text-white/80 font-medium">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
