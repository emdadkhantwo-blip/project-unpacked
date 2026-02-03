import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, User, Building2, Mail, Phone, Lock, X, CheckCircle } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import beehotelLogo from "@/assets/beehotel-logo.png";

const applicationSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  hotelName: z.string().min(2, "Hotel name is required").max(100),
  username: z.string().min(3, "Username must be at least 3 characters").max(50).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  confirmPassword: z.string(),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().max(20).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface AdminApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminApplicationDialog({ open, onOpenChange }: AdminApplicationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      hotelName: "",
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      phone: "",
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Logo must be less than 5MB",
        });
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    try {
      let logoUrl: string | null = null;

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `applications/${Date.now()}-${data.username}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("hotel-logos")
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("hotel-logos")
          .getPublicUrl(fileName);
        
        logoUrl = urlData.publicUrl;
      }

      // Submit application
      const { error } = await supabase
        .from("admin_applications")
        .insert({
          full_name: data.fullName,
          hotel_name: data.hotelName,
          username: data.username,
          password: data.password, // Will be used by edge function when approved
          email: data.email,
          phone: data.phone || null,
          logo_url: logoUrl,
          status: "pending",
        });

      if (error) {
        if (error.message.includes("admin_applications_username_key")) {
          toast({
            variant: "destructive",
            title: "Username taken",
            description: "This username is already in use. Please choose another.",
          });
        } else if (error.message.includes("admin_applications_email_key")) {
          toast({
            variant: "destructive",
            title: "Email already exists",
            description: "An application with this email already exists.",
          });
        } else {
          throw error;
        }
        return;
      }

      setSubmitted(true);
      form.reset();
      setLogoFile(null);
      setLogoPreview(null);
    } catch (error: any) {
      console.error("Application error:", error);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message || "Failed to submit application. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    form.reset();
    setLogoFile(null);
    setLogoPreview(null);
    onOpenChange(false);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">আবেদন জমা হয়েছে!</h2>
            <p className="text-muted-foreground mb-6">
              আপনার আবেদন সফলভাবে জমা হয়েছে। আমাদের টিম শীঘ্রই আপনার আবেদন পর্যালোচনা করে যোগাযোগ করবে।
            </p>
            <Button onClick={handleClose} className="w-full">
              বন্ধ করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <img src={beehotelLogo} alt="BeeHotel" className="h-24 w-auto" />
            <div>
              <DialogTitle className="text-xl">হোটেল ম্যানেজমেন্ট আবেদন</DialogTitle>
              <DialogDescription>
                আপনার হোটেলের তথ্য দিয়ে ফর্মটি পূরণ করুন
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>হোটেল লোগো (ঐচ্ছিক)</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-16 w-16 rounded-lg object-cover border"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
              )}
              <p className="text-xs text-muted-foreground">
                PNG, JPG বা WEBP (সর্বোচ্চ 5MB)
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                <User className="inline h-4 w-4 mr-1" />
                পূর্ণ নাম
              </Label>
              <Input
                id="fullName"
                placeholder="আপনার নাম"
                {...form.register("fullName")}
              />
              {form.formState.errors.fullName && (
                <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            {/* Hotel Name */}
            <div className="space-y-2">
              <Label htmlFor="hotelName">
                <Building2 className="inline h-4 w-4 mr-1" />
                হোটেলের নাম
              </Label>
              <Input
                id="hotelName"
                placeholder="আপনার হোটেলের নাম"
                {...form.register("hotelName")}
              />
              {form.formState.errors.hotelName && (
                <p className="text-xs text-destructive">{form.formState.errors.hotelName.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-4 w-4 mr-1" />
                ইমেইল
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="inline h-4 w-4 mr-1" />
                ফোন নম্বর (ঐচ্ছিক)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+880 1XXX-XXXXXX"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">ইউজারনেম</Label>
            <Input
              id="username"
              placeholder="username123"
              {...form.register("username")}
            />
            <p className="text-xs text-muted-foreground">
              শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা এবং আন্ডারস্কোর ব্যবহার করুন
            </p>
            {form.formState.errors.username && (
              <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                <Lock className="inline h-4 w-4 mr-1" />
                পাসওয়ার্ড
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                <Lock className="inline h-4 w-4 mr-1" />
                পাসওয়ার্ড নিশ্চিত করুন
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              বাতিল করুন
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  জমা হচ্ছে...
                </>
              ) : (
                "আবেদন জমা দিন"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
