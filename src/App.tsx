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

// AppContent contains the routes and is rendered inside AuthProvider
const AppContent = () => {
  // These hooks are now safely called inside AuthProvider
  const { user, isLoading, roles, rolesLoading, isSuperAdmin, hasAnyRole } = useAuth();

  // Public route wrapper (redirects to role-appropriate dashboard if logged in)
  const PublicRouteWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      );
    }

    if (user) {
      const targetDashboard = getRoleDashboard(roles);
      return <Navigate to={targetDashboard} replace />;
    }

    return <>{children}</>;
  };

  // Protected route wrapper (basic auth check)
  const ProtectedRouteWrapper = ({ children }: { children: React.ReactNode }) => {
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

  // Role-protected route wrapper
  const RoleProtectedRouteWrapper = ({ 
    children, 
    route 
  }: { 
    children: React.ReactNode; 
    route: string;
  }) => {
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

    if (roles.length === 0 && !rolesLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-muted-foreground">Loading permissions...</div>
        </div>
      );
    }

    if (isSuperAdmin || hasAnyRole(['owner', 'manager'])) {
      return <>{children}</>;
    }

    const canAccess = roles.some(role => {
      const allowedRoutes = ROLE_ROUTES[role] || [];
      return allowedRoutes.includes('*') || allowedRoutes.includes(route);
    });

    if (!canAccess) {
      const targetDashboard = getRoleDashboard(roles);
      return <Navigate to={targetDashboard} replace />;
    }

    return <>{children}</>;
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <PublicRouteWrapper>
            <Index />
          </PublicRouteWrapper>
        }
      />
      <Route
        path="/auth"
        element={
          <PublicRouteWrapper>
            <Auth />
          </PublicRouteWrapper>
        }
      />

      {/* Protected routes with DashboardLayout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRouteWrapper>
            <DashboardLayout title="Dashboard">
              <Dashboard />
            </DashboardLayout>
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/rooms"
        element={
          <ProtectedRouteWrapper>
            <DashboardLayout title="Rooms">
              <Rooms />
            </DashboardLayout>
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/reservations"
        element={
          <ProtectedRouteWrapper>
            <DashboardLayout title="Reservations">
              <Reservations />
            </DashboardLayout>
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRouteWrapper>
            <DashboardLayout title="Calendar">
              <Calendar />
            </DashboardLayout>
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/front-desk"
        element={
          <RoleProtectedRouteWrapper route="/front-desk">
            <DashboardLayout title="Front Desk">
              <FrontDesk />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/housekeeping"
        element={
          <RoleProtectedRouteWrapper route="/housekeeping">
            <DashboardLayout title="Housekeeping">
              <Housekeeping />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/guests"
        element={
          <RoleProtectedRouteWrapper route="/guests">
            <DashboardLayout title="Guests">
              <Guests />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/maintenance"
        element={
          <RoleProtectedRouteWrapper route="/maintenance">
            <DashboardLayout title="Maintenance">
              <Maintenance />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/folios"
        element={
          <RoleProtectedRouteWrapper route="/folios">
            <DashboardLayout title="Folios">
              <Folios />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/reports"
        element={
          <RoleProtectedRouteWrapper route="/reports">
            <DashboardLayout title="Reports">
              <Reports />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/properties"
        element={
          <RoleProtectedRouteWrapper route="/properties">
            <DashboardLayout title="Properties">
              <Properties />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/settings/rates"
        element={
          <RoleProtectedRouteWrapper route="/settings/rates">
            <DashboardLayout title="Rates & Packages">
              <SettingsRates />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/settings"
        element={
          <RoleProtectedRouteWrapper route="/settings">
            <DashboardLayout title="Settings">
              <Settings />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/pos"
        element={
          <RoleProtectedRouteWrapper route="/pos">
            <POS />
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/kitchen"
        element={
          <RoleProtectedRouteWrapper route="/kitchen">
            <Kitchen />
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/waiter"
        element={
          <RoleProtectedRouteWrapper route="/waiter">
            <Waiter />
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/night-audit"
        element={
          <RoleProtectedRouteWrapper route="/night-audit">
            <NightAudit />
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/corporate"
        element={
          <RoleProtectedRouteWrapper route="/corporate">
            <DashboardLayout title="Corporate Accounts">
              <CorporateAccounts />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/corporate/statements"
        element={
          <RoleProtectedRouteWrapper route="/corporate/statements">
            <DashboardLayout title="Corporate Statements">
              <CorporateStatements />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/references"
        element={
          <RoleProtectedRouteWrapper route="/references">
            <DashboardLayout title="References">
              <References />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/admin/tenants"
        element={
          <RoleProtectedRouteWrapper route="/admin/tenants">
            <DashboardLayout title="Tenant Management">
              <AdminTenants />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/admin/applications"
        element={
          <RoleProtectedRouteWrapper route="/admin/applications">
            <DashboardLayout title="Applications">
              <AdminApplications />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/admin/security"
        element={
          <RoleProtectedRouteWrapper route="/admin/security">
            <DashboardLayout title="Security Dashboard">
              <AdminSecurity />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRouteWrapper>
            <DashboardLayout title="Profile">
              <Profile />
            </DashboardLayout>
          </ProtectedRouteWrapper>
        }
      />

      {/* HR Management Routes */}
      <Route
        path="/hr/staff"
        element={
          <RoleProtectedRouteWrapper route="/hr/staff">
            <DashboardLayout title="HR Staff Directory">
              <HRStaff />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/hr/roles"
        element={
          <RoleProtectedRouteWrapper route="/hr/roles">
            <DashboardLayout title="Roles & Permissions">
              <HRRoles />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/hr/attendance"
        element={
          <RoleProtectedRouteWrapper route="/hr/attendance">
            <DashboardLayout title="Attendance">
              <HRAttendance />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/hr/shifts"
        element={
          <RoleProtectedRouteWrapper route="/hr/shifts">
            <DashboardLayout title="Shift Scheduling">
              <HRShifts />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/hr/leave"
        element={
          <RoleProtectedRouteWrapper route="/hr/leave">
            <DashboardLayout title="Leave Management">
              <HRLeave />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/hr/payroll"
        element={
          <RoleProtectedRouteWrapper route="/hr/payroll">
            <DashboardLayout title="Payroll">
              <HRPayroll />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/hr/overtime"
        element={
          <RoleProtectedRouteWrapper route="/hr/overtime">
            <DashboardLayout title="Overtime">
              <HROvertime />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/hr/performance"
        element={
          <RoleProtectedRouteWrapper route="/hr/performance">
            <DashboardLayout title="Performance">
              <HRPerformance />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/hr/documents"
        element={
          <RoleProtectedRouteWrapper route="/hr/documents">
            <DashboardLayout title="HR Documents">
              <HRDocuments />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/hr/activity"
        element={
          <RoleProtectedRouteWrapper route="/hr/activity">
            <DashboardLayout title="HR Activity Logs">
              <HRActivity />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/settings/taxes"
        element={
          <RoleProtectedRouteWrapper route="/settings/taxes">
            <DashboardLayout title="Tax Configuration">
              <SettingsTaxes />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />
      <Route
        path="/settings/website"
        element={
          <RoleProtectedRouteWrapper route="/settings/website">
            <DashboardLayout title="Website Builder">
              <SettingsWebsite />
            </DashboardLayout>
          </RoleProtectedRouteWrapper>
        }
      />

      {/* Public Hotel Website Route (no auth required) */}
      <Route path="/site/:subdomain" element={<PublicHotelWebsite />} />

      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <OfflineDetector>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TenantProvider>
              <AppContent />
            </TenantProvider>
          </AuthProvider>
        </BrowserRouter>
      </OfflineDetector>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
