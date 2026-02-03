import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type HousekeepingTask = Tables<'housekeeping_tasks'> & {
  room?: Tables<'rooms'> & {
    room_type?: Tables<'room_types'>;
  };
  assigned_profile?: Tables<'profiles'>;
};

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskType = 'cleaning' | 'turndown' | 'deep_clean' | 'inspection';

export function useHousekeepingTasks(filters?: {
  status?: TaskStatus;
  roomId?: string;
  assignedTo?: string;
}) {
  const { currentProperty } = useTenant();

  return useQuery({
    queryKey: ['housekeeping-tasks', currentProperty?.id, filters],
    queryFn: async () => {
      if (!currentProperty?.id) return [];

      let query = supabase
        .from('housekeeping_tasks')
        .select(`
          *,
          room:rooms(*, room_type:room_types(*))
        `)
        .eq('property_id', currentProperty.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.roomId) {
        query = query.eq('room_id', filters.roomId);
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching housekeeping tasks:', error);
        throw error;
      }

      // Fetch assigned profiles separately if needed
      const tasksWithProfiles = await Promise.all(
        (data || []).map(async (task) => {
          if (task.assigned_to) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', task.assigned_to)
              .maybeSingle();
            return { ...task, assigned_profile: profile };
          }
          return { ...task, assigned_profile: null };
        })
      );

      return tasksWithProfiles as HousekeepingTask[];
    },
    enabled: !!currentProperty?.id,
    refetchInterval: 30000,
  });
}

export function useHousekeepingStats() {
  const { currentProperty } = useTenant();

  return useQuery({
    queryKey: ['housekeeping-stats', currentProperty?.id],
    queryFn: async () => {
      if (!currentProperty?.id) {
        return { pending: 0, inProgress: 0, completed: 0, totalRooms: 0, dirtyRooms: 0, unassignedPending: 0 };
      }

      // Get task counts including assigned_to for unassigned count
      const { data: tasks, error: tasksError } = await supabase
        .from('housekeeping_tasks')
        .select('status, assigned_to')
        .eq('property_id', currentProperty.id);

      if (tasksError) throw tasksError;

      // Get room counts
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('status')
        .eq('property_id', currentProperty.id)
        .eq('is_active', true);

      if (roomsError) throw roomsError;

      const pendingTasks = tasks?.filter(t => t.status === 'pending') || [];
      const taskCounts = {
        pending: pendingTasks.length,
        inProgress: tasks?.filter(t => t.status === 'in_progress').length || 0,
        completed: tasks?.filter(t => t.status === 'completed').length || 0,
        unassignedPending: pendingTasks.filter(t => !t.assigned_to).length,
      };

      return {
        ...taskCounts,
        totalRooms: rooms?.length || 0,
        dirtyRooms: rooms?.filter(r => r.status === 'dirty').length || 0,
      };
    },
    enabled: !!currentProperty?.id,
    refetchInterval: 30000,
  });
}

export function useHousekeepingStaff() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['housekeeping-staff', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      // Get all profiles for this tenant that have housekeeping role
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching staff:', error);
        throw error;
      }

      // Get user roles to filter housekeeping staff
      const userIds = profiles?.map(p => p.id) || [];
      if (userIds.length === 0) return [];

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds)
        .in('role', ['housekeeping', 'owner', 'manager']);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        throw rolesError;
      }

      // Filter profiles to only those with housekeeping-related roles
      const housekeepingUserIds = new Set(roles?.map(r => r.user_id) || []);
      return profiles?.filter(p => housekeepingUserIds.has(p.id)) || [];
    },
    enabled: !!tenant?.id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant();

  return useMutation({
    mutationFn: async (data: {
      roomId: string;
      taskType: string;
      priority?: number;
      notes?: string;
      assignedTo?: string;
    }) => {
      if (!currentProperty?.id || !tenant?.id) {
        throw new Error('Property and tenant required');
      }

      const { data: task, error } = await supabase
        .from('housekeeping_tasks')
        .insert({
          tenant_id: tenant.id,
          property_id: currentProperty.id,
          room_id: data.roomId,
          task_type: data.taskType,
          priority: data.priority || 1,
          notes: data.notes,
          assigned_to: data.assignedTo,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['housekeeping-stats'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<TablesUpdate<'housekeeping_tasks'>>;
    }) => {
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['housekeeping-stats'] });
    },
  });
}

export function useStartTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['housekeeping-stats'] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, updateRoomStatus = true }: { taskId: string; updateRoomStatus?: boolean }) => {
      // Get task to find room
      const { data: task, error: taskError } = await supabase
        .from('housekeeping_tasks')
        .select('room_id')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      // Complete the task
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Update room status to vacant if requested
      if (updateRoomStatus && task?.room_id) {
        await supabase
          .from('rooms')
          .update({ status: 'vacant' })
          .eq('id', task.room_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['housekeeping-stats'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('housekeeping_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks', currentProperty?.id] });
      queryClient.invalidateQueries({ queryKey: ['housekeeping-stats', currentProperty?.id] });
    },
  });
}

export function useUpdateRoomStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      status,
    }: {
      roomId: string;
      status: 'vacant' | 'occupied' | 'dirty' | 'maintenance' | 'out_of_order';
    }) => {
      const { data, error } = await supabase
        .from('rooms')
        .update({ status })
        .eq('id', roomId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['housekeeping-stats'] });
    },
  });
}

export function useMyAssignedTasks() {
  const { currentProperty } = useTenant();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-assigned-tasks', currentProperty?.id, user?.id],
    queryFn: async () => {
      if (!currentProperty?.id || !user?.id) return [];

      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .select(`
          *,
          room:rooms(room_number, floor)
        `)
        .eq('property_id', currentProperty.id)
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentProperty?.id && !!user?.id,
    refetchInterval: 30000,
  });
}

export function useMyHousekeepingStats() {
  const { currentProperty } = useTenant();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-housekeeping-stats', currentProperty?.id, user?.id],
    queryFn: async () => {
      if (!currentProperty?.id || !user?.id) {
        return {
          assignedCount: 0,
          pendingCount: 0,
          inProgressCount: 0,
          completedTodayCount: 0,
          highPriorityCount: 0,
        };
      }

      // Get assigned tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('housekeeping_tasks')
        .select('status, priority')
        .eq('property_id', currentProperty.id)
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'in_progress']);

      if (tasksError) throw tasksError;

      // Get completed today count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: completedTodayCount, error: completedError } = await supabase
        .from('housekeeping_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', currentProperty.id)
        .eq('assigned_to', user.id)
        .eq('status', 'completed')
        .gte('completed_at', today.toISOString());

      if (completedError) throw completedError;

      const assignedCount = tasks?.length || 0;
      const pendingCount = tasks?.filter(t => t.status === 'pending').length || 0;
      const inProgressCount = tasks?.filter(t => t.status === 'in_progress').length || 0;
      const highPriorityCount = tasks?.filter(t => t.priority >= 3).length || 0;

      return {
        assignedCount,
        pendingCount,
        inProgressCount,
        completedTodayCount: completedTodayCount || 0,
        highPriorityCount,
      };
    },
    enabled: !!currentProperty?.id && !!user?.id,
    refetchInterval: 30000,
  });
}
