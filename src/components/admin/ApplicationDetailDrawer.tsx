import { useState } from "react";
import { format } from "date-fns";
import {
  Building2,
  Mail,
  Phone,
  User,
  Clock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  AtSign,
  Crown,
  Zap,
  Rocket,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { cn } from "@/lib/utils";
import {
  useApproveApplication,
  useRejectApplication,
  useDeleteApplication,
  type AdminApplication,
} from "@/hooks/useAdminApplications";
import { usePlans, getPlanDisplayInfo } from "@/hooks/usePlans";

interface ApplicationDetailDrawerProps {
  application: AdminApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const planIcons = {
  starter: Zap,
  growth: Rocket,
  pro: Crown,
};

export function ApplicationDetailDrawer({
  application,
  open,
  onOpenChange,
}: ApplicationDetailDrawerProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const { data: plans, isLoading: plansLoading } = usePlans();
  const approveApplication = useApproveApplication();
  const rejectApplication = useRejectApplication();
  const deleteApplication = useDeleteApplication();

  if (!application) return null;

  const statusConfig = {
    pending: {
      label: "Pending Review",
      badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    approved: {
      label: "Approved",
      badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    rejected: {
      label: "Rejected",
      badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    },
  };

  const config = statusConfig[application.status];

  const handleApprove = async () => {
    if (!selectedPlanId) return;
    await approveApplication.mutateAsync({ 
      applicationId: application.id,
      planId: selectedPlanId 
    });
    setSelectedPlanId("");
    onOpenChange(false);
  };

  const handleReject = async () => {
    await rejectApplication.mutateAsync({
      applicationId: application.id,
      reason: rejectionReason,
    });
    setRejectDialogOpen(false);
    setRejectionReason("");
    onOpenChange(false);
  };

  const handleDelete = async () => {
    await deleteApplication.mutateAsync(application.id);
    setDeleteDialogOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
                <Building2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <SheetTitle className="text-xl">{application.hotel_name}</SheetTitle>
                <SheetDescription>Application from {application.full_name}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6 pt-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={cn("text-sm", config.badgeClass)}>{config.label}</Badge>
            </div>

            <Separator />

            {/* Applicant Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Applicant Details
              </h3>

              <div className="grid gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium">{application.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Hotel Name</p>
                    <p className="font-medium">{application.hotel_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{application.email}</p>
                  </div>
                </div>

                {application.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{application.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Timeline
              </h3>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Applied</p>
                    <p className="font-medium">
                      {format(new Date(application.created_at), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>

                {application.status !== "pending" && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Reviewed</p>
                      <p className="font-medium">
                        {format(new Date(application.updated_at), "MMMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {application.status === "rejected" && application.notes && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">
                    Rejection Reason
                  </p>
                  <p className="text-sm text-rose-700 dark:text-rose-300">
                    {application.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Plan Selection - Only for pending applications */}
            {application.status === "pending" && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Select Subscription Plan
                  </h3>

                  {plansLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <RadioGroup
                      value={selectedPlanId}
                      onValueChange={setSelectedPlanId}
                      className="grid gap-3"
                    >
                      {plans?.map((plan) => {
                        const displayInfo = getPlanDisplayInfo(plan.plan_type);
                        const PlanIcon = planIcons[plan.plan_type as keyof typeof planIcons] || Zap;
                        
                        return (
                          <Label
                            key={plan.id}
                            htmlFor={plan.id}
                            className={cn(
                              "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              selectedPlanId === plan.id
                                ? cn(displayInfo.borderColor, displayInfo.bgColor)
                                : "border-border hover:border-muted-foreground/30"
                            )}
                          >
                            <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <PlanIcon className={cn("h-4 w-4", displayInfo.color)} />
                                <span className={cn("font-semibold", displayInfo.color)}>
                                  {displayInfo.label}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  ${plan.price_monthly}/mo
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {displayInfo.description}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {plan.max_properties === 999 ? "Unlimited" : plan.max_properties} properties
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {plan.max_rooms === 999 ? "Unlimited" : plan.max_rooms} rooms
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {plan.max_staff === 999 ? "Unlimited" : plan.max_staff} staff
                                </Badge>
                              </div>
                            </div>
                          </Label>
                        );
                      })}
                    </RadioGroup>
                  )}
                </div>
              </>
            )}

            {/* Actions */}
            {application.status === "pending" && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    onClick={handleApprove}
                    disabled={approveApplication.isPending || !selectedPlanId}
                  >
                    {approveApplication.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    {selectedPlanId ? "Approve Application" : "Select a Plan to Approve"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950"
                    onClick={() => setRejectDialogOpen(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Application
                  </Button>
                </div>
              </>
            )}

            {/* Delete option for processed applications */}
            {application.status !== "pending" && (
              <>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Application
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this application? You can optionally provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={rejectApplication.isPending}
            >
              {rejectApplication.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteApplication.isPending}
            >
              {deleteApplication.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
