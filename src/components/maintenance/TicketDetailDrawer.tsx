import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  User,
  MapPin,
  Calendar,
  FileText,
  Wrench,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MaintenanceTicket } from "@/hooks/useMaintenance";

interface TicketDetailDrawerProps {
  ticket: MaintenanceTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign?: () => void;
  onResolve?: () => void;
  canAssign?: boolean;
}

const STATUS_CONFIG = {
  open: {
    label: "Open",
    icon: AlertCircle,
    className: "border-warning text-warning",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className: "bg-primary text-primary-foreground",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle,
    className: "bg-success/20 text-success border-success",
  },
};

const PRIORITY_CONFIG = {
  1: { label: "Normal", className: "bg-muted text-muted-foreground" },
  2: { label: "High", className: "bg-warning/20 text-warning" },
  3: { label: "Critical", className: "bg-destructive/20 text-destructive" },
};

export function TicketDetailDrawer({
  ticket,
  open,
  onOpenChange,
  onAssign,
  onResolve,
  canAssign = true,
}: TicketDetailDrawerProps) {
  if (!ticket) return null;

  const statusConfig = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
  const priorityConfig = PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[1];
  const StatusIcon = statusConfig.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <SheetTitle className="text-xl pr-4">{ticket.title}</SheetTitle>
            </div>
            <SheetDescription className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline" className={statusConfig.className}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusConfig.label}
              </Badge>
              <Badge className={priorityConfig.className}>{priorityConfig.label} Priority</Badge>
            </SheetDescription>
          </div>

          {/* Actions */}
          {ticket.status !== "resolved" && (
            <div className="flex gap-2">
              {canAssign && !ticket.assigned_to && (
                <Button variant="outline" size="sm" onClick={onAssign}>
                  <User className="mr-1 h-4 w-4" />
                  Assign
                </Button>
              )}
              {ticket.status === "in_progress" && (
                <Button size="sm" onClick={onResolve}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Resolve
                </Button>
              )}
            </div>
          )}
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="space-y-4">
            {/* Description */}
            {ticket.description && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.room && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Room {ticket.room.room_number}
                      {ticket.room.floor && ` (Floor ${ticket.room.floor})`}
                    </span>
                  </div>
                )}
                {ticket.assigned_profile && (
                  <div className="flex items-center gap-3 text-sm">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Assigned to:{" "}
                      <span className="font-medium">
                        {ticket.assigned_profile.full_name || ticket.assigned_profile.username}
                      </span>
                    </span>
                  </div>
                )}
                {ticket.reported_profile && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Reported by:{" "}
                      <span className="font-medium">
                        {ticket.reported_profile.full_name || ticket.reported_profile.username}
                      </span>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Created: {format(new Date(ticket.created_at), "MMM d, yyyy 'at' HH:mm")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>

            {/* Resolution (if resolved) */}
            {ticket.status === "resolved" && (
              <Card className="border-success/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-success">Resolution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ticket.resolution_notes && (
                    <p className="text-sm whitespace-pre-wrap">{ticket.resolution_notes}</p>
                  )}
                  {ticket.resolved_at && (
                    <p className="text-xs text-muted-foreground">
                      Resolved on {format(new Date(ticket.resolved_at), "MMM d, yyyy 'at' HH:mm")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
