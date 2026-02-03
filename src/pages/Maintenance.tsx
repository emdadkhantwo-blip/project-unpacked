import { useState, useMemo, useCallback } from "react";
import { Plus, Wrench, Bell } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { useMaintenanceNotifications } from "@/hooks/useMaintenanceNotifications";
import {
  useMaintenanceTickets,
  useMaintenanceStats,
  useMyAssignedTickets,
  useMyMaintenanceStats,
  useDeleteTicket,
  type MaintenanceTicket,
} from "@/hooks/useMaintenance";
import { MaintenanceStatsBar } from "@/components/maintenance/MaintenanceStatsBar";
import { MaintenanceStaffDashboard } from "@/components/maintenance/MaintenanceStaffDashboard";
import { TicketFilters } from "@/components/maintenance/TicketFilters";
import { TicketCard } from "@/components/maintenance/TicketCard";
import { TicketDetailDrawer } from "@/components/maintenance/TicketDetailDrawer";
import { CreateTicketDialog } from "@/components/maintenance/CreateTicketDialog";
import { AssignTicketDialog } from "@/components/maintenance/AssignTicketDialog";
import { ResolveTicketDialog } from "@/components/maintenance/ResolveTicketDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function Maintenance() {
  const { currentProperty } = useTenant();
  const { hasAnyRole, hasRole } = useAuth();

  // Enable real-time notifications for maintenance tickets
  useMaintenanceNotifications();

  // Role-based permissions
  const canCreateTicket = hasAnyRole(['owner', 'manager', 'front_desk']);
  const canAssignTicket = hasAnyRole(['owner', 'manager']);
  const canDeleteTicket = hasAnyRole(['owner', 'manager']);
  const isMaintenanceStaff = hasRole('maintenance') && !hasAnyRole(['owner', 'manager']);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // UI State
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Data hooks
  const { data: tickets = [], isLoading: ticketsLoading } = useMaintenanceTickets({
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? parseInt(priorityFilter) : undefined,
  });
  const { data: stats, isLoading: statsLoading } = useMaintenanceStats();
  const { data: myTickets } = useMyAssignedTickets();
  const { data: myStats, isLoading: myStatsLoading } = useMyMaintenanceStats();
  const deleteTicket = useDeleteTicket();

  const myTicketCount = myTickets?.length || 0;

  // Filter by search query
  const filteredTickets = useMemo(() => {
    if (!searchQuery) return tickets;
    const query = searchQuery.toLowerCase();
    return tickets.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.room?.room_number?.toLowerCase().includes(query)
    );
  }, [tickets, searchQuery]);

  const handleViewTicket = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setDrawerOpen(true);
  };

  const handleAssignTicket = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setAssignDialogOpen(true);
  };

  const handleResolveTicket = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setResolveDialogOpen(true);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    await deleteTicket.mutateAsync(ticketId);
  };

  const scrollToTicket = useCallback((ticketId: string) => {
    setNotificationOpen(false);
    
    setTimeout(() => {
      const ticketElement = document.getElementById(`ticket-${ticketId}`);
      if (ticketElement) {
        ticketElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ticketElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          ticketElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
        }, 2000);
      }
    }, 100);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            {currentProperty?.name} — Track and manage maintenance tickets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* My Tickets Notification Button */}
          <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {myTicketCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {myTicketCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">My Assigned Tickets</h4>
                {myTicketCount === 0 ? (
                  <p className="text-sm text-muted-foreground">No tickets assigned to you.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {myTickets?.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => scrollToTicket(ticket.id)}
                        className="flex items-center justify-between p-2 bg-muted rounded-md cursor-pointer hover:bg-accent transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{ticket.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.room ? `Room ${ticket.room.room_number}` : 'No room'} • {ticket.status === 'open' ? 'Open' : 'In Progress'}
                          </p>
                        </div>
                        <Badge variant={ticket.status === 'open' ? 'secondary' : 'default'}>
                          {ticket.status === 'open' ? 'Start' : 'Continue'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {canCreateTicket && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Staff Dashboard - shown for maintenance role */}
      {isMaintenanceStaff && (
        <MaintenanceStaffDashboard
          assignedCount={myStats?.assigned ?? 0}
          openCount={myStats?.open ?? 0}
          inProgressCount={myStats?.inProgress ?? 0}
          resolvedTodayCount={myStats?.resolvedToday ?? 0}
          highPriorityCount={myStats?.highPriority ?? 0}
          isLoading={myStatsLoading}
        />
      )}

      {/* Stats Bar - shown for managers/owners */}
      {!isMaintenanceStaff && (
        <MaintenanceStatsBar
          openCount={stats?.open ?? 0}
          inProgressCount={stats?.inProgress ?? 0}
          resolvedCount={stats?.resolved ?? 0}
          highPriorityCount={stats?.highPriority ?? 0}
          isLoading={statsLoading}
        />
      )}

      {/* Filters */}
      <TicketFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
      />

      {/* Ticket List */}
      <div className="space-y-3">
        {ticketsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No tickets found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                ? "Try adjusting your filters"
                : "Create a new ticket to get started"}
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              id={`ticket-${ticket.id}`}
              ticket={ticket}
              onView={() => handleViewTicket(ticket)}
              onAssign={() => handleAssignTicket(ticket)}
              onResolve={() => handleResolveTicket(ticket)}
              onDelete={() => handleDeleteTicket(ticket.id)}
              canAssign={canAssignTicket}
              canDelete={canDeleteTicket}
            />
          ))
        )}
      </div>

      {/* Dialogs & Drawers */}
      <TicketDetailDrawer
        ticket={selectedTicket}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        canAssign={canAssignTicket}
        onAssign={() => {
          setDrawerOpen(false);
          setAssignDialogOpen(true);
        }}
        onResolve={() => {
          setDrawerOpen(false);
          setResolveDialogOpen(true);
        }}
      />

      <CreateTicketDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <AssignTicketDialog
        ticket={selectedTicket}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />

      <ResolveTicketDialog
        ticket={selectedTicket}
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
      />
    </div>
  );
}