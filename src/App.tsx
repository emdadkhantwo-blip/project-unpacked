import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth, getRoleDashboard } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import { OfflineDetector } from "@/components/OfflineDetector";
import { type AppRole } from "@/types/database";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Reservations from "./pages/Reservations";
import Calendar from "./pages/Calendar";
import FrontDesk from "./pages/FrontDesk";
import Housekeeping from "./pages/Housekeeping";
import Guests from "./pages/Guests";
import Maintenance from "./pages/Maintenance";
import Folios from "./pages/Folios";
import Reports from "./pages/Reports";

import Properties from "./pages/Properties";
import Settings from "./pages/Settings";
import POS from "./pages/POS";
import NightAudit from "./pages/NightAudit";
import Kitchen from "./pages/Kitchen";
import Waiter from "./pages/Waiter";
import CorporateAccounts from "./pages/CorporateAccounts";
import CorporateStatements from "./pages/CorporateStatements";
import References from "./pages/References";
import AdminTenants from "./pages/admin/Tenants";
import AdminApplications from "./pages/admin/Applications";
import AdminSecurity from "./pages/admin/Security";
import Profile from "./pages/Profile";
import { DashboardLayout } from "./components/layout/DashboardLayout";

// HR Module Pages
import HRStaff from "./pages/hr/Staff";
import HRRoles from "./pages/hr/Roles";
import HRAttendance from "./pages/hr/Attendance";
import HRShifts from "./pages/hr/Shifts";
import HRLeave from "./pages/hr/Leave";
import HRPayroll from "./pages/hr/Payroll";
import HROvertime from "./pages/hr/Overtime";
import HRPerformance from "./pages/hr/Performance";
import HRDocuments from "./pages/hr/Documents";
import HRActivity from "./pages/hr/Activity";
import SettingsRates from "./pages/settings/Rates";
import SettingsTaxes from "./pages/settings/Taxes";
import SettingsWebsite from "./pages/settings/Website";
import PublicHotelWebsite from "./pages/PublicHotelWebsite";
const queryClient = new QueryClient();

// Define which routes each role can access
const ROLE_ROUTES: Record<AppRole, string[]> = {
  superadmin: ['*'],
  owner: ['*'],
  manager: ['*'],
  front_desk: ['/dashboard', '/reservations', '/calendar', '/rooms', '/guests', '/front-desk', '/housekeeping', '/maintenance', '/folios', '/corporate', '/corporate/statements'],
  accountant: ['/dashboard', '/folios', '/reports', '/night-audit', '/corporate/statements'],
  housekeeping: ['/housekeeping'],
  maintenance: ['/maintenance'],
  kitchen: ['/kitchen'],
  waiter: ['/pos', '/waiter'],
  night_auditor: ['/dashboard', '/night-audit', '/folios', '/reports'],
};

// Role-protected route wrapper
const RoleProtectedRoute = ({ 
  children, 
  allowedRoles,
  route 
}: { 
  children: React.ReactNode; 
  allowedRoles: AppRole[];
  route: string;
}) => {
  const { user, isLoading, roles, hasAnyRole, isSuperAdmin, rolesLoading } = useAuth();

  if (isLoading || rolesLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for roles to be fetched before making access decisions
  // This prevents premature redirects when roles haven't loaded yet
  if (roles.length === 0 && !rolesLoading) {
    // If roles are still empty after loading, show loading state briefly
    // This handles the case where roles are being fetched
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading permissions...</div>
      </div>
    );
  }

  // Super admins, owners, and managers can access everything
  if (isSuperAdmin || hasAnyRole(['owner', 'manager'])) {
    return <>{children}</>;
  }

  // Check if user's roles allow access to this route
  const canAccess = roles.some(role => {
    const allowedRoutes = ROLE_ROUTES[role] || [];
    return allowedRoutes.includes('*') || allowedRoutes.includes(route);
  });

  if (!canAccess) {
    // Redirect to their appropriate dashboard
    const targetDashboard = getRoleDashboard(roles);
    return <Navigate to={targetDashboard} replace />;
  }

  return <>{children}</>;
};

// Protected route wrapper (basic auth check)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirects to role-appropriate dashboard if logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, roles } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    // Redirect to role-appropriate dashboard
    const targetDashboard = getRoleDashboard(roles);
    return <Navigate to={targetDashboard} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route
      path="/"
      element={
        <PublicRoute>
          <Index />
        </PublicRoute>
      }
    />
    <Route
      path="/auth"
      element={
        <PublicRoute>
          <Auth />
        </PublicRoute>
      }
    />

    {/* Protected routes with DashboardLayout */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardLayout title="Dashboard">
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/rooms"
      element={
        <ProtectedRoute>
          <DashboardLayout title="Rooms">
            <Rooms />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/reservations"
      element={
        <ProtectedRoute>
          <DashboardLayout title="Reservations">
            <Reservations />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/calendar"
      element={
        <ProtectedRoute>
          <DashboardLayout title="Calendar">
            <Calendar />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/front-desk"
      element={
        <RoleProtectedRoute allowedRoles={['front_desk']} route="/front-desk">
          <DashboardLayout title="Front Desk">
            <FrontDesk />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/housekeeping"
      element={
        <RoleProtectedRoute allowedRoles={['housekeeping', 'front_desk']} route="/housekeeping">
          <DashboardLayout title="Housekeeping">
            <Housekeeping />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/guests"
      element={
        <RoleProtectedRoute allowedRoles={['front_desk']} route="/guests">
          <DashboardLayout title="Guests">
            <Guests />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/maintenance"
      element={
        <RoleProtectedRoute allowedRoles={['maintenance', 'front_desk']} route="/maintenance">
          <DashboardLayout title="Maintenance">
            <Maintenance />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/folios"
      element={
        <RoleProtectedRoute allowedRoles={['front_desk', 'accountant', 'night_auditor']} route="/folios">
          <DashboardLayout title="Folios">
            <Folios />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <RoleProtectedRoute allowedRoles={['accountant', 'night_auditor']} route="/reports">
          <DashboardLayout title="Reports">
            <Reports />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/properties"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/properties">
          <DashboardLayout title="Properties">
            <Properties />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/settings/rates"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/settings/rates">
          <DashboardLayout title="Rates & Packages">
            <SettingsRates />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/settings">
          <DashboardLayout title="Settings">
            <Settings />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/pos"
      element={
        <RoleProtectedRoute allowedRoles={['kitchen', 'waiter']} route="/pos">
          <POS />
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/kitchen"
      element={
        <RoleProtectedRoute allowedRoles={['kitchen']} route="/kitchen">
          <Kitchen />
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/waiter"
      element={
        <RoleProtectedRoute allowedRoles={['waiter']} route="/waiter">
          <Waiter />
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/night-audit"
      element={
        <RoleProtectedRoute allowedRoles={['night_auditor', 'accountant']} route="/night-audit">
          <NightAudit />
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/corporate"
      element={
        <RoleProtectedRoute allowedRoles={['front_desk']} route="/corporate">
          <DashboardLayout title="Corporate Accounts">
            <CorporateAccounts />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/corporate/statements"
      element={
        <RoleProtectedRoute allowedRoles={['front_desk', 'accountant']} route="/corporate/statements">
          <DashboardLayout title="Corporate Statements">
            <CorporateStatements />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/references"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/references">
          <DashboardLayout title="References">
            <References />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/admin/tenants"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/admin/tenants">
          <DashboardLayout title="Tenant Management">
            <AdminTenants />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/admin/applications"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/admin/applications">
          <DashboardLayout title="Applications">
            <AdminApplications />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/admin/security"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/admin/security">
          <DashboardLayout title="Security Dashboard">
            <AdminSecurity />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <DashboardLayout title="Profile">
            <Profile />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />

    {/* HR Management Routes */}
    <Route
      path="/hr/staff"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/hr/staff">
          <DashboardLayout title="HR Staff Directory">
            <HRStaff />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/hr/roles"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/hr/roles">
          <DashboardLayout title="Roles & Permissions">
            <HRRoles />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/hr/attendance"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/hr/attendance">
          <DashboardLayout title="Attendance">
            <HRAttendance />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/hr/shifts"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/hr/shifts">
          <DashboardLayout title="Shift Scheduling">
            <HRShifts />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/hr/leave"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/hr/leave">
          <DashboardLayout title="Leave Management">
            <HRLeave />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/hr/payroll"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/hr/payroll">
          <DashboardLayout title="Payroll">
            <HRPayroll />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/hr/overtime"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/hr/overtime">
          <DashboardLayout title="Overtime">
            <HROvertime />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/hr/performance"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/hr/performance">
          <DashboardLayout title="Performance">
            <HRPerformance />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/hr/documents"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/hr/documents">
          <DashboardLayout title="HR Documents">
            <HRDocuments />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/hr/activity"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/hr/activity">
          <DashboardLayout title="HR Activity Logs">
            <HRActivity />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/settings/taxes"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/settings/taxes">
          <DashboardLayout title="Tax Configuration">
            <SettingsTaxes />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/settings/website"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/settings/website">
          <DashboardLayout title="Website Builder">
            <SettingsWebsite />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />

    {/* Public Hotel Website Route (no auth required) */}
    <Route path="/site/:subdomain" element={<PublicHotelWebsite />} />

    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <OfflineDetector>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TenantProvider>
              <AppRoutes />
            </TenantProvider>
          </AuthProvider>
        </BrowserRouter>
      </OfflineDetector>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
