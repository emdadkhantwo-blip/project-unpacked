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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Wallet } from "lucide-react";
import { format } from "date-fns";

interface GeneratePayrollDialogProps {
  onGenerate: (data: { month: number; year: number }) => void;
  isGenerating?: boolean;
  existingPeriods?: Array<{ month: number; year: number }>;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function GeneratePayrollDialog({
  onGenerate,
  isGenerating,
  existingPeriods = [],
}: GeneratePayrollDialogProps) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedMonth, setSelectedMonth] = useState((currentMonth + 1).toString());
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const handleGenerate = () => {
    onGenerate({
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear),
    });
    setOpen(false);
  };

  // Check if period already exists
  const periodExists = existingPeriods.some(
    (p) => p.month === parseInt(selectedMonth) && p.year === parseInt(selectedYear)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-vibrant-green hover:bg-vibrant-green/90">
          <Plus className="h-4 w-4 mr-2" />
          Generate Payroll
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-vibrant-green" />
            Generate Payroll
          </DialogTitle>
          <DialogDescription>
            Generate payroll entries for all active staff members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={month} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {periodExists && (
            <div className="p-3 bg-vibrant-amber/10 border border-vibrant-amber/30 rounded-lg text-sm text-vibrant-amber">
              A payroll period for {MONTHS[parseInt(selectedMonth) - 1]} {selectedYear} already exists. Generating will recalculate all entries.
            </div>
          )}

          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">What this will do:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>Create payroll entries for all active staff</li>
              <li>Use salary from HR staff profiles</li>
              <li>Status will be set to "Draft"</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-vibrant-green hover:bg-vibrant-green/90"
          >
            {isGenerating ? "Generating..." : "Generate Payroll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
