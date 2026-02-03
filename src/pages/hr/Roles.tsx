import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, 
  Plus, 
  Users,
  Lock,
  Unlock,
  Settings
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SYSTEM_ROLES = [
  { id: 'owner', name: 'Owner', description: 'Full system access', color: 'bg-vibrant-purple' },
  { id: 'manager', name: 'Manager', description: 'Property management access', color: 'bg-vibrant-blue' },
  { id: 'front_desk', name: 'Front Desk', description: 'Guest & reservation management', color: 'bg-vibrant-cyan' },
  { id: 'accountant', name: 'Accountant', description: 'Financial reports & folios', color: 'bg-vibrant-green' },
  { id: 'housekeeping', name: 'Housekeeping', description: 'Room cleaning tasks', color: 'bg-vibrant-amber' },
  { id: 'maintenance', name: 'Maintenance', description: 'Maintenance tickets', color: 'bg-vibrant-orange' },
  { id: 'kitchen', name: 'Kitchen', description: 'Food preparation', color: 'bg-vibrant-rose' },
  { id: 'waiter', name: 'Waiter', description: 'POS & orders', color: 'bg-vibrant-pink' },
  { id: 'night_auditor', name: 'Night Auditor', description: 'Night audit process', color: 'bg-vibrant-indigo' },
];

const PERMISSION_CATEGORIES = [
  { 
    name: 'Reservations', 
    permissions: ['create_reservation', 'edit_reservation', 'cancel_reservation'] 
  },
  { 
    name: 'Front Desk', 
    permissions: ['check_in_guest', 'check_out_guest'] 
  },
  { 
    name: 'Payments', 
    permissions: ['refund_payment', 'void_payment', 'add_charge'] 
  },
  { 
    name: 'POS', 
    permissions: ['void_order', 'access_pos'] 
  },
  { 
    name: 'Reports', 
    permissions: ['view_reports', 'export_reports'] 
  },
  { 
    name: 'HR', 
    permissions: ['manage_staff', 'manage_roles', 'approve_leave', 'manage_payroll'] 
  },
  { 
    name: 'Operations', 
    permissions: ['run_night_audit', 'manage_housekeeping', 'manage_maintenance'] 
  },
  { 
    name: 'Settings', 
    permissions: ['edit_prices'] 
  },
];

const HRRoles = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>('manager');

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-vibrant-purple/10 to-vibrant-indigo/10 border-l-4 border-l-vibrant-purple">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Roles</p>
                <p className="text-2xl font-bold">{SYSTEM_ROLES.length}</p>
              </div>
              <Shield className="h-8 w-8 text-vibrant-purple" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-blue/10 to-vibrant-cyan/10 border-l-4 border-l-vibrant-blue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Permissions</p>
                <p className="text-2xl font-bold">20</p>
              </div>
              <Lock className="h-8 w-8 text-vibrant-blue" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Users className="h-8 w-8 text-vibrant-green" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-vibrant-purple" />
              System Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SYSTEM_ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedRole === role.id 
                    ? 'bg-primary/10 border-primary' 
                    : 'hover:bg-muted/50 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${role.color}`} />
                  <span className="font-medium text-sm">{role.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Permission Matrix */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-vibrant-blue" />
              Permission Matrix
              {selectedRole && (
                <Badge variant="outline" className="ml-2">
                  {SYSTEM_ROLES.find(r => r.id === selectedRole)?.name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {PERMISSION_CATEGORIES.map((category) => (
                <div key={category.name}>
                  <h4 className="font-medium text-sm text-muted-foreground mb-3">{category.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {category.permissions.map((permission) => (
                      <div 
                        key={permission}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <Checkbox id={permission} />
                        <label 
                          htmlFor={permission}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {permission.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HRRoles;
