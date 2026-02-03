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
import { Plus } from "lucide-react";

interface CreateShiftDialogProps {
  onCreateShift: (data: {
    name: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    color: string;
  }) => void;
  isCreating: boolean;
}

const COLOR_OPTIONS = [
  { value: "#F59E0B", label: "Amber" },
  { value: "#F97316", label: "Orange" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#EC4899", label: "Pink" },
  { value: "#8B5CF6", label: "Purple" },
];

export function CreateShiftDialog({ onCreateShift, isCreating }: CreateShiftDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [color, setColor] = useState("#3B82F6");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateShift({
      name,
      startTime,
      endTime,
      breakMinutes,
      color,
    });
    setOpen(false);
    // Reset form
    setName("");
    setStartTime("08:00");
    setEndTime("16:00");
    setBreakMinutes(30);
    setColor("#3B82F6");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Shift
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Shift Template</DialogTitle>
            <DialogDescription>
              Create a new shift template that can be assigned to staff members.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Shift Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Morning Shift"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="breakMinutes">Break Duration (minutes)</Label>
              <Input
                id="breakMinutes"
                type="number"
                min={0}
                max={120}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === option.value
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: option.value }}
                    onClick={() => setColor(option.value)}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name}>
              {isCreating ? "Creating..." : "Create Shift"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
