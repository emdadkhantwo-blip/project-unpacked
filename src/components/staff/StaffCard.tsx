import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Mail, Phone, Building2, KeyRound, Calendar, Briefcase } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStaff, type StaffMember } from "@/hooks/useStaff";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { AssignShiftsDialog } from "./AssignShiftsDialog";

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  owner: { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-500/20" },
  manager: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
  front_desk: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  accountant: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20" },
  housekeeping: { bg: "bg-cyan-500/10", text: "text-cyan-600", border: "border-cyan-500/20" },
  maintenance: { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-500/20" },
  kitchen: { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/20" },
  waiter: { bg: "bg-pink-500/10", text: "text-pink-600", border: "border-pink-500/20" },
  night_auditor: { bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-500/20" },
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  front_desk: "Front Desk",
  accountant: "Accountant",
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  kitchen: "Kitchen",
  waiter: "Waiter",
  night_auditor: "Night Auditor",
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
};

interface StaffCardProps {
  member: StaffMember;
  onViewDetails: () => void;
}

export function StaffCard({ member, onViewDetails }: StaffCardProps) {
  const { toggleActiveStatus } = useStaff();
  const { properties } = useTenant();
  const { roles: userRoles } = useAuth();

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showAssignShifts, setShowAssignShifts] = useState(false);

  const canResetPassword = userRoles.includes("owner") || userRoles.includes("superadmin");
  const canAssignShifts = userRoles.includes("owner") || userRoles.includes("manager") || userRoles.includes("front_desk");

  const initials =
    member.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || member.username[0].toUpperCase();

  const accessibleProperties = properties.filter((p) =>
    member.property_access.includes(p.id)
  );

  return (
    <>
      <Card className={cn(
        "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-l-4",
        member.is_active ? "border-l-emerald-500" : "border-l-slate-400 opacity-70"
      )}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-background shadow-md">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback className={cn(
                "font-semibold text-white",
                member.is_active 
                  ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                  : "bg-gradient-to-br from-slate-400 to-slate-600"
              )}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">
                {member.full_name || member.username}
              </h3>
              <p className="text-sm text-muted-foreground">@{member.username}</p>
              {member.staff_id && (
                <p className="text-xs text-muted-foreground">{member.staff_id}</p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={onViewDetails}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canResetPassword && (
                <DropdownMenuItem onClick={() => setShowResetPassword(true)}>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Reset Password
                </DropdownMenuItem>
              )}
              {canAssignShifts && (
                <DropdownMenuItem onClick={() => setShowAssignShifts(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Assign Shifts
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  toggleActiveStatus({
                    userId: member.id,
                    isActive: !member.is_active,
                  })
                }
              >
                {member.is_active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "text-xs font-medium border-none shadow-sm",
                member.is_active 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" 
                  : "bg-slate-200 text-slate-600"
              )}
            >
              {member.is_active ? "Active" : "Inactive"}
            </Badge>
            {member.employment_type && (
              <Badge variant="outline" className="text-xs">
                <Briefcase className="h-3 w-3 mr-1" />
                {EMPLOYMENT_TYPE_LABELS[member.employment_type] || member.employment_type}
              </Badge>
            )}
          </div>

          {/* Department */}
          {member.department_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="rounded-full bg-violet-500/10 p-1">
                <Building2 className="h-3 w-3 text-violet-500" />
              </div>
              <span>{member.department_name}</span>
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-1.5 text-sm">
            {member.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="rounded-full bg-blue-500/10 p-1">
                  <Mail className="h-3 w-3 text-blue-500" />
                </div>
                <span className="truncate">{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="rounded-full bg-emerald-500/10 p-1">
                  <Phone className="h-3 w-3 text-emerald-500" />
                </div>
                <span>{member.phone}</span>
              </div>
            )}
          </div>

          {/* Roles */}
          <div className="flex flex-wrap gap-1.5">
            {member.roles.length > 0 ? (
              member.roles.map((role) => {
                const colors = ROLE_COLORS[role] || { bg: "bg-muted", text: "text-muted-foreground", border: "border-muted" };
                return (
                  <Badge
                    key={role}
                    variant="outline"
                    className={cn("text-xs font-medium", colors.bg, colors.text, colors.border)}
                  >
                    {ROLE_LABELS[role] || role}
                  </Badge>
                );
              })
            ) : (
              <span className="text-xs text-muted-foreground">No roles assigned</span>
            )}
          </div>

          {/* Property Access */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="rounded-full bg-purple-500/10 p-1">
              <Building2 className="h-3 w-3 text-purple-500" />
            </div>
            <span>
              {accessibleProperties.length === 0
                ? "No property access"
                : accessibleProperties.length === 1
                ? accessibleProperties[0].name
                : `${accessibleProperties.length} properties`}
            </span>
          </div>

          {/* Last Login */}
          {member.last_login_at && (
            <p className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full inline-block">
              Last login:{" "}
              {formatDistanceToNow(new Date(member.last_login_at), {
                addSuffix: true,
              })}
            </p>
          )}

          {/* View Details Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={onViewDetails}
          >
            Manage Staff
          </Button>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ResetPasswordDialog
        open={showResetPassword}
        onOpenChange={setShowResetPassword}
        staffId={member.id}
        staffName={member.full_name || member.username}
      />

      <AssignShiftsDialog
        open={showAssignShifts}
        onOpenChange={setShowAssignShifts}
        staffId={member.id}
        staffName={member.full_name || member.username}
      />
    </>
  );
}
