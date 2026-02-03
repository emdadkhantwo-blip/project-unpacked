import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Building2,
  Calendar,
  CalendarRange,
  Users,
  BedDouble,
  Receipt,
  ClipboardList,
  Wrench,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Hotel,
  UserCircle,
  ShieldCheck,
  UtensilsCrossed,
  LayoutDashboard,
  Moon,
  ChefHat,
  Utensils,
  Tags,
  FileText,
  UserCog,
  Clock,
  CalendarClock,
  CalendarDays,
  Wallet,
  Timer,
  ListTodo,
  Star,
  FolderOpen,
  Activity,
  Percent,
  Globe,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { cn } from '@/lib/utils';

import { type AppRole } from '@/types/database';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, color: 'text-vibrant-blue' },
  { title: 'Reservations', url: '/reservations', icon: Calendar, color: 'text-vibrant-purple' },
  { title: 'Calendar', url: '/calendar', icon: CalendarRange, color: 'text-vibrant-indigo' },
  { title: 'Rooms', url: '/rooms', icon: BedDouble, color: 'text-vibrant-cyan' },
  { title: 'Guests', url: '/guests', icon: Users, color: 'text-vibrant-green' },
  { title: 'Corporate', url: '/corporate', icon: Building2, color: 'text-vibrant-purple' },
  { title: 'Statements', url: '/corporate/statements', icon: FileText, color: 'text-vibrant-indigo' },
];

const operationsItems = [
  { title: 'Check-In/Out', url: '/front-desk', icon: Hotel, color: 'text-vibrant-green' },
  { title: 'Housekeeping', url: '/housekeeping', icon: ClipboardList, color: 'text-vibrant-amber' },
  { title: 'Maintenance', url: '/maintenance', icon: Wrench, color: 'text-vibrant-rose' },
];

const billingItems = [
  { title: 'Folios', url: '/folios', icon: Receipt, color: 'text-vibrant-green' },
  { title: 'Night Audit', url: '/night-audit', icon: Moon, color: 'text-vibrant-indigo' },
  { title: 'Reports', url: '/reports', icon: BarChart3, color: 'text-vibrant-cyan' },
];

const posItems = [
  { title: 'POS Terminal', url: '/pos', icon: UtensilsCrossed, color: 'text-vibrant-orange' },
  { title: 'Kitchen Display', url: '/kitchen', icon: ChefHat, color: 'text-vibrant-amber' },
  { title: 'Waiter Dashboard', url: '/waiter', icon: Utensils, color: 'text-vibrant-green' },
];

const hrItems = [
  { title: 'Staff Directory', url: '/hr/staff', icon: Users, color: 'text-vibrant-blue' },
  { title: 'Roles & Permissions', url: '/hr/roles', icon: UserCog, color: 'text-vibrant-purple' },
  { title: 'Attendance', url: '/hr/attendance', icon: Clock, color: 'text-vibrant-green' },
  { title: 'Shift Scheduling', url: '/hr/shifts', icon: CalendarClock, color: 'text-vibrant-cyan' },
  { title: 'Leave Management', url: '/hr/leave', icon: CalendarDays, color: 'text-vibrant-amber' },
  { title: 'Payroll', url: '/hr/payroll', icon: Wallet, color: 'text-vibrant-green' },
  { title: 'Overtime', url: '/hr/overtime', icon: Timer, color: 'text-vibrant-orange' },
  { title: 'Performance', url: '/hr/performance', icon: Star, color: 'text-vibrant-amber' },
  { title: 'Documents', url: '/hr/documents', icon: FolderOpen, color: 'text-vibrant-cyan' },
  { title: 'Activity Logs', url: '/hr/activity', icon: Activity, color: 'text-vibrant-rose' },
];

const adminItems = [
  { title: 'Properties', url: '/properties', icon: Building2, color: 'text-vibrant-blue' },
  { title: 'Rates & Packages', url: '/settings/rates', icon: Tags, color: 'text-vibrant-green' },
  { title: 'Tax Configuration', url: '/settings/taxes', icon: Percent, color: 'text-vibrant-amber' },
  { title: 'Website Builder', url: '/settings/website', icon: Globe, color: 'text-vibrant-purple' },
  { title: 'References', url: '/references', icon: Tags, color: 'text-vibrant-orange' },
  { title: 'Settings', url: '/settings', icon: Settings, color: 'text-vibrant-cyan' },
];

const superAdminItems = [
  { title: 'Applications', url: '/admin/applications', icon: ClipboardList, color: 'text-vibrant-amber' },
  { title: 'Tenants', url: '/admin/tenants', icon: Building2, color: 'text-vibrant-purple' },
  { title: 'Security', url: '/admin/security', icon: ShieldCheck, color: 'text-vibrant-rose' },
];

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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { profile, roles, signOut, isSuperAdmin, hasAnyRole } = useAuth();
  const { tenant, currentProperty, properties, setCurrentProperty, hasFeature } = useTenant();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Helper function to check if user can access a route
  const canAccessRoute = (route: string) => {
    if (isSuperAdmin) return true;
    if (hasAnyRole(['owner', 'manager'])) return true;
    
    return roles.some(role => {
      const allowedRoutes = ROLE_ROUTES[role] || [];
      return allowedRoutes.includes('*') || allowedRoutes.includes(route);
    });
  };

  // Filter navigation items based on role
  const filteredMainNavItems = mainNavItems.filter(item => canAccessRoute(item.url));
  const filteredOperationsItems = operationsItems.filter(item => canAccessRoute(item.url));
  const filteredBillingItems = billingItems.filter(item => canAccessRoute(item.url));

  const canAccessAdmin = hasAnyRole(['owner', 'manager']);
  // Owner/Manager can always see POS section, other roles need feature flag
  const canAccessPOS = hasAnyRole(['owner', 'manager']) || 
    (hasFeature('pos') && hasAnyRole(['kitchen', 'waiter']));

  const NavSection = ({ 
    items, 
    label, 
    labelColor 
  }: { 
    items: typeof mainNavItems; 
    label: string;
    labelColor?: string;
  }) => (
    <SidebarGroup>
      <SidebarGroupLabel className={cn("text-sidebar-muted uppercase tracking-wider text-[10px] font-semibold", labelColor)}>
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={collapsed ? item.title : undefined}
                >
                  <NavLink
                    to={item.url}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200",
                      active 
                        ? "bg-gradient-to-r from-sidebar-primary/20 to-sidebar-primary/5 text-sidebar-primary border-l-2 border-sidebar-primary" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    activeClassName=""
                  >
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                      active ? "bg-sidebar-primary/20" : "bg-sidebar-accent/50"
                    )}>
                      <item.icon className={cn("h-4 w-4", active ? "text-sidebar-primary" : item.color)} />
                    </div>
                    {!collapsed && (
                      <span className={cn("font-medium", active && "text-sidebar-primary")}>
                        {item.title}
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Header with gradient accent */}
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3">
          {/* Logo/Avatar with gradient background */}
          {!isSuperAdmin && tenant?.logo_url ? (
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-white/10 to-white/5 p-0.5">
              <img 
                src={tenant.logo_url} 
                alt={tenant.name} 
                className="h-full w-full rounded-[10px] object-cover"
              />
            </div>
          ) : (
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              isSuperAdmin 
                ? "bg-gradient-to-br from-vibrant-purple to-vibrant-pink text-white shadow-lg" 
                : "bg-gradient-to-br from-vibrant-blue to-vibrant-purple text-white shadow-lg"
            )}>
              {isSuperAdmin ? <ShieldCheck className="h-5 w-5" /> : <Hotel className="h-5 w-5" />}
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-bold text-sidebar-foreground truncate">
                {isSuperAdmin ? 'Platform Admin' : (tenant?.name || 'Hotel PMS')}
              </span>
              <span className="text-2xs text-sidebar-muted truncate">
                {isSuperAdmin ? 'Super Administrator' : (currentProperty?.name || 'Select Property')}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin px-2 py-2">
        {/* Property Selector - Hide for superadmin */}
        {!collapsed && !isSuperAdmin && properties.length > 1 && (
          <div className="px-1 pb-3">
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <button className="flex w-full items-center justify-between rounded-lg bg-sidebar-accent/50 px-3 py-2 text-xs font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors">
                <span className="truncate">{currentProperty?.name}</span>
                <ChevronDown className="h-3 w-3 text-sidebar-muted" />
                 </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 bg-popover z-50">
                {properties.map((property) => (
                  <DropdownMenuItem
                    key={property.id}
                    onClick={() => setCurrentProperty(property)}
                    className={cn(
                      "cursor-pointer",
                      property.id === currentProperty?.id && 'bg-accent'
                    )}
                  >
                    {property.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Main Navigation */}
        {!isSuperAdmin && filteredMainNavItems.length > 0 && (
          <NavSection items={filteredMainNavItems} label="Main" />
        )}

        {/* Operations */}
        {!isSuperAdmin && filteredOperationsItems.length > 0 && (
          <NavSection items={filteredOperationsItems} label="Operations" />
        )}

        {/* Billing */}
        {!isSuperAdmin && filteredBillingItems.length > 0 && (
          <NavSection items={filteredBillingItems} label="Billing" />
        )}

        {/* POS (conditional) */}
        {!isSuperAdmin && canAccessPOS && (
          <NavSection items={posItems} label="Restaurant" />
        )}

        {/* HR Management (conditional) */}
        {!isSuperAdmin && canAccessAdmin && (
          <NavSection items={hrItems} label="HR Management" />
        )}

        {/* Admin (conditional) */}
        {!isSuperAdmin && canAccessAdmin && (
          <NavSection items={adminItems} label="Admin" />
        )}

        {/* Super Admin */}
        {isSuperAdmin && (
          <NavSection items={superAdminItems} label="Super Admin" />
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-vibrant-blue/20 to-vibrant-purple/20 text-sidebar-primary">
                <UserCircle className="h-4 w-4" />
              </div>
              {!collapsed && (
                <div className="flex flex-1 flex-col items-start text-left min-w-0">
                  <span className="text-xs font-semibold truncate w-full">{profile?.full_name || profile?.username}</span>
                  <span className="text-2xs text-sidebar-muted capitalize truncate w-full">
                    {roles[0]?.replace('_', ' ') || 'User'}
                  </span>
                </div>
              )}
              {!collapsed && <ChevronDown className="h-3 w-3 text-sidebar-muted" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52 bg-popover z-50">
            <DropdownMenuItem asChild>
              <NavLink to="/profile" className="flex items-center gap-2 cursor-pointer">
                <UserCircle className="h-4 w-4" />
                Profile
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
