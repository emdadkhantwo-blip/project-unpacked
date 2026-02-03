import { useState, useEffect, useRef } from "react";
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

import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useQueryClient } from "@tanstack/react-query";
import type { AppRole } from "@/types/database";

const ALL_ROLES: { value: AppRole; label: string }[] = [
  { value: "manager", label: "Manager" },
  { value: "front_desk", label: "Front Desk" },
  { value: "accountant", label: "Accountant" },
  { value: "housekeeping", label: "Housekeeping" },
  { value: "maintenance", label: "Maintenance" },
  { value: "kitchen", label: "Kitchen" },
  { value: "waiter", label: "Waiter" },
  { value: "night_auditor", label: "Night Auditor" },
];

interface InviteStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteStaffDialog({ open, onOpenChange }: InviteStaffDialogProps) {
  const { toast } = useToast();
  const { tenant, properties, currentProperty } = useTenant();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasInitializedProperties = useRef(false);

  // Initialize selectedProperties when dialog opens and currentProperty is available
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
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const toggleProperty = (propertyId: string) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((p) => p !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !fullName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

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
      // Generate a temporary password
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

      // Create the user account using Supabase Admin (via edge function would be ideal)
      // For now, we'll use signUp and the handle_new_user trigger will create the profile
      // However, this will log in as the new user, so we need a different approach
      
      // NOTE: In a real production app, you would use an admin API or edge function
      // For now, we'll show a message about the limitation
      toast({
        title: "Coming Soon",
        description: "Staff invitation via email is being set up. For now, have staff members sign up directly and you can assign roles after.",
      });
      
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setSelectedRoles([]);
    setSelectedProperties([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Staff Member</DialogTitle>
          <DialogDescription>
            Send an invitation to a new staff member to join your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          {/* Roles */}
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
                  <CardContent className="flex items-center gap-2 p-2">
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
                    <span className="text-sm">{role.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Property Access */}
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
                    <div>
                      <span className="text-sm font-medium">{property.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({property.code})
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
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
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
