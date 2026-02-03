import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Building2,
  Search,
  Users,
  DoorOpen,
  MoreHorizontal,
  Ban,
  CheckCircle2,
  Eye,
  Shield,
  TrendingUp,
  Activity,
  Globe,
  Plus,
  FileText,
  Settings,
  RefreshCw,
  ClipboardList,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantDetailDrawer } from "@/components/admin/TenantDetailDrawer";
import { ApplicationCard } from "@/components/admin/ApplicationCard";
import { ApplicationDetailDrawer } from "@/components/admin/ApplicationDetailDrawer";
import {
  useAdminTenants,
  useUpdateTenantStatus,
  type TenantWithStats,
} from "@/hooks/useAdminTenants";
import {
  useAdminApplications,
  type AdminApplication,
} from "@/hooks/useAdminApplications";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";

export default function AdminTenants() {
  const [search, setSearch] = useState("");
  const [applicationSearch, setApplicationSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<TenantWithStats | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<AdminApplication | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [applicationDrawerOpen, setApplicationDrawerOpen] = useState(false);
  const { profile } = useAuth();

  const { data: tenants = [], isLoading, refetch } = useAdminTenants();
  const { data: applications = [], isLoading: applicationsLoading, refetch: refetchApplications } = useAdminApplications();
  const updateStatus = useUpdateTenantStatus();

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(search.toLowerCase())
  );

  const filteredApplications = applications.filter(
    (app) =>
      app.full_name.toLowerCase().includes(applicationSearch.toLowerCase()) ||
      app.hotel_name.toLowerCase().includes(applicationSearch.toLowerCase()) ||
      app.email.toLowerCase().includes(applicationSearch.toLowerCase())
  );

  const totalProperties = tenants.reduce((acc, t) => acc + t.properties_count, 0);
  const totalStaff = tenants.reduce((acc, t) => acc + t.staff_count, 0);
  const totalRooms = tenants.reduce((acc, t) => acc + t.rooms_count, 0);
  const activeTenants = tenants.length; // All tenants are considered active without status field
  const suspendedTenants = 0;

  const pendingApplications = applications.filter((a) => a.status === "pending").length;
  const approvedApplications = applications.filter((a) => a.status === "approved").length;
  const rejectedApplications = applications.filter((a) => a.status === "rejected").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (planType: string | null) => {
    switch (planType) {
      case "pro":
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
            Pro
          </Badge>
        );
      case "growth":
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
            Growth
          </Badge>
        );
      default:
        return <Badge variant="outline">Starter</Badge>;
    }
  };

  const handleViewTenant = (tenant: TenantWithStats) => {
    setSelectedTenant(tenant);
    setDrawerOpen(true);
  };

  const handleViewApplication = (application: AdminApplication) => {
    setSelectedApplication(application);
    setApplicationDrawerOpen(true);
  };

  const handleSuspend = (_tenant: TenantWithStats) => {
    // Tenant status updates require database table changes
    toast.info("Tenant status management requires additional database configuration");
  };

  const handleReactivate = (_tenant: TenantWithStats) => {
    // Tenant status updates require database table changes
    toast.info("Tenant status management requires additional database configuration");
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 p-6 md:p-8 text-white">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Shield className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Platform Administration
                </h1>
                <p className="text-purple-100 mt-1">
                  Welcome back, {profile?.full_name || profile?.username || 'Administrator'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2">
                <Activity className="h-4 w-4 text-emerald-300" />
                <span className="text-sm font-medium">System Online</span>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => { refetch(); refetchApplications(); }}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenants.length}</p>
                <p className="text-xs text-muted-foreground">Total Tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingApplications}</p>
                <p className="text-xs text-muted-foreground">Pending Apps</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeTenants}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalProperties}</p>
                <p className="text-xs text-muted-foreground">Properties</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/20">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStaff}</p>
                <p className="text-xs text-muted-foreground">Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/20">
                <DoorOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRooms}</p>
                <p className="text-xs text-muted-foreground">Rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950/20"
        >
          <Plus className="h-5 w-5 text-purple-600" />
          <span className="text-sm">Create Tenant</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/20"
        >
          <FileText className="h-5 w-5 text-blue-600" />
          <span className="text-sm">Export Reports</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-950/20"
        >
          <TrendingUp className="h-5 w-5 text-amber-600" />
          <span className="text-sm">View Analytics</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-slate-50 hover:border-slate-200 dark:hover:bg-slate-950/20"
        >
          <Settings className="h-5 w-5 text-slate-600" />
          <span className="text-sm">System Settings</span>
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="applications" className="data-[state=active]:bg-background">
            <ClipboardList className="h-4 w-4 mr-2" />
            Applications
            {pendingApplications > 0 && (
              <Badge className="ml-2 h-5 px-1.5 bg-amber-500 text-white">{pendingApplications}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tenants" className="data-[state=active]:bg-background">
            <Building2 className="h-4 w-4 mr-2" />
            Tenants
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-background">
            <Activity className="h-4 w-4 mr-2" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          {/* Application Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{pendingApplications}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500/50" />
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{approvedApplications}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-rose-500">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{rejectedApplications}</p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
                <Ban className="h-8 w-8 text-rose-500/50" />
              </CardContent>
            </Card>
          </div>

          {/* Applications List */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                  <CardTitle className="text-lg">Admin Applications</CardTitle>
                  <CardDescription>
                    Review and process hotel management applications
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search applications..."
                    value={applicationSearch}
                    onChange={(e) => setApplicationSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {applicationsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-40" />
                  ))}
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No applications found</p>
                  <p className="text-xs text-muted-foreground/70">New applications will appear here</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredApplications.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      onView={handleViewApplication}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4">
          {/* Tenants Table */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                  <CardTitle className="text-lg">All Tenants</CardTitle>
                  <CardDescription>
                    View and manage tenant accounts across the platform
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tenants..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead>Tenant</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-10 w-48" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredTenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <Building2 className="h-10 w-10 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No tenants found</p>
                            <p className="text-xs text-muted-foreground/70">Try adjusting your search criteria</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTenants.map((tenant) => (
                        <TableRow 
                          key={tenant.id} 
                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => handleViewTenant(tenant)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <p className="font-medium">{tenant.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {tenant.slug}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getPlanBadge(null)}</TableCell>
                          <TableCell>
                            <div className="space-y-1 min-w-[120px]">
                              <div className="flex items-center gap-2 text-xs">
                                <Globe className="h-3 w-3 text-muted-foreground" />
                                <span>{tenant.properties_count} properties</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span>{tenant.staff_count} staff</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <DoorOpen className="h-3 w-3 text-muted-foreground" />
                                <span>{tenant.rooms_count} rooms</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge("active")}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(tenant.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewTenant(tenant)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleSuspend(tenant)}
                                  className="text-destructive"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend Tenant
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <AuditLogViewer />
        </TabsContent>
      </Tabs>

      {/* Tenant Detail Drawer */}
      <TenantDetailDrawer
        tenant={selectedTenant}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      {/* Application Detail Drawer */}
      <ApplicationDetailDrawer
        application={selectedApplication}
        open={applicationDrawerOpen}
        onOpenChange={setApplicationDrawerOpen}
      />
    </div>
  );
}
