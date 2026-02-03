import { useState } from "react";
import { format } from "date-fns";
import {
  Building2,
  Users,
  DoorOpen,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useTenantFeatureFlags,
  useToggleFeatureFlag,
  useUpdateTenantStatus,
  useDeleteTenant,
  type TenantWithStats,
} from "@/hooks/useAdminTenants";
import { AuditLogViewer } from "./AuditLogViewer";

interface TenantDetailDrawerProps {
  tenant: TenantWithStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVAILABLE_FEATURES = [
  { name: "pms", label: "Property Management (PMS)", description: "Core PMS features" },
  { name: "crm", label: "Guest CRM", description: "Customer relationship management" },
  { name: "pos", label: "Point of Sale", description: "Restaurant and retail POS" },
  { name: "advanced_reports", label: "Advanced Reports", description: "Detailed analytics and exports" },
  { name: "channel_manager", label: "Channel Manager", description: "OTA integrations" },
  { name: "revenue_management", label: "Revenue Management", description: "Dynamic pricing" },
];

export function TenantDetailDrawer({
  tenant,
  open,
  onOpenChange,
}: TenantDetailDrawerProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: featureFlags = [] } = useTenantFeatureFlags(tenant?.id);
  const toggleFeature = useToggleFeatureFlag();
  const updateStatus = useUpdateTenantStatus();
  const deleteTenant = useDeleteTenant();

  if (!tenant) return null;

  const handleDeleteTenant = () => {
    deleteTenant.mutate(tenant.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        onOpenChange(false);
      },
    });
  };

  const getFeatureEnabled = (featureName: string) => {
    const flag = featureFlags.find((f) => f.feature_name === featureName);
    return flag?.is_enabled ?? false;
  };

  const handleToggleFeature = (featureName: string, enabled: boolean) => {
    toggleFeature.mutate({
      tenantId: tenant.id,
      featureName,
      isEnabled: enabled,
    });
  };

  const handleStatusChange = (newStatus: "active" | "suspended") => {
    updateStatus.mutate({ tenantId: tenant.id, _status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{tenant.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                {getStatusBadge("active")}
                {getPlanBadge(null)}
              </SheetDescription>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xl font-bold">{tenant.properties_count}</p>
                </div>
                <p className="text-xs text-muted-foreground">Properties</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xl font-bold">{tenant.staff_count}</p>
                </div>
                <p className="text-xs text-muted-foreground">Staff</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <DoorOpen className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xl font-bold">{tenant.rooms_count}</p>
                </div>
                <p className="text-xs text-muted-foreground">Rooms</p>
              </CardContent>
            </Card>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <Tabs defaultValue="details" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-380px)] mt-4">
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Created {format(new Date(tenant.created_at), "MMMM d, yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Current Status</p>
                      <p className="text-sm text-muted-foreground">
                        Tenant can access all features
                      </p>
                    </div>
                    {getStatusBadge("active")}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleStatusChange("suspended")}
                    >
                      Suspend Tenant
                    </Button>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-destructive">Danger Zone</p>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete this tenant and all associated data. This action cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Tenant
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Subscription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Plan</span>
                    {getPlanBadge(null)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Plan changes can be managed through the billing system.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Feature Flags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {AVAILABLE_FEATURES.map((feature) => {
                    const isEnabled = getFeatureEnabled(feature.name);
                    return (
                      <div
                        key={feature.name}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-3">
                          {isEnabled ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <Label htmlFor={feature.name} className="font-medium">
                              {feature.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          id={feature.name}
                          checked={isEnabled}
                          onCheckedChange={(checked) =>
                            handleToggleFeature(feature.name, checked)
                          }
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Log Tab */}
            <TabsContent value="audit" className="mt-0">
              <AuditLogViewer tenantId={tenant.id} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{tenant.name}</strong>? 
              This will remove all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{tenant.properties_count} properties</li>
                <li>{tenant.staff_count} staff members</li>
                <li>{tenant.rooms_count} rooms</li>
                <li>All reservations, folios, and guest data</li>
              </ul>
              <p className="mt-3 text-destructive font-medium">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTenant}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTenant.isPending}
            >
              {deleteTenant.isPending ? "Deleting..." : "Delete Tenant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
