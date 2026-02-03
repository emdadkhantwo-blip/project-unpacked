import { useState, useMemo } from "react";
import { Plus, Users } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { useGuests, useGuestStats } from "@/hooks/useGuests";
import { useGuestNotifications } from "@/hooks/useGuestNotifications";
import { GuestStatsBar } from "@/components/guests/GuestStatsBar";
import { GuestFilters } from "@/components/guests/GuestFilters";
import { GuestCard } from "@/components/guests/GuestCard";
import { GuestDetailDrawer } from "@/components/guests/GuestDetailDrawer";
import { EditGuestDialog } from "@/components/guests/EditGuestDialog";
import { CreateGuestDialog } from "@/components/reservations/CreateGuestDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Guest } from "@/hooks/useGuests";

export default function Guests() {
  const { currentProperty } = useTenant();

  // Enable real-time notifications for guests
  useGuestNotifications();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Data hooks
  const { data: guests = [], isLoading: guestsLoading } = useGuests(searchQuery);
  const { data: stats, isLoading: statsLoading } = useGuestStats();

  // Filter guests by status
  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      if (statusFilter === "vip") return guest.is_vip;
      if (statusFilter === "blacklisted") return guest.is_blacklisted;
      if (statusFilter === "regular") return !guest.is_vip && !guest.is_blacklisted;
      return true;
    });
  }, [guests, statusFilter]);

  const handleGuestClick = (guest: Guest) => {
    setSelectedGuest(guest);
    setDrawerOpen(true);
  };

  const handleEditClick = () => {
    setDrawerOpen(false);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Guests</h1>
          <p className="text-sm text-muted-foreground">
            {currentProperty?.name} — Manage your guest database
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Guest
        </Button>
      </div>

      {/* Stats Bar */}
      <GuestStatsBar
        totalGuests={stats?.total ?? 0}
        vipGuests={stats?.vip ?? 0}
        blacklistedGuests={stats?.blacklisted ?? 0}
        totalRevenue={stats?.totalRevenue ?? 0}
        isLoading={statsLoading}
      />

      {/* Filters */}
      <GuestFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Guest List */}
      <div className="space-y-3">
        {guestsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))
        ) : filteredGuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No guests found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Add your first guest to get started"}
            </p>
          </div>
        ) : (
          filteredGuests.map((guest) => (
            <GuestCard
              key={guest.id}
              guest={guest}
              onClick={() => handleGuestClick(guest)}
            />
          ))
        )}
      </div>

      {/* Guest Detail Drawer */}
      <GuestDetailDrawer
        guest={selectedGuest}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onEdit={handleEditClick}
      />

      {/* Edit Guest Dialog */}
      <EditGuestDialog
        guest={selectedGuest}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Create Guest Dialog */}
      <CreateGuestDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
