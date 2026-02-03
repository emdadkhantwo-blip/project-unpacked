import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Star, MessageSquare, AlertTriangle, Award, TrendingUp } from "lucide-react";
import type { PerformanceNoteType } from "@/hooks/usePerformance";

interface AddPerformanceNoteDialogProps {
  staffList: Array<{ id: string; full_name: string }>;
  onSubmit: (data: {
    profile_id: string;
    note_type: PerformanceNoteType;
    content: string;
    rating?: number;
  }) => void;
  isSubmitting?: boolean;
}

const NOTE_TYPES: Array<{
  value: PerformanceNoteType;
  label: string;
  icon: typeof MessageSquare;
  color: string;
}> = [
  { value: "feedback", label: "Feedback", icon: MessageSquare, color: "text-vibrant-blue" },
  { value: "warning", label: "Warning", icon: AlertTriangle, color: "text-vibrant-amber" },
  { value: "reward", label: "Reward", icon: Award, color: "text-vibrant-green" },
  { value: "kpi", label: "KPI Review", icon: TrendingUp, color: "text-vibrant-purple" },
];

export function AddPerformanceNoteDialog({
  staffList,
  onSubmit,
  isSubmitting,
}: AddPerformanceNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [noteType, setNoteType] = useState<PerformanceNoteType>("feedback");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleSubmit = () => {
    if (!selectedStaff || !content.trim()) return;

    onSubmit({
      profile_id: selectedStaff,
      note_type: noteType,
      content: content.trim(),
      rating: rating || undefined,
    });

    // Reset and close
    setSelectedStaff("");
    setNoteType("feedback");
    setContent("");
    setRating(null);
    setOpen(false);
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-vibrant-amber hover:bg-vibrant-amber/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-vibrant-amber" />
            Add Performance Note
          </DialogTitle>
          <DialogDescription>
            Record feedback, warnings, rewards, or KPI reviews for employees.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Note Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {NOTE_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={noteType === type.value ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setNoteType(type.value)}
                  >
                    <Icon className={`h-4 w-4 mr-2 ${noteType === type.value ? "" : type.color}`} />
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              placeholder="Enter your feedback or note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Rating (Optional)</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 hover:scale-110 transition-transform"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setRating(rating === star ? null : star)}
                >
                  <Star
                    className={`h-6 w-6 ${
                      displayRating !== null && star <= displayRating
                        ? "fill-vibrant-amber text-vibrant-amber"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
              {rating && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating}/5
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedStaff || !content.trim() || isSubmitting}
            className="bg-vibrant-amber hover:bg-vibrant-amber/90"
          >
            {isSubmitting ? "Adding..." : "Add Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
