import { format } from "date-fns";
import { Building2, Mail, Phone, User, Clock, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminApplication } from "@/hooks/useAdminApplications";

interface ApplicationCardProps {
  application: AdminApplication;
  onView: (application: AdminApplication) => void;
}

export function ApplicationCard({ application, onView }: ApplicationCardProps) {
  const statusConfig = {
    pending: {
      label: "Pending",
      borderColor: "border-l-amber-500",
      badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    approved: {
      label: "Approved",
      borderColor: "border-l-emerald-500",
      badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    rejected: {
      label: "Rejected",
      borderColor: "border-l-rose-500",
      badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    },
  };

  const config = statusConfig[application.status];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-l-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        config.borderColor
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Logo/Avatar */}
          <div className="flex-shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
              <Building2 className="h-7 w-7 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">
                  {application.hotel_name}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {application.full_name}
                </p>
              </div>
              <Badge className={cn("flex-shrink-0", config.badgeClass)}>
                {config.label}
              </Badge>
            </div>

            <div className="mt-3 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                {application.email}
              </p>
              {application.phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  {application.phone}
                </p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Applied {format(new Date(application.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(application)}
            className="gap-1.5"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
