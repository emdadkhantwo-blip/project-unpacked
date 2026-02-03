import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAssignTicket, type MaintenanceTicket } from "@/hooks/useMaintenance";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";

interface AssignTicketDialogProps {
  ticket: MaintenanceTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignTicketDialog({ ticket, open, onOpenChange }: AssignTicketDialogProps) {
  const { tenant } = useTenant();
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const assignTicket = useAssignTicket();

  // Fetch maintenance staff
  const { data: staff = [] } = useQuery({
    queryKey: ["maintenance-staff", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      // Get profiles for this tenant
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id && open,
  });

  const handleAssign = () => {
    if (!ticket) return;

    assignTicket.mutate(
      {
        ticketId: ticket.id,
        assignedTo: selectedStaff || null,
      },
      {
        onSuccess: () => {
          setSelectedStaff("");
          onOpenChange(false);
        },
      }
    );
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assign Ticket</DialogTitle>
          <DialogDescription>
            Assign "{ticket.title}" to a maintenance staff member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name || member.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {ticket.assigned_profile && (
            <p className="text-sm text-muted-foreground">
              Currently assigned to:{" "}
              <span className="font-medium">
                {ticket.assigned_profile.full_name || ticket.assigned_profile.username}
              </span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={assignTicket.isPending}>
            {assignTicket.isPending ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
