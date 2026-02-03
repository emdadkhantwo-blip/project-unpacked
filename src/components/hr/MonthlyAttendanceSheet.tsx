import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react";
import { format, addMonths, subMonths, isWeekend } from "date-fns";
import { useMonthlyAttendance, AttendanceStatus } from "@/hooks/useMonthlyAttendance";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; className: string; symbol: string }> = {
  present: { 
    label: "Present", 
    className: "bg-vibrant-green/20 text-vibrant-green", 
    symbol: "P" 
  },
  absent: { 
    label: "Absent", 
    className: "bg-vibrant-rose/20 text-vibrant-rose", 
    symbol: "A" 
  },
  late: { 
    label: "Late", 
    className: "bg-vibrant-amber/20 text-vibrant-amber", 
    symbol: "L" 
  },
  weekend: { 
    label: "Weekend", 
    className: "bg-muted text-muted-foreground", 
    symbol: "W" 
  },
  future: { 
    label: "Future", 
    className: "bg-muted/50 text-muted-foreground/50", 
    symbol: "-" 
  },
};

export function MonthlyAttendanceSheet() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { staff, daysInMonth, isLoading } = useMonthlyAttendance(selectedMonth);

  const handlePreviousMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
  const handleNextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1));

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-vibrant-blue" />
            Monthly Attendance Sheet
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center font-medium">
              {format(selectedMonth, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No staff members found
          </div>
        ) : (
          <>
            <ScrollArea className="w-full max-w-full whitespace-nowrap rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-20 bg-background min-w-[180px]">
                      Staff
                    </TableHead>
                    {daysInMonth.map((day) => (
                      <TableHead 
                        key={day.toISOString()} 
                        className={cn(
                          "text-center min-w-[36px] px-1",
                          isWeekend(day) && "bg-muted/50"
                        )}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-muted-foreground">
                            {format(day, "EEE")}
                          </span>
                          <span>{format(day, "d")}</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="sticky right-0 z-20 bg-background text-center min-w-[80px]">
                      Summary
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.profile_id}>
                      <TableCell className="sticky left-0 z-10 bg-background">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {member.full_name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm truncate max-w-[120px]">
                              {member.full_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {member.position}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      {daysInMonth.map((day) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const status = member.attendance[dateStr] || "absent";
                        const config = STATUS_CONFIG[status];
                        
                        return (
                          <TableCell 
                            key={day.toISOString()} 
                            className={cn(
                              "text-center p-1",
                              isWeekend(day) && "bg-muted/30"
                            )}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className={cn(
                                      "w-7 h-7 mx-auto rounded flex items-center justify-center text-xs font-medium cursor-default",
                                      config.className
                                    )}
                                  >
                                    {config.symbol}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{format(day, "MMM d, yyyy")} - {config.label}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        );
                      })}
                      <TableCell className="sticky right-0 z-10 bg-background text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-vibrant-green">
                            {member.summary.present}/{member.summary.totalWorkDays}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {member.summary.totalWorkDays > 0 
                              ? Math.round((member.summary.present / member.summary.totalWorkDays) * 100)
                              : 0}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              {Object.entries(STATUS_CONFIG)
                .filter(([key]) => key !== "future")
                .map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div 
                      className={cn(
                        "w-6 h-6 rounded flex items-center justify-center text-xs font-medium",
                        config.className
                      )}
                    >
                      {config.symbol}
                    </div>
                    <span className="text-sm text-muted-foreground">{config.label}</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
