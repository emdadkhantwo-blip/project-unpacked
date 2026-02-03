import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { BedDouble } from 'lucide-react';

export interface RoomDetail {
  id: string;
  room_number: string;
  floor: string | null;
  status: string;
  room_type_name: string;
  guest_name: string | null;
  guest_phone: string | null;
  rate_per_night: number;
  check_in_date: string | null;
  check_out_date: string | null;
  balance: number;
}

interface NightAuditRoomListProps {
  rooms: RoomDetail[];
  isLoading?: boolean;
}

export function NightAuditRoomList({ rooms, isLoading }: NightAuditRoomListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'occupied':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Occupied</Badge>;
      case 'vacant':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Vacant</Badge>;
      case 'dirty':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Dirty</Badge>;
      case 'maintenance':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Maintenance</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading room data...
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BedDouble className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No rooms available</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Room</TableHead>
          <TableHead>Floor</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Guest</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rooms.map((room) => (
          <TableRow key={room.id}>
            <TableCell className="font-medium">{room.room_number}</TableCell>
            <TableCell>{room.floor || '-'}</TableCell>
            <TableCell>{room.room_type_name}</TableCell>
            <TableCell>{getStatusBadge(room.status)}</TableCell>
            <TableCell>{room.guest_name || '-'}</TableCell>
            <TableCell>{room.guest_phone || '-'}</TableCell>
            <TableCell className="text-right">
              {room.status === 'occupied' ? formatCurrency(room.rate_per_night) : '-'}
            </TableCell>
            <TableCell className="text-right">
              {room.balance > 0 ? (
                <span className="text-red-600 font-medium">{formatCurrency(room.balance)}</span>
              ) : room.status === 'occupied' ? (
                <span className="text-green-600">Paid</span>
              ) : (
                '-'
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
