import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Upload, X, Loader2, KeyRound, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useStaff, type StaffMember } from "@/hooks/useStaff";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { useDepartments } from "@/hooks/useDepartments";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import type { AppRole } from "@/types/database";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { AssignShiftsDialog } from "./AssignShiftsDialog";
import { formatCurrency } from "@/lib/currency";

const ALL_ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: "owner", label: "Owner", description: "Full access to all features" },
  { value: "manager", label: "Manager", description: "Manage operations and staff" },
  { value: "front_desk", label: "Front Desk", description: "Check-in, check-out, reservations" },
  { value: "accountant", label: "Accountant", description: "Billing, folios, reports" },
  { value: "housekeeping", label: "Housekeeping", description: "Room cleaning tasks" },
  { value: "maintenance", label: "Maintenance", description: "Repair and maintenance tickets" },
  { value: "kitchen", label: "Kitchen", description: "Food orders and preparation" },
  { value: "waiter", label: "Waiter", description: "Take and serve orders" },
  { value: "night_auditor", label: "Night Auditor", description: "End-of-day procedures" },
];

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
];

const CURRENCIES = [
  { value: "BDT", label: "BDT (৳)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
];

interface StaffDetailDrawerProps {
  staff: StaffMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StaffDetailDrawer({
  staff,
  open,
  onOpenChange,
}: StaffDetailDrawerProps) {
  const { updateStaff, updateHRProfile, updateRoles, updatePropertyAccess, deleteStaff, isUpdating, isDeleting, refetch } = useStaff();
  const { properties } = useTenant();
  const { user, roles: userRoles } = useAuth();
  const { departments } = useDepartments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialogs state
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showAssignShifts, setShowAssignShifts] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // HR form state
  const [staffId, setStaffId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("BDT");
  const [notes, setNotes] = useState("");

  // Permission checks
  const canSeeSalary = userRoles.includes("owner") || userRoles.includes("manager");
  const canResetPassword = userRoles.includes("owner") || userRoles.includes("superadmin");
  const canAssignShifts = userRoles.includes("owner") || userRoles.includes("manager") || userRoles.includes("front_desk");

  // Reset form when staff changes
  useEffect(() => {
    if (staff) {
      setFullName(staff.full_name || "");
      setPhone(staff.phone || "");
      setSelectedRoles(staff.roles);
      setSelectedProperties(staff.property_access);
      setAvatarUrl(staff.avatar_url);
      // HR fields
      setStaffId(staff.staff_id || "");
      setDepartmentId(staff.department_id || "");
      setJoinDate(staff.join_date || "");
      setEmploymentType(staff.employment_type || "full_time");
      setSalaryAmount(staff.salary_amount?.toString() || "");
      setSalaryCurrency(staff.salary_currency || "BDT");
      setNotes(staff.notes || "");
    }
  }, [staff]);

  if (!staff) return null;

  const initials =
    staff.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || staff.username[0].toUpperCase();

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !staff) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${staff.id}/avatar-${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update the profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', staff.id);

      if (updateError) throw updateError;

      setAvatarUrl(urlData.publicUrl);
      refetch();
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl || !staff) return;

    try {
      const oldPath = avatarUrl.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Update the profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', staff.id);

      if (updateError) throw updateError;

      setAvatarUrl(null);
      refetch();
      toast.success('Avatar removed');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove avatar');
    }
  };

  const handleSaveProfile = () => {
    updateStaff({
      userId: staff.id,
      updates: {
        full_name: fullName,
        phone: phone || undefined,
      },
    });
  };

  const handleSaveHRDetails = () => {
    updateHRProfile({
      userId: staff.id,
      updates: {
        staff_id: staffId || undefined,
        department_id: departmentId || null,
        join_date: joinDate || undefined,
        employment_type: employmentType as "full_time" | "part_time" | "contract",
        salary_amount: salaryAmount ? parseFloat(salaryAmount) : undefined,
        salary_currency: salaryCurrency,
        notes: notes || undefined,
      },
    });
  };

  const handleSaveRoles = () => {
    updateRoles({
      userId: staff.id,
      roles: selectedRoles,
    });
  };

  const handleSavePropertyAccess = () => {
    updatePropertyAccess({
      userId: staff.id,
      propertyIds: selectedProperties,
    });
  };

  const handleDeleteStaff = () => {
    deleteStaff(staff.id);
    onOpenChange(false);
  };

  const toggleRole = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const isOwnAccount = user?.id === staff.id;

  const toggleProperty = (propertyId: string) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((p) => p !== propertyId)
        : [...prev, propertyId]
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemoveAvatar}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex-1">
                <SheetTitle className="text-left">
                  {staff.full_name || staff.username}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">@{staff.username}</p>
                {staff.staff_id && (
                  <p className="text-xs text-muted-foreground">{staff.staff_id}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={staff.is_active ? "default" : "secondary"}
                  >
                    {staff.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="staff-avatar-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3 mr-1" />
                    )}
                    {isUploadingAvatar ? 'Uploading...' : 'Photo'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              {canResetPassword && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetPassword(true)}
                >
                  <KeyRound className="h-4 w-4 mr-1" />
                  Reset Password
                </Button>
              )}
              {canAssignShifts && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssignShifts(true)}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Assign Shifts
                </Button>
              )}
            </div>
          </SheetHeader>

          <Separator className="my-6" />

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="hr">HR Details</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="access">Access</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={staff.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(staff.created_at), "PPP")}
                  </p>
                </div>

                {staff.last_login_at && (
                  <div className="space-y-2">
                    <Label>Last Login</Label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(staff.last_login_at), "PPP p")}
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? "Saving..." : "Save Profile"}
              </Button>

              {!isOwnAccount && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? "Deleting..." : "Delete Staff Member"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{staff.full_name || staff.username}"? 
                        This action cannot be undone. All their roles, property access, and account will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteStaff}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </TabsContent>

            {/* HR Details Tab */}
            <TabsContent value="hr" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staffId">Staff ID</Label>
                  <Input
                    id="staffId"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    placeholder="e.g., STF-2026-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Department</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinDate">Join Date</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select value={employmentType} onValueChange={setEmploymentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {canSeeSalary && (
                  <>
                    <Separator />
                    <p className="text-sm font-medium text-muted-foreground">Salary Information</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="salaryAmount">Monthly Salary</Label>
                        <Input
                          id="salaryAmount"
                          type="number"
                          value={salaryAmount}
                          onChange={(e) => setSalaryAmount(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={salaryCurrency} onValueChange={setSalaryCurrency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((curr) => (
                              <SelectItem key={curr.value} value={curr.value}>
                                {curr.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes about this staff member..."
                    rows={3}
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveHRDetails}
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? "Saving..." : "Save HR Details"}
              </Button>
            </TabsContent>

            {/* Roles Tab */}
            <TabsContent value="roles" className="space-y-6 mt-4">
              <p className="text-sm text-muted-foreground">
                Assign roles to determine what this staff member can access and do.
              </p>

              <div className="space-y-3">
                {ALL_ROLES.map((role) => (
                  <Card
                    key={role.value}
                    className={`cursor-pointer transition-colors ${
                      selectedRoles.includes(role.value)
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => toggleRole(role.value)}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <div 
                        className={`h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center ${
                          selectedRoles.includes(role.value) 
                            ? "bg-primary border-primary text-primary-foreground" 
                            : "border-primary"
                        }`}
                      >
                        {selectedRoles.includes(role.value) && (
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{role.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                onClick={handleSaveRoles}
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? "Saving..." : "Save Roles"}
              </Button>
            </TabsContent>

            {/* Property Access Tab */}
            <TabsContent value="access" className="space-y-6 mt-4">
              <p className="text-sm text-muted-foreground">
                Select which properties this staff member can access.
              </p>

              {properties.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No properties found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {properties.map((property) => (
                    <Card
                      key={property.id}
                      className={`cursor-pointer transition-colors ${
                        selectedProperties.includes(property.id)
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                      onClick={() => toggleProperty(property.id)}
                    >
                      <CardContent className="flex items-center gap-3 p-3">
                        <div 
                          className={`h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center ${
                            selectedProperties.includes(property.id) 
                              ? "bg-primary border-primary text-primary-foreground" 
                              : "border-primary"
                          }`}
                        >
                          {selectedProperties.includes(property.id) && (
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{property.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {property.code} • {property.city || "No location"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {property.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Button
                onClick={handleSavePropertyAccess}
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? "Saving..." : "Save Property Access"}
              </Button>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <ResetPasswordDialog
        open={showResetPassword}
        onOpenChange={setShowResetPassword}
        staffId={staff.id}
        staffName={staff.full_name || staff.username}
      />

      <AssignShiftsDialog
        open={showAssignShifts}
        onOpenChange={setShowAssignShifts}
        staffId={staff.id}
        staffName={staff.full_name || staff.username}
      />
    </>
  );
}
