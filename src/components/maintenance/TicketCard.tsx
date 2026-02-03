import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  User,
  MapPin,
  Calendar,
  Trash2,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MaintenanceTicket } from "@/hooks/useMaintenance";
import { cn } from "@/lib/utils";

interface TicketCardProps {
  ticket: MaintenanceTicket;
  onAssign?: () => void;
  onResolve?: () => void;
  onView?: () => void;
  onDelete?: () => void;
  canAssign?: boolean;
  canDelete?: boolean;
  id?: string;
}

const STATUS_CONFIG = {
  open: {
    label: "Open",
    icon: AlertCircle,
    className: "bg-amber-100 text-amber-700 border-amber-200",
    borderColor: "border-l-amber-500",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className: "bg-blue-100 text-blue-700 border-blue-200",
    borderColor: "border-l-blue-500",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle,
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    borderColor: "border-l-emerald-500",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
};

const PRIORITY_CONFIG = {
  1: { 
    label: "Normal", 
    className: "bg-slate-100 text-slate-700 border-slate-200",
    indicator: "bg-slate-400",
  },
  2: { 
    label: "High", 
    className: "bg-amber-100 text-amber-700 border-amber-200",
    indicator: "bg-amber-500",
  },
  3: { 
    label: "Critical", 
    className: "bg-rose-100 text-rose-700 border-rose-200",
    indicator: "bg-rose-500",
  },
};

export function TicketCard({ ticket, onAssign, onResolve, onView, onDelete, canAssign = true, canDelete = true, id }: TicketCardProps) {
  const statusConfig = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
  const priorityConfig = PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[1];
  const StatusIcon = statusConfig.icon;

  return (
    <Card 
      id={id} 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-l-4",
        statusConfig.borderColor,
        ticket.priority === 3 && "ring-1 ring-rose-200"
      )} 
      onClick={onView}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={cn("p-2 rounded-lg", statusConfig.iconBg)}>
                <Wrench className={cn("h-5 w-5", statusConfig.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">{ticket.title}</h3>
                  {ticket.priority >= 2 && (
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full",
                      ticket.priority === 3 ? "bg-rose-100" : "bg-amber-100"
                    )}>
                      <AlertTriangle className={cn("h-3 w-3", ticket.priority === 3 ? "text-rose-600" : "text-amber-600")} />
                      <span className={cn("text-xs font-medium", ticket.priority === 3 ? "text-rose-600" : "text-amber-600")}>
                        {priorityConfig.label}
                      </span>
                    </div>
                  )}
                </div>
                {ticket.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {ticket.description}
                  </p>
                )}
              </div>
            </div>
            <Badge className={cn("border shrink-0", statusConfig.className)}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Details Row */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {ticket.room && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span>
                  Room {ticket.room.room_number}
                  {ticket.room.floor && ` · Floor ${ticket.room.floor}`}
                </span>
              </div>
            )}
            {ticket.assigned_profile ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-md">
                <User className="h-3 w-3 text-blue-600" />
                <span className="text-blue-700">{ticket.assigned_profile.full_name || ticket.assigned_profile.username}</span>
              </div>
            ) : ticket.status !== "resolved" && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-md">
                <User className="h-3 w-3 text-amber-600" />
                <span className="text-amber-700">Unassigned</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
            </div>
          </div>

          {/* Resolution Notes (if resolved) */}
          {ticket.status === "resolved" && ticket.resolution_notes && (
            <div className="rounded-lg bg-emerald-50 p-3 border-l-2 border-emerald-500">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <p className="font-medium text-emerald-700 text-sm">Resolution</p>
              </div>
              <p className="text-sm text-emerald-900/70 line-clamp-2">{ticket.resolution_notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {ticket.status !== "resolved" && (
              <>
                {canAssign && !ticket.assigned_to && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssign?.();
                    }}
                  >
                    <User className="mr-1 h-3 w-3" />
                    Assign
                  </Button>
                )}
                {ticket.status === "in_progress" && (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolve?.();
                    }}
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Resolve
                  </Button>
                )}
              </>
            )}
            {canDelete && onDelete && (
              <Button
                size="sm"
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
