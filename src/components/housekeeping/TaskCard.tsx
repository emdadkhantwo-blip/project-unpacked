import { format } from 'date-fns';
import { Clock, User, Play, CheckCircle, MoreVertical, AlertTriangle, Trash2, Sparkles, BedDouble, Search, ClipboardCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { HousekeepingTask } from '@/hooks/useHousekeeping';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: HousekeepingTask;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onAssign: (task: HousekeepingTask) => void;
  onDelete?: (taskId: string) => void;
  canAssign?: boolean;
  canDelete?: boolean;
  isStarting?: boolean;
  isCompleting?: boolean;
  id?: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  pending: { label: 'Pending', variant: 'secondary', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  in_progress: { label: 'In Progress', variant: 'default', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed: { label: 'Completed', variant: 'outline', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', variant: 'destructive', className: 'bg-rose-100 text-rose-700 border-rose-200' },
};

const priorityConfig: Record<number, { label: string; color: string; bgColor: string; borderColor: string }> = {
  1: { label: 'Low', color: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-l-slate-400' },
  2: { label: 'Medium', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-l-blue-500' },
  3: { label: 'High', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-l-amber-500' },
  4: { label: 'Urgent', color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-l-rose-500' },
};

const taskTypeConfig: Record<string, { label: string; icon: typeof Sparkles; color: string }> = {
  cleaning: { label: 'Standard Cleaning', icon: Sparkles, color: 'text-blue-500' },
  turndown: { label: 'Turndown Service', icon: BedDouble, color: 'text-purple-500' },
  deep_clean: { label: 'Deep Clean', icon: Sparkles, color: 'text-emerald-500' },
  inspection: { label: 'Inspection', icon: ClipboardCheck, color: 'text-amber-500' },
};

export function TaskCard({
  task,
  onStart,
  onComplete,
  onAssign,
  onDelete,
  canAssign = true,
  canDelete = true,
  isStarting,
  isCompleting,
  id,
}: TaskCardProps) {
  const status = statusConfig[task.status] || statusConfig.pending;
  const priority = priorityConfig[task.priority] || priorityConfig[1];
  const taskType = taskTypeConfig[task.task_type] || { label: task.task_type, icon: Sparkles, color: 'text-muted-foreground' };
  const TaskIcon = taskType.icon;

  return (
    <Card
      id={id}
      className={cn(
        'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-l-4',
        priority.borderColor,
        task.priority >= 3 && task.status === 'pending' && 'ring-1 ring-rose-200'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-3">
            {/* Room and Task Type */}
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", priority.bgColor)}>
                <TaskIcon className={cn("h-5 w-5", taskType.color)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">
                    Room {task.room?.room_number}
                  </span>
                  <Badge className={cn("text-xs border", status.className)}>
                    {status.label}
                  </Badge>
                  {task.priority >= 3 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-100 rounded-full">
                      <AlertTriangle className="h-3 w-3 text-rose-600" />
                      <span className="text-xs font-medium text-rose-600">{priority.label}</span>
                    </div>
                  )}
                </div>
                <p className={cn("text-sm font-medium", taskType.color)}>
                  {taskType.label}
                </p>
              </div>
            </div>

            {/* Task Details */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="px-2 py-1 bg-muted rounded-md">{task.room?.room_type?.name}</span>
              {task.room?.floor && (
                <span className="px-2 py-1 bg-muted rounded-md">Floor {task.room.floor}</span>
              )}
              {task.priority < 3 && (
                <span className={cn("px-2 py-1 rounded-md flex items-center gap-1", priority.bgColor, priority.color)}>
                  Priority: {priority.label}
                </span>
              )}
            </div>

            {/* Assignment and Time Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {task.assigned_profile ? (
                <span className="flex items-center gap-1.5 text-foreground">
                  <div className="p-1 bg-blue-100 rounded-full">
                    <User className="h-3 w-3 text-blue-600" />
                  </div>
                  {task.assigned_profile.full_name || task.assigned_profile.username}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                  <User className="h-3 w-3" />
                  Unassigned
                </span>
              )}
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(new Date(task.created_at), 'MMM d, h:mm a')}
              </span>
              {task.started_at && (
                <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                  <Play className="h-3 w-3" />
                  Started {format(new Date(task.started_at), 'h:mm a')}
                </span>
              )}
              {task.completed_at && (
                <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  <CheckCircle className="h-3 w-3" />
                  Done {format(new Date(task.completed_at), 'h:mm a')}
                </span>
              )}
            </div>

            {/* Notes */}
            {task.notes && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border-l-2 border-muted-foreground/20">
                {task.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {task.status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStart(task.id)}
                disabled={isStarting}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <Play className="mr-1 h-3 w-3" />
                Start
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button
                size="sm"
                onClick={() => onComplete(task.id)}
                disabled={isCompleting}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Complete
              </Button>
            )}
            {canAssign && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => onAssign(task)}>
                    <User className="mr-2 h-4 w-4" />
                    {task.assigned_to ? 'Reassign' : 'Assign'} Task
                  </DropdownMenuItem>
                  {canDelete && onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(task.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Task
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
