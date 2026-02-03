import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Users } from 'lucide-react';

export interface GuestDetail {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  is_vip: boolean;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  reservation_status: string;
}

interface NightAuditGuestListProps {
  guests: GuestDetail[];
  isLoading?: boolean;
}

export function NightAuditGuestList({ guests, isLoading }: NightAuditGuestListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading guest data...
      </div>
    );
  }

  if (guests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No guests checked in</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Guest Name</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-center">Guests</TableHead>
          <TableHead>Check-in</TableHead>
          <TableHead>Check-out</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {guests.map((guest) => (
          <TableRow key={guest.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {guest.first_name} {guest.last_name}
                {guest.is_vip && (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">VIP</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>{guest.room_number}</TableCell>
            <TableCell>{guest.phone || '-'}</TableCell>
            <TableCell className="max-w-[200px] truncate">{guest.email || '-'}</TableCell>
            <TableCell className="text-center">
              {guest.adults}A{guest.children > 0 ? `, ${guest.children}C` : ''}
            </TableCell>
            <TableCell>{format(new Date(guest.check_in_date), 'MMM d')}</TableCell>
            <TableCell>{format(new Date(guest.check_out_date), 'MMM d')}</TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {guest.reservation_status.replace('_', ' ')}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
