import { useRooms } from '@/hooks/useRooms';
import { useUpdateRoomStatus } from '@/hooks/useHousekeeping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type RoomStatus = 'vacant' | 'occupied' | 'dirty' | 'maintenance' | 'out_of_order';

const statusConfig: Record<RoomStatus, { label: string; color: string; bgColor: string }> = {
  vacant: { label: 'Vacant', color: 'text-emerald-700', bgColor: 'bg-emerald-100 border-emerald-200' },
  occupied: { label: 'Occupied', color: 'text-red-700', bgColor: 'bg-red-100 border-red-200' },
  dirty: { label: 'Dirty', color: 'text-amber-700', bgColor: 'bg-amber-100 border-amber-200' },
  maintenance: { label: 'Maintenance', color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-200' },
  out_of_order: { label: 'Out of Order', color: 'text-red-700', bgColor: 'bg-red-100 border-red-200' },
};

export function RoomStatusGrid() {
  const { toast } = useToast();
  const { data: rooms, isLoading } = useRooms();
  const updateRoomStatus = useUpdateRoomStatus();

  const handleStatusChange = async (roomId: string, newStatus: RoomStatus) => {
    try {
      await updateRoomStatus.mutateAsync({ roomId, status: newStatus });
      toast({
        title: 'Room Status Updated',
        description: `Room status changed to ${statusConfig[newStatus].label}.`,
      });
    } catch (error) {
      console.error('Error updating room status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update room status.',
        variant: 'destructive',
      });
    }
  };

  // Group rooms by floor
  const roomsByFloor = rooms?.reduce((acc, room) => {
    const floor = room.floor || 'Unknown';
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {} as Record<string, typeof rooms>) || {};

  const floors = Object.keys(roomsByFloor).sort();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Room Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading rooms...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Home className="h-5 w-5" />
          Room Status Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {floors.map((floor) => (
          <div key={floor}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Floor {floor}
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {roomsByFloor[floor]?.map((room) => {
                const status = room.status as RoomStatus;
                const config = statusConfig[status];

                return (
                  <DropdownMenu key={room.id}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'h-12 w-full flex flex-col items-center justify-center gap-0.5 text-xs font-medium border-2',
                          config.bgColor,
                          config.color
                        )}
                      >
                        <span className="font-bold">{room.room_number}</span>
                        <span className="text-[10px] opacity-80">{config.label}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="bg-popover w-40">
                      {Object.entries(statusConfig).map(([key, value]) => (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => handleStatusChange(room.id, key as RoomStatus)}
                          disabled={key === status}
                          className={cn(
                            key === status && 'bg-muted'
                          )}
                        >
                          <span className={cn('mr-2 h-2 w-2 rounded-full', value.bgColor)} />
                          {value.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          {Object.entries(statusConfig).map(([key, value]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn('h-3 w-3 rounded border', value.bgColor)} />
              <span className="text-xs text-muted-foreground">{value.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
