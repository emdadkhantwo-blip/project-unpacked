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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useResolveTicket, type MaintenanceTicket } from "@/hooks/useMaintenance";

interface ResolveTicketDialogProps {
  ticket: MaintenanceTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResolveTicketDialog({ ticket, open, onOpenChange }: ResolveTicketDialogProps) {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const resolveTicket = useResolveTicket();

  const handleResolve = () => {
    if (!ticket) return;

    resolveTicket.mutate(
      {
        ticketId: ticket.id,
        resolutionNotes,
      },
      {
        onSuccess: () => {
          setResolutionNotes("");
          onOpenChange(false);
        },
      }
    );
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Resolve Ticket</DialogTitle>
          <DialogDescription>
            Mark "{ticket.title}" as resolved and provide resolution notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="resolution-notes">Resolution Notes *</Label>
            <Textarea
              id="resolution-notes"
              placeholder="Describe what was done to resolve this issue..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Please provide details about the resolution for future reference.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            disabled={resolveTicket.isPending || !resolutionNotes.trim()}
          >
            {resolveTicket.isPending ? "Resolving..." : "Mark as Resolved"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
