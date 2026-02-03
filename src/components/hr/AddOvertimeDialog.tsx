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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Timer } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddOvertimeDialogProps {
  staffList: Array<{ id: string; full_name: string }>;
  onSubmit: (data: {
    profile_id: string;
    date: string;
    hours: number;
    rate_multiplier: number;
  }) => void;
  isSubmitting?: boolean;
}

const RATE_MULTIPLIERS = [
  { value: "1.5", label: "1.5x - Weekday", description: "Regular overtime" },
  { value: "2", label: "2.0x - Weekend", description: "Saturday & Sunday" },
  { value: "2.5", label: "2.5x - Holiday", description: "Public holidays" },
];

export function AddOvertimeDialog({
  staffList,
  onSubmit,
  isSubmitting,
}: AddOvertimeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [hours, setHours] = useState("");
  const [rateMultiplier, setRateMultiplier] = useState("1.5");

  const handleSubmit = () => {
    if (!selectedStaff || !date || !hours) return;

    onSubmit({
      profile_id: selectedStaff,
      date: format(date, "yyyy-MM-dd"),
      hours: parseFloat(hours),
      rate_multiplier: parseFloat(rateMultiplier),
    });

    // Reset and close
    setSelectedStaff("");
    setDate(new Date());
    setHours("");
    setRateMultiplier("1.5");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-vibrant-orange hover:bg-vibrant-orange/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-vibrant-orange" />
            Log Overtime
          </DialogTitle>
          <DialogDescription>
            Record overtime hours for an employee.
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
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "MMM d, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              placeholder="e.g. 2"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Rate Multiplier</Label>
            <Select value={rateMultiplier} onValueChange={setRateMultiplier}>
              <SelectTrigger>
                <SelectValue placeholder="Select rate" />
              </SelectTrigger>
              <SelectContent>
                {RATE_MULTIPLIERS.map((rate) => (
                  <SelectItem key={rate.value} value={rate.value}>
                    <div className="flex flex-col">
                      <span>{rate.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {rate.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedStaff || !date || !hours || isSubmitting}
            className="bg-vibrant-orange hover:bg-vibrant-orange/90"
          >
            {isSubmitting ? "Adding..." : "Add Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
