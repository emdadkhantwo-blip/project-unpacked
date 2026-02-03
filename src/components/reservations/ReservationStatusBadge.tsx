import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReservationStatus } from "@/hooks/useReservations";

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
  className?: string;
}

const statusConfig: Record<ReservationStatus, { label: string; className: string }> = {
  confirmed: {
    label: "Confirmed",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20",
  },
  checked_in: {
    label: "Checked In",
    className: "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
  },
  checked_out: {
    label: "Checked Out",
    className: "bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20",
  },
  no_show: {
    label: "No Show",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
  },
};

const ReservationStatusBadge = React.forwardRef<
  HTMLDivElement,
  ReservationStatusBadgeProps
>(({ status, className }, ref) => {
  const config = statusConfig[status];

  return (
    <Badge
      ref={ref}
      variant="outline"
      className={cn("font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
});
ReservationStatusBadge.displayName = "ReservationStatusBadge";

export { ReservationStatusBadge };
