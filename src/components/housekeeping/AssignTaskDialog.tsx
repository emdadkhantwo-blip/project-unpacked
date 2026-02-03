import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useHousekeepingStaff, useUpdateTask, type HousekeepingTask } from '@/hooks/useHousekeeping';
import { useToast } from '@/hooks/use-toast';
import { User, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: HousekeepingTask | null;
}

export function AssignTaskDialog({ open, onOpenChange, task }: AssignTaskDialogProps) {
  const { toast } = useToast();
  const { data: staff, isLoading } = useHousekeepingStaff();
  const updateTask = useUpdateTask();

  const handleAssign = async (staffId: string | null) => {
    if (!task) return;

    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        updates: { assigned_to: staffId },
      });

      toast({
        title: staffId ? 'Task Assigned' : 'Task Unassigned',
        description: staffId
          ? 'Task has been assigned successfully.'
          : 'Task assignment has been removed.',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning task:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assign Task - Room {task.room?.room_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {/* Unassign Option */}
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start gap-3 h-auto py-3',
              !task.assigned_to && 'bg-muted'
            )}
            onClick={() => handleAssign(null)}
            disabled={updateTask.isPending}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left">Unassigned</span>
            {!task.assigned_to && <Check className="h-4 w-4 text-primary" />}
          </Button>

          {/* Staff List */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading staff...
            </p>
          ) : staff?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No housekeeping staff found.
            </p>
          ) : (
            staff?.map((member) => (
              <Button
                key={member.id}
                variant="outline"
                className={cn(
                  'w-full justify-start gap-3 h-auto py-3',
                  task.assigned_to === member.id && 'bg-muted'
                )}
                onClick={() => handleAssign(member.id)}
                disabled={updateTask.isPending}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{member.full_name || member.username}</p>
                  <p className="text-xs text-muted-foreground">{member.department || 'Housekeeping'}</p>
                </div>
                {task.assigned_to === member.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
