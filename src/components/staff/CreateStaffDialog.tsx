import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Upload, CalendarIcon, Building2, FileText, X, CreditCard } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useDepartments } from "@/hooks/useDepartments";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types/database";

const ALL_ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: "manager", label: "Manager", description: "Full property management" },
  { value: "front_desk", label: "Front Desk", description: "Reservations & check-in/out" },
  { value: "accountant", label: "Accountant", description: "Folios & payments" },
  { value: "housekeeping", label: "Housekeeping", description: "Room cleaning tasks" },
  { value: "maintenance", label: "Maintenance", description: "Maintenance tickets" },
  { value: "kitchen", label: "Kitchen", description: "POS kitchen display" },
  { value: "waiter", label: "Waiter", description: "POS orders" },
  { value: "night_auditor", label: "Night Auditor", description: "Night audit process" },
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

const createStaffSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name must be less than 100 characters"),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  staffId: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  nidNumber: z.string().max(20).optional(),
  bankAccountNumber: z.string().max(30).optional(),
  bankAccountName: z.string().max(100).optional(),
});

type CreateStaffFormData = z.infer<typeof createStaffSchema>;

interface CreateStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStaffDialog({ open, onOpenChange }: CreateStaffDialogProps) {
  const { toast } = useToast();
  const { tenant, properties, currentProperty } = useTenant();
  const { departments } = useDepartments();
  const { roles: userRoles } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New fields state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [joinDate, setJoinDate] = useState<Date>(new Date());
  const [employmentType, setEmploymentType] = useState<string>("full_time");
  const [salaryAmount, setSalaryAmount] = useState<string>("");
  const [salaryCurrency, setSalaryCurrency] = useState<string>("BDT");
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const hasInitializedProperties = useRef(false);

  // Check if user can see salary info (owner or manager)
  const canSeeSalary = userRoles.includes("owner") || userRoles.includes("manager");

  const form = useForm<CreateStaffFormData>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      phone: "",
      email: "",
      staffId: "",
      notes: "",
      nidNumber: "",
      bankAccountNumber: "",
      bankAccountName: "",
    },
  });

  // Initialize selectedProperties when dialog opens
  useEffect(() => {
    if (open && currentProperty && !hasInitializedProperties.current) {
      setSelectedProperties([currentProperty.id]);
      hasInitializedProperties.current = true;
    }

    // Reset on close
    if (!open) {
      hasInitializedProperties.current = false;
    }
  }, [open, currentProperty]);

  const toggleRole = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleProperty = (propertyId: string) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((p) => p !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File",
        description: "Please upload a valid image (JPEG, PNG, GIF, or WebP)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxFiles = 10;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a valid format. Use PDF, JPG, PNG, or WebP.`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 5MB limit.`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    if (documentFiles.length + validFiles.length > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${maxFiles} documents allowed.`,
        variant: "destructive",
      });
      return;
    }

    setDocumentFiles((prev) => [...prev, ...validFiles]);
    // Reset input value to allow selecting same file again
    event.target.value = "";
  };

  const removeDocument = (index: number) => {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: CreateStaffFormData) => {
    if (selectedRoles.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one role.",
        variant: "destructive",
      });
      return;
    }

    if (selectedProperties.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one property.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: result, error } = await supabase.functions.invoke("create-staff", {
        body: {
          username: data.username,
          password: data.password,
          fullName: data.fullName,
          phone: data.phone || undefined,
          email: data.email || undefined,
          roles: selectedRoles,
          propertyIds: selectedProperties,
          mustChangePassword,
          // New fields
          staffId: data.staffId || undefined,
          departmentId: departmentId || undefined,
          joinDate: format(joinDate, "yyyy-MM-dd"),
          employmentType,
          salaryAmount: salaryAmount ? parseFloat(salaryAmount) : undefined,
          salaryCurrency,
          notes: data.notes || undefined,
          // New identity & banking fields
          nidNumber: data.nidNumber || undefined,
          bankAccountNumber: data.bankAccountNumber || undefined,
          bankAccountName: data.bankAccountName || undefined,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to create staff");
      }

      // Upload avatar if provided
      if (avatarFile && result.user?.id) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${result.user.id}/avatar-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);

          await supabase
            .from("profiles")
            .update({ avatar_url: urlData.publicUrl })
            .eq("id", result.user.id);
        }
      }

      // Upload documents if provided
      if (documentFiles.length > 0 && result.user?.id) {
        for (const docFile of documentFiles) {
          // Sanitize filename - replace spaces and special chars with underscores
          const sanitizedName = docFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = `${result.user.id}/${Date.now()}-${sanitizedName}`;

          const { error: docUploadError } = await supabase.storage
            .from("hr-documents")
            .upload(fileName, docFile, {
              cacheControl: "3600",
              upsert: false,
            });

          if (!docUploadError) {
            // Create hr_documents record
            await supabase.from("hr_documents").insert({
              tenant_id: tenant?.id,
              profile_id: result.user.id,
              name: docFile.name,
              document_type: docFile.type.includes("pdf") ? "contract" : "id_document",
              file_url: fileName,
            });
          }
        }
      }

      toast({
        title: "Staff Created",
        description: `Staff account for ${data.fullName} has been created. They can log in with username: ${data.username}`,
      });

      queryClient.invalidateQueries({ queryKey: ["staff"] });
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Create staff error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create staff account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setSelectedRoles([]);
    setSelectedProperties([]);
    setMustChangePassword(true);
    setShowPassword(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setDepartmentId("");
    setJoinDate(new Date());
    setEmploymentType("full_time");
    setSalaryAmount("");
    setSalaryCurrency("BDT");
    setDocumentFiles([]);
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("password", password);
    setShowPassword(true);
  };

  const initials = form.watch("fullName")
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Staff Account</DialogTitle>
          <DialogDescription>
            Create a new staff account with login credentials and HR details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Personal Information</h3>

            <div className="flex items-start gap-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-20 w-20 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Photo
                </Button>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    {...form.register("fullName")}
                    placeholder="John Doe"
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staffId">Staff ID</Label>
                  <Input
                    id="staffId"
                    {...form.register("staffId")}
                    placeholder="Auto-generated if blank"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="Personal email (system email auto-generated)"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Credentials Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Account Credentials</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  {...form.register("username")}
                  placeholder="johndoe"
                />
                <p className="text-xs text-muted-foreground">
                  Letters, numbers, underscores only
                </p>
                {form.formState.errors.username && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={generatePassword}
                  >
                    Generate
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...form.register("password")}
                    placeholder="Minimum 8 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="mustChangePassword" className="text-sm font-medium">
                  Require Password Change
                </Label>
                <p className="text-xs text-muted-foreground">
                  Staff will be prompted to change password on first login
                </p>
              </div>
              <Switch
                id="mustChangePassword"
                checked={mustChangePassword}
                onCheckedChange={setMustChangePassword}
              />
            </div>
          </div>

          <Separator />

          {/* Employment Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Employment Details</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <div className="space-y-2">
                <Label>Join Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !joinDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {joinDate ? format(joinDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={joinDate}
                      onSelect={(date) => date && setJoinDate(date)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="+880 1XXX XXXXXX"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Identity Documents Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Identity Documents
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="nidNumber">NID Number</Label>
                <Input
                  id="nidNumber"
                  {...form.register("nidNumber")}
                  placeholder="National ID number"
                  maxLength={20}
                />
              </div>
            </div>

            {/* Document Upload */}
            <div className="space-y-2">
              <Label>Upload Documents</Label>
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => documentInputRef.current?.click()}
              >
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={handleDocumentChange}
                  className="hidden"
                />
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload NID, contracts, certificates
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, PNG, WebP (max 5MB each, up to 10 files)
                </p>
              </div>

              {/* Document List */}
              {documentFiles.length > 0 && (
                <div className="space-y-2 mt-3">
                  {documentFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeDocument(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Banking Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Banking Information
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                <Input
                  id="bankAccountNumber"
                  {...form.register("bankAccountNumber")}
                  placeholder="Account number"
                  maxLength={30}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountName">Bank Account Name</Label>
                <Input
                  id="bankAccountName"
                  {...form.register("bankAccountName")}
                  placeholder="Account holder name"
                  maxLength={100}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
            <Textarea
              {...form.register("notes")}
              placeholder="Additional notes about this staff member..."
              rows={2}
            />
          </div>

          {/* Salary Section - Admin Only */}
          {canSeeSalary && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Salary Information</h3>
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
              </div>
            </>
          )}

          <Separator />

          {/* Roles Section */}
          <div className="space-y-3">
            <Label>Assign Roles *</Label>
            <div className="grid grid-cols-2 gap-2">
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
                  <CardContent className="flex items-start gap-2 p-2">
                    <div
                      className={`mt-0.5 h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center ${
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
                    <div>
                      <span className="text-sm font-medium">{role.label}</span>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {selectedRoles.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Select at least one role for the staff member
              </p>
            )}
          </div>

          {/* Property Access Section */}
          <div className="space-y-3">
            <Label>Property Access *</Label>
            <div className="space-y-2">
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
                  <CardContent className="flex items-center gap-2 p-2">
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
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{property.name}</span>
                      <span className="text-xs text-muted-foreground">({property.code})</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Staff"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
