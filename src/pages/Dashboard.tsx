import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  Users,
  Calendar,
  Wallet,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
  Wrench,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenant } from '@/hooks/useTenant';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { ROOM_STATUS_CONFIG, type RoomStatus } from '@/types/database';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AdminChatbot } from '@/components/admin/AdminChatbot';

interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  dirtyRooms: number;
  maintenanceRooms: number;
  todayArrivals: number;
  todayDepartures: number;
  inHouseGuests: number;
  pendingReservations: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingHousekeepingTasks: number;
  inProgressHousekeepingTasks: number;
  openMaintenanceTickets: number;
  criticalMaintenanceTickets: number;
}

export default function Dashboard() {
  const { currentProperty, subscription, tenant } = useTenant();
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    dirtyRooms: 0,
    maintenanceRooms: 0,
    todayArrivals: 0,
    todayDepartures: 0,
    inHouseGuests: 0,
    pendingReservations: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    pendingHousekeepingTasks: 0,
    inProgressHousekeepingTasks: 0,
    openMaintenanceTickets: 0,
    criticalMaintenanceTickets: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentProperty?.id) return;

    const fetchStats = async () => {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      try {
        // Fetch room counts by status
        const { data: rooms } = await supabase
          .from('rooms')
          .select('status')
          .eq('property_id', currentProperty.id)
          .eq('is_active', true);

        const roomCounts = (rooms || []).reduce((acc, room) => {
          acc[room.status as RoomStatus] = (acc[room.status as RoomStatus] || 0) + 1;
          return acc;
        }, {} as Record<RoomStatus, number>);

        // Fetch today's arrivals
        const { count: arrivals } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .eq('check_in_date', today)
          .eq('status', 'confirmed');

        // Fetch today's departures
        const { count: departures } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .eq('check_out_date', today)
          .eq('status', 'checked_in');

        // Fetch in-house guests
        const { count: inHouse } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .eq('status', 'checked_in');

        // Fetch pending reservations
        const { count: pending } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .eq('status', 'confirmed')
          .gte('check_in_date', today);

        // Fetch today's payments for revenue
        const { data: todayPayments } = await supabase
          .from('payments')
          .select('amount, created_at')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`)
          .eq('voided', false);

        const todayRevenue = (todayPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

        // Fetch month's payments for revenue
        const { data: monthPayments } = await supabase
          .from('payments')
          .select('amount')
          .gte('created_at', `${monthStart}T00:00:00`)
          .eq('voided', false);

        const monthRevenue = (monthPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

        // Fetch pending housekeeping tasks
        const { count: pendingTasks } = await supabase
          .from('housekeeping_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .eq('status', 'pending');

        // Fetch in-progress housekeeping tasks
        const { count: inProgressTasks } = await supabase
          .from('housekeeping_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .eq('status', 'in_progress');

        // Fetch open maintenance tickets
        const { count: openTickets } = await supabase
          .from('maintenance_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .in('status', ['open', 'in_progress']);

        // Fetch critical maintenance tickets (priority 3)
        const { count: criticalTickets } = await supabase
          .from('maintenance_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .in('status', ['open', 'in_progress'])
          .eq('priority', 3);

        setStats({
          totalRooms: rooms?.length || 0,
          occupiedRooms: roomCounts.occupied || 0,
          vacantRooms: roomCounts.vacant || 0,
          dirtyRooms: roomCounts.dirty || 0,
          maintenanceRooms: (roomCounts.maintenance || 0) + (roomCounts.out_of_order || 0),
          todayArrivals: arrivals || 0,
          todayDepartures: departures || 0,
          inHouseGuests: inHouse || 0,
          pendingReservations: pending || 0,
          todayRevenue,
          monthRevenue,
          pendingHousekeepingTasks: pendingTasks || 0,
          inProgressHousekeepingTasks: inProgressTasks || 0,
          openMaintenanceTickets: openTickets || 0,
          criticalMaintenanceTickets: criticalTickets || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [currentProperty?.id]);

  const occupancyRate = stats.totalRooms > 0
    ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100)
    : 0;

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  if (!currentProperty) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No property selected. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with logo, name, date and property info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Hotel Logo */}
          {tenant?.logo_url && (
            <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-lg">
              <AvatarImage src={tenant.logo_url} alt={tenant.name} className="object-cover" />
              <AvatarFallback className="text-lg bg-gradient-to-br from-vibrant-blue to-vibrant-purple text-white font-bold">
                {tenant.name?.substring(0, 2).toUpperCase() || 'HT'}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gradient-primary">
              {tenant?.name ? `${tenant.name} Dashboard` : 'Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} • {currentProperty?.name}
            </p>
          </div>
        </div>
        {subscription && (
          <Badge className="w-fit bg-gradient-to-r from-vibrant-blue to-vibrant-purple text-white border-0 shadow-md">
            {subscription.plan?.name || 'Free'} Plan
          </Badge>
        )}
      </div>

      {/* Primary KPIs - Vibrant gradient cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Occupancy Rate */}
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-vibrant-blue to-vibrant-purple" />
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/5" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">
              Occupancy Rate
            </CardTitle>
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            {isLoading ? (
              <Skeleton className="h-10 w-24 bg-white/20" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">{occupancyRate}%</span>
                  {occupancyRate > 70 ? (
                    <span className="flex items-center text-emerald-300 text-sm">
                      <ArrowUpRight className="h-4 w-4" />
                      Good
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-300 text-sm">
                      <ArrowDownRight className="h-4 w-4" />
                      Low
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/70 mt-1">
                  {stats.occupiedRooms} of {stats.totalRooms} rooms occupied
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Today's Revenue */}
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-vibrant-green to-vibrant-teal" />
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/5" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">
              Today's Revenue
            </CardTitle>
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Wallet className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            {isLoading ? (
              <Skeleton className="h-10 w-28 bg-white/20" />
            ) : (
              <>
                <div className="text-4xl font-bold text-white">{formatCurrency(stats.todayRevenue)}</div>
                <p className="text-sm text-white/70 mt-1">
                  {formatCurrency(stats.monthRevenue)} this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-vibrant-amber to-vibrant-orange" />
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/5" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">
              Housekeeping Tasks
            </CardTitle>
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            {isLoading ? (
              <Skeleton className="h-10 w-20 bg-white/20" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">{stats.pendingHousekeepingTasks}</span>
                  <span className="text-sm text-white/70">pending</span>
                </div>
                <p className="text-sm text-white/70 mt-1">
                  {stats.inProgressHousekeepingTasks} in progress
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Tickets */}
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-vibrant-rose to-vibrant-pink" />
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/5" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">
              Maintenance Tickets
            </CardTitle>
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Wrench className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            {isLoading ? (
              <Skeleton className="h-10 w-20 bg-white/20" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">{stats.openMaintenanceTickets}</span>
                  <span className="text-sm text-white/70">open</span>
                </div>
                {stats.criticalMaintenanceTickets > 0 ? (
                  <p className="flex items-center gap-1 text-sm text-amber-200 mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    {stats.criticalMaintenanceTickets} critical
                  </p>
                ) : (
                  <p className="flex items-center gap-1 text-sm text-emerald-200 mt-1">
                    <CheckCircle2 className="h-4 w-4" />
                    No critical issues
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Room Status Overview */}
        <Card className="shadow-md border hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Room Status</CardTitle>
                <CardDescription>Current status of all rooms</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild className="shadow-sm hover:shadow">
                <Link to="/rooms">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {Object.entries(ROOM_STATUS_CONFIG).map(([status, config]) => {
                  const count = status === 'vacant' ? stats.vacantRooms
                    : status === 'occupied' ? stats.occupiedRooms
                    : status === 'dirty' ? stats.dirtyRooms
                    : status === 'maintenance' ? stats.maintenanceRooms
                    : status === 'out_of_order' ? 0
                    : 0;

                  const gradients: Record<string, string> = {
                    vacant: 'from-emerald-400 to-emerald-600',
                    occupied: 'from-blue-400 to-blue-600',
                    dirty: 'from-amber-400 to-amber-600',
                    maintenance: 'from-purple-400 to-purple-600',
                    out_of_order: 'from-rose-400 to-rose-600',
                  };

                  return (
                    <div
                      key={status}
                      className="group flex flex-col items-center rounded-xl border p-4 text-center transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div
                        className={cn(
                          'mb-2 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white bg-gradient-to-br transition-transform group-hover:scale-110',
                          gradients[status]
                        )}
                      >
                        {count}
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Activity */}
        <Card className="shadow-md border hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Today's Activity</CardTitle>
                <CardDescription>Arrivals, departures & reservations</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild className="shadow-sm hover:shadow">
                <Link to="/front-desk">Front Desk</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-md hover:border-vibrant-green/30 hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg">
                    <ArrowUpRight className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Arrivals</p>
                    <p className="text-sm text-muted-foreground">Expected check-ins today</p>
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-10 w-12" />
                ) : (
                  <span className="text-3xl font-bold text-vibrant-green">{stats.todayArrivals}</span>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-md hover:border-vibrant-amber/30 hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg">
                    <ArrowDownRight className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Departures</p>
                    <p className="text-sm text-muted-foreground">Expected check-outs today</p>
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-10 w-12" />
                ) : (
                  <span className="text-3xl font-bold text-vibrant-amber">{stats.todayDepartures}</span>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-md hover:border-vibrant-blue/30 hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">In-House Guests</p>
                    <p className="text-sm text-muted-foreground">Currently staying</p>
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-10 w-12" />
                ) : (
                  <span className="text-3xl font-bold text-vibrant-blue">{stats.inHouseGuests}</span>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-md hover:border-vibrant-cyan/30 hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Pending Reservations</p>
                    <p className="text-sm text-muted-foreground">Upcoming confirmed</p>
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-10 w-12" />
                ) : (
                  <span className="text-3xl font-bold text-vibrant-cyan">{stats.pendingReservations}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-md border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="group h-auto justify-start gap-4 p-4 border-2 hover:border-vibrant-blue/50 hover:bg-vibrant-blue/5 transition-all" 
              asChild
            >
              <Link to="/reservations">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow group-hover:scale-110 transition-transform">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">New Reservation</p>
                  <p className="text-xs text-muted-foreground">Create booking</p>
                </div>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="group h-auto justify-start gap-4 p-4 border-2 hover:border-vibrant-green/50 hover:bg-vibrant-green/5 transition-all" 
              asChild
            >
              <Link to="/front-desk">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Check-In Guest</p>
                  <p className="text-xs text-muted-foreground">Process arrival</p>
                </div>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="group h-auto justify-start gap-4 p-4 border-2 hover:border-vibrant-amber/50 hover:bg-vibrant-amber/5 transition-all" 
              asChild
            >
              <Link to="/housekeeping">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow group-hover:scale-110 transition-transform">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Housekeeping</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingHousekeepingTasks} tasks pending
                  </p>
                </div>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="group h-auto justify-start gap-4 p-4 border-2 hover:border-vibrant-rose/50 hover:bg-vibrant-rose/5 transition-all" 
              asChild
            >
              <Link to="/maintenance">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow group-hover:scale-110 transition-transform">
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Maintenance</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.openMaintenanceTickets} tickets open
                  </p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Chatbot */}
      <AdminChatbot />
    </div>
  );
}
