import { useState } from "react";
import { MessageSquare, AlertCircle, ThumbsUp, HelpCircle } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateGuestNote, type GuestNote } from "@/hooks/useGuestNotes";
import { cn } from "@/lib/utils";

interface AddGuestNoteDialogProps {
  guestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NOTE_TYPES: {
  value: GuestNote["note_type"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { value: "general", label: "General", icon: MessageSquare, color: "text-muted-foreground" },
  { value: "complaint", label: "Complaint", icon: AlertCircle, color: "text-destructive" },
  { value: "compliment", label: "Compliment", icon: ThumbsUp, color: "text-success" },
  { value: "request", label: "Request", icon: HelpCircle, color: "text-blue-500" },
];

export function AddGuestNoteDialog({
  guestId,
  open,
  onOpenChange,
}: AddGuestNoteDialogProps) {
  const [noteType, setNoteType] = useState<GuestNote["note_type"]>("general");
  const [content, setContent] = useState("");

  const createNote = useCreateGuestNote();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    createNote.mutate(
      {
        guestId,
        noteType,
        content: content.trim(),
      },
      {
        onSuccess: () => {
          setContent("");
          setNoteType("general");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Guest Note</DialogTitle>
          <DialogDescription>
            Record an observation or note about this guest.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Note Type</Label>
            <RadioGroup
              value={noteType}
              onValueChange={(val) => setNoteType(val as GuestNote["note_type"])}
              className="grid grid-cols-2 gap-2"
            >
              {NOTE_TYPES.map((type) => (
                <Label
                  key={type.value}
                  htmlFor={type.value}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                    noteType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                  <type.icon className={cn("h-4 w-4", type.color)} />
                  <span className="text-sm">{type.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Note Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your observation or note..."
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createNote.isPending || !content.trim()}>
              {createNote.isPending ? "Saving..." : "Add Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
