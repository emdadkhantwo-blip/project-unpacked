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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";

interface CreateLeaveTypeDialogProps {
  onSubmit: (data: {
    name: string;
    code: string;
    days_per_year: number;
    is_paid: boolean;
    color: string;
  }) => void;
  isSubmitting?: boolean;
}

const COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6B7280", // Gray
];

export function CreateLeaveTypeDialog({
  onSubmit,
  isSubmitting,
}: CreateLeaveTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [daysPerYear, setDaysPerYear] = useState("0");
  const [isPaid, setIsPaid] = useState(true);
  const [color, setColor] = useState(COLORS[0]);

  const handleSubmit = () => {
    if (!name.trim() || !code.trim()) return;

    onSubmit({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      days_per_year: parseInt(daysPerYear) || 0,
      is_paid: isPaid,
      color,
    });

    // Reset and close
    setName("");
    setCode("");
    setDaysPerYear("0");
    setIsPaid(true);
    setColor(COLORS[0]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Type
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Leave Type</DialogTitle>
          <DialogDescription>
            Create a new leave type for your organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Annual Leave"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              placeholder="e.g. AL"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="days">Days Per Year</Label>
            <Input
              id="days"
              type="number"
              min="0"
              max="365"
              value={daysPerYear}
              onChange={(e) => setDaysPerYear(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="paid">Paid Leave</Label>
            <Switch id="paid" checked={isPaid} onCheckedChange={setIsPaid} />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !code.trim() || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
