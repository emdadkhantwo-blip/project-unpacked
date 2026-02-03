import { useState } from "react";
import { useStaff, useStaffStats } from "@/hooks/useStaff";
import { StaffStatsBar } from "@/components/staff/StaffStatsBar";
import { StaffFilters } from "@/components/staff/StaffFilters";
import { StaffCard } from "@/components/staff/StaffCard";
import { StaffDetailDrawer } from "@/components/staff/StaffDetailDrawer";
import { InviteStaffDialog } from "@/components/staff/InviteStaffDialog";
import { CreateStaffDialog } from "@/components/staff/CreateStaffDialog";
import { BulkAvatarImportDialog } from "@/components/staff/BulkAvatarImportDialog";
import { Button } from "@/components/ui/button";
import { UserPlus, Mail, ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { StaffMember } from "@/hooks/useStaff";
import type { AppRole } from "@/types/database";

export default function HRStaff() {
  const { staff, isLoading } = useStaff();
  const stats = useStaffStats();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredStaff = staff.filter((member) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      member.full_name?.toLowerCase().includes(searchLower) ||
      member.username.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower);

    // Role filter
    const matchesRole =
      roleFilter === "all" ||
      member.roles.includes(roleFilter as AppRole);

    // Status filter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && member.is_active) ||
      (statusFilter === "inactive" && !member.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleViewDetails = (member: StaffMember) => {
    setSelectedStaff(member);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff Directory</h2>
          <p className="text-muted-foreground">
            Manage employees, roles, and property access
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create Staff
          </Button>
          <Button variant="outline" onClick={() => setIsInviteOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Invite Staff
          </Button>
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Bulk Avatars
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StaffStatsBar stats={stats} />

      {/* Filters */}
      <StaffFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No staff members found</p>
          {(searchQuery || roleFilter !== "all" || statusFilter !== "all") && (
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((member) => (
            <StaffCard
              key={member.id}
              member={member}
              onViewDetails={() => handleViewDetails(member)}
            />
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <StaffDetailDrawer
        staff={selectedStaff}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      {/* Invite Dialog */}
      <InviteStaffDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />

      {/* Create Staff Dialog */}
      <CreateStaffDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {/* Bulk Avatar Import Dialog */}
      <BulkAvatarImportDialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen} />
    </div>
  );
}
