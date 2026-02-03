import { cn } from "@/lib/utils";
import type { RoomStatus } from "@/types/database";

interface RoomStatusBadgeProps {
  status: RoomStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<RoomStatus, { label: string; colorClass: string; dotClass: string }> = {
  vacant: {
    label: "Vacant",
    colorClass: "bg-room-vacant/10 text-room-vacant border-room-vacant/30",
    dotClass: "bg-room-vacant",
  },
  occupied: {
    label: "Occupied",
    colorClass: "bg-room-occupied/10 text-room-occupied border-room-occupied/30",
    dotClass: "bg-room-occupied",
  },
  dirty: {
    label: "Dirty",
    colorClass: "bg-room-dirty/10 text-room-dirty border-room-dirty/30",
    dotClass: "bg-room-dirty",
  },
  maintenance: {
    label: "Maintenance",
    colorClass: "bg-room-maintenance/10 text-room-maintenance border-room-maintenance/30",
    dotClass: "bg-room-maintenance",
  },
  out_of_order: {
    label: "Out of Order",
    colorClass: "bg-room-out-of-order/10 text-room-out-of-order border-room-out-of-order/30",
    dotClass: "bg-room-out-of-order",
  },
};

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-2xs",
  md: "px-2 py-0.5 text-xs",
  lg: "px-2.5 py-1 text-sm",
};

export function RoomStatusBadge({
  status,
  size = "md",
  showLabel = true,
  className,
}: RoomStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.colorClass,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
      {showLabel && config.label}
    </span>
  );
}

export function RoomStatusDot({ status, className }: { status: RoomStatus; className?: string }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn("inline-block h-3 w-3 rounded-full", config.dotClass, className)}
      title={config.label}
    />
  );
}
