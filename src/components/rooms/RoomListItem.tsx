import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoomStatusBadge } from "./RoomStatusBadge";
import { 
  MoreVertical, 
  User, 
  Wrench, 
  Sparkles, 
  DoorOpen, 
  AlertTriangle,
} from "lucide-react";
import type { RoomStatus } from "@/types/database";
import { TableRow, TableCell } from "@/components/ui/table";

interface RoomListItemProps {
  room: {
    id: string;
    room_number: string;
    floor: string | null;
    status: RoomStatus;
    room_type: {
      name: string;
      code: string;
      base_rate: number;
    } | null;
    notes: string | null;
  };
  guestName?: string | null;
  onStatusChange: (roomId: string, newStatus: RoomStatus) => void;
  onClick?: () => void;
}

const statusActions: { status: RoomStatus; label: string; icon: React.ElementType }[] = [
  { status: "vacant", label: "Mark Vacant", icon: DoorOpen },
  { status: "occupied", label: "Mark Occupied", icon: User },
  { status: "dirty", label: "Mark Dirty", icon: Sparkles },
  { status: "maintenance", label: "Mark Maintenance", icon: Wrench },
  { status: "out_of_order", label: "Mark Out of Order", icon: AlertTriangle },
];

export function RoomListItem({ room, guestName, onStatusChange, onClick }: RoomListItemProps) {
  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onClick}>
      <TableCell className="font-bold">{room.room_number}</TableCell>
      <TableCell>{room.floor || "-"}</TableCell>
      <TableCell>{room.room_type?.name || "-"}</TableCell>
      <TableCell>
        <RoomStatusBadge status={room.status} size="sm" />
      </TableCell>
      <TableCell>
        {guestName && room.status === "occupied" ? (
          <span className="flex items-center gap-1 text-sm">
            <User className="h-3 w-3 text-muted-foreground" />
            {guestName}
          </span>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="text-right font-medium">
        ${room.room_type?.base_rate.toFixed(0) || "0"}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
            {statusActions.map((action) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem
                  key={action.status}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(room.id, action.status);
                  }}
                  disabled={room.status === action.status}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
