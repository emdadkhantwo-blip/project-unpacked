import { useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { Loader2, Calendar, Clock, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useShifts, useStaffShiftAssignments } from "@/hooks/useShifts";
import { useTenant } from "@/hooks/useTenant";
import { cn } from "@/lib/utils";

interface AssignShiftsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  staffName: string;
}

export function AssignShiftsDialog({
  open,
  onOpenChange,
  staffId,
  staffName,
}: AssignShiftsDialogProps) {
  const { currentProperty } = useTenant();
  const { shifts, isLoading: isLoadingShifts } = useShifts(currentProperty?.id);
  const {
    assignments,
    isLoading: isLoadingAssignments,
    assignShift,
    removeShift,
    isAssigning,
    isRemoving,
  } = useStaffShiftAssignments(staffId, 7);

  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const getAssignmentForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return assignments.find((a) => a.date === dateStr);
  };

  const handleToggleShift = (date: Date, shiftId: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existingAssignment = assignments.find(
      (a) => a.date === dateStr && a.shift_id === shiftId
    );

    if (existingAssignment) {
      removeShift(existingAssignment.id);
    } else {
      assignShift({ shiftId, date: dateStr });
    }
  };

  const isLoading = isLoadingShifts || isLoadingAssignments;
  const isPending = isAssigning || isRemoving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Assign Shifts
          </DialogTitle>
          <DialogDescription>
            Assign shifts for {staffName} over the next 7 days
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No shifts configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              Go to HR → Shifts to create shift templates
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {days.map((date) => {
                const assignment = getAssignmentForDay(date);
                const isToday = format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

                return (
                  <div
                    key={format(date, "yyyy-MM-dd")}
                    className={cn(
                      "rounded-lg border p-4",
                      isToday && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">
                          {format(date, "EEEE")}
                          {isToday && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Today
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(date, "MMM d, yyyy")}
                        </p>
                      </div>
                      {assignment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeShift(assignment.id)}
                          disabled={isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {shifts.map((shift) => {
                        const isAssigned = assignment?.shift_id === shift.id;

                        return (
                          <Button
                            key={shift.id}
                            variant={isAssigned ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "justify-start h-auto py-2",
                              isAssigned && "ring-2 ring-primary"
                            )}
                            style={{
                              borderColor: shift.color || undefined,
                              backgroundColor: isAssigned
                                ? shift.color || undefined
                                : undefined,
                            }}
                            onClick={() =>
                              handleToggleShift(date, shift.id)
                            }
                            disabled={isPending}
                          >
                            <div className="text-left">
                              <p className="font-medium text-xs">
                                {shift.name}
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                  isAssigned
                                    ? "text-primary-foreground/80"
                                    : "text-muted-foreground"
                                )}
                              >
                                {shift.start_time.slice(0, 5)} -{" "}
                                {shift.end_time.slice(0, 5)}
                              </p>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
