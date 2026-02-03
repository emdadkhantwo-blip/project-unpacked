import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NightAuditRoomList, RoomDetail } from './NightAuditRoomList';
import { NightAuditGuestList, GuestDetail } from './NightAuditGuestList';
import { NightAuditRevenueBreakdown, PaymentsByMethod, RevenueByCategory } from './NightAuditRevenueBreakdown';
import { NightAuditOutstandingFolios, OutstandingFolio } from './NightAuditOutstandingFolios';
import { BedDouble, Users, Wallet, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface NightAuditDetailTabsProps {
  rooms: RoomDetail[];
  guests: GuestDetail[];
  outstandingFolios: OutstandingFolio[];
  paymentsByMethod: PaymentsByMethod;
  revenueByCategory: RevenueByCategory;
  totalRevenue: number;
  totalPayments: number;
  isLoading: boolean;
}

export function NightAuditDetailTabs({
  rooms,
  guests,
  outstandingFolios,
  paymentsByMethod,
  revenueByCategory,
  totalRevenue,
  totalPayments,
  isLoading,
}: NightAuditDetailTabsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const vipGuests = guests.filter(g => g.is_vip).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Detailed View</CardTitle>
        <CardDescription>Room status, guest list, and financial breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rooms">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <BedDouble className="h-4 w-4" />
              Rooms ({occupiedRooms}/{rooms.length})
            </TabsTrigger>
            <TabsTrigger value="guests" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Guests ({guests.length})
              {vipGuests > 0 && (
                <span className="text-xs text-amber-500 ml-1">({vipGuests} VIP)</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="folios" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Outstanding ({outstandingFolios.length})
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="rooms">
              <NightAuditRoomList rooms={rooms} />
            </TabsContent>

            <TabsContent value="guests">
              <NightAuditGuestList guests={guests} />
            </TabsContent>

            <TabsContent value="revenue">
              <NightAuditRevenueBreakdown
                paymentsByMethod={paymentsByMethod}
                revenueByCategory={revenueByCategory}
                totalRevenue={totalRevenue}
                totalPayments={totalPayments}
              />
            </TabsContent>

            <TabsContent value="folios">
              <NightAuditOutstandingFolios folios={outstandingFolios} />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
