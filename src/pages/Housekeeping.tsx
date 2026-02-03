import { useState, useMemo, useCallback } from 'react';
import { Plus, RefreshCw, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HousekeepingStatsBar } from '@/components/housekeeping/HousekeepingStatsBar';
import { HousekeepingStaffDashboard } from '@/components/housekeeping/HousekeepingStaffDashboard';
import { TaskCard } from '@/components/housekeeping/TaskCard';
import { TaskFilters } from '@/components/housekeeping/TaskFilters';
import { CreateTaskDialog } from '@/components/housekeeping/CreateTaskDialog';
import { AssignTaskDialog } from '@/components/housekeeping/AssignTaskDialog';
import { RoomStatusGrid } from '@/components/housekeeping/RoomStatusGrid';
import {
  useHousekeepingTasks,
  useHousekeepingStats,
  useStartTask,
  useCompleteTask,
  useDeleteTask,
  useMyAssignedTasks,
  useMyHousekeepingStats,
  type HousekeepingTask,
} from '@/hooks/useHousekeeping';
import { useHousekeepingNotifications } from '@/hooks/useHousekeepingNotifications';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export default function Housekeeping() {
  // Enable real-time notifications for housekeeping tasks
  useHousekeepingNotifications();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasAnyRole, hasRole } = useAuth();

  // Only managers, owners, and front_desk can create tasks
  const canCreateTask = hasAnyRole(['owner', 'manager', 'front_desk']);
  // Only managers and owners can assign tasks
  const canAssignTask = hasAnyRole(['owner', 'manager']);
  // Only managers and owners can delete tasks
  const canDeleteTask = hasAnyRole(['owner', 'manager']);
  // Check if user is housekeeping staff (not owner/manager)
  const isHousekeepingStaff = hasRole('housekeeping') && !hasAnyRole(['owner', 'manager']);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);

  const { data: tasks, isLoading: tasksLoading, refetch } = useHousekeepingTasks();
  const { data: stats, isLoading: statsLoading } = useHousekeepingStats();
  const { data: myTasks } = useMyAssignedTasks();
  const { data: myStats, isLoading: myStatsLoading } = useMyHousekeepingStats();
  const startTask = useStartTask();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  
  const myTaskCount = myTasks?.length || 0;

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.filter((task) => {
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const roomNumber = task.room?.room_number?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        if (!roomNumber.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, statusFilter, searchQuery]);

  const handleStartTask = async (taskId: string) => {
    try {
      await startTask.mutateAsync(taskId);
      toast({
        title: 'Task Started',
        description: 'The task has been marked as in progress.',
      });
    } catch (error) {
      console.error('Error starting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to start task.',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask.mutateAsync({ taskId, updateRoomStatus: true });
      toast({
        title: 'Task Completed',
        description: 'The task has been completed and room status updated.',
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete task.',
        variant: 'destructive',
      });
    }
  };

  const handleAssignTask = (task: HousekeepingTask) => {
    setSelectedTask(task);
    setAssignDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast({
        title: 'Task Deleted',
        description: 'The task has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task.',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['housekeeping-stats'] });
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
    toast({
      title: 'Refreshed',
      description: 'Data has been refreshed.',
    });
  };

  const scrollToTask = useCallback((taskId: string) => {
    // Close the popover
    setNotificationOpen(false);
    
    // Small delay to allow popover to close
    setTimeout(() => {
      const taskElement = document.getElementById(`task-${taskId}`);
      if (taskElement) {
        taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a highlight effect
        taskElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          taskElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
        }, 2000);
      }
    }, 100);
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Bar - Show staff dashboard or global stats based on role */}
      {isHousekeepingStaff ? (
        <HousekeepingStaffDashboard
          assignedCount={myStats?.assignedCount || 0}
          pendingCount={myStats?.pendingCount || 0}
          inProgressCount={myStats?.inProgressCount || 0}
          completedTodayCount={myStats?.completedTodayCount || 0}
          highPriorityCount={myStats?.highPriorityCount || 0}
          isLoading={myStatsLoading}
        />
      ) : (
        <HousekeepingStatsBar stats={stats} isLoading={statsLoading} />
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Housekeeping Management</h2>
          {!isHousekeepingStaff && (stats?.unassignedPending ?? 0) > 0 && (
            <Badge 
              variant="destructive" 
              className="animate-pulse"
            >
              {stats?.unassignedPending} unassigned
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* My Tasks Notification Button */}
          <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {myTaskCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {myTaskCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">My Assigned Tasks</h4>
                {myTaskCount === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks assigned to you.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {myTasks?.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => scrollToTask(task.id)}
                        className="flex items-center justify-between p-2 bg-muted rounded-md cursor-pointer hover:bg-accent transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">Room {task.room?.room_number}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {task.task_type.replace('_', ' ')} • {task.status === 'pending' ? 'Pending' : 'In Progress'}
                          </p>
                        </div>
                        <Badge variant={task.status === 'pending' ? 'secondary' : 'default'}>
                          {task.status === 'pending' ? 'Start' : 'Continue'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
          {canCreateTask && (
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Task List</TabsTrigger>
          <TabsTrigger value="rooms">Room Status</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Filters */}
          <TaskFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Task List */}
          {tasksLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading tasks...</p>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tasks found.</p>
              {canCreateTask && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Create First Task
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  id={`task-${task.id}`}
                  task={task}
                  onStart={handleStartTask}
                  onComplete={handleCompleteTask}
                  onAssign={handleAssignTask}
                  onDelete={handleDeleteTask}
                  canAssign={canAssignTask}
                  canDelete={canDeleteTask}
                  isStarting={startTask.isPending}
                  isCompleting={completeTask.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rooms">
          <RoomStatusGrid />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <AssignTaskDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        task={selectedTask}
      />
    </div>
  );
}
