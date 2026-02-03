import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';
import type { RoomDetail } from '@/components/night-audit/NightAuditRoomList';
import type { GuestDetail } from '@/components/night-audit/NightAuditGuestList';
import type { OutstandingFolio } from '@/components/night-audit/NightAuditOutstandingFolios';
import type { PaymentsByMethod, RevenueByCategory } from '@/components/night-audit/NightAuditRevenueBreakdown';

export interface NightAudit {
  id: string;
  tenant_id: string;
  property_id: string;
  business_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  started_at: string | null;
  completed_at: string | null;
  run_by: string | null;
  rooms_charged: number;
  total_room_revenue: number;
  total_fb_revenue: number;
  total_other_revenue: number;
  total_payments: number;
  occupancy_rate: number;
  adr: number;
  revpar: number;
  report_data: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PreAuditChecklist {
  allReservationsCheckedIn: boolean;
  noShowsMarked: boolean;
  posOrdersPosted: boolean;
  pendingPaymentsRecorded: boolean;
  housekeepingComplete: boolean;
}

export interface AuditStatistics {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: number;
  roomRevenue: number;
  fbRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  totalPayments: number;
  adr: number;
  revpar: number;
  arrivalsToday: number;
  departuresToday: number;
  stayovers: number;
  noShows: number;
}

export function useNightAudit() {
  const { currentProperty, tenant } = useTenant();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Get today's business date (usually yesterday if running after midnight)
  const getBusinessDate = () => {
    const now = new Date();
    // If before 6 AM, consider it previous day's audit
    if (now.getHours() < 6) {
      return format(subDays(now, 1), 'yyyy-MM-dd');
    }
    return format(now, 'yyyy-MM-dd');
  };

  // Fetch night audit history
  const { data: auditHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['night-audits', currentProperty?.id],
    queryFn: async () => {
      if (!currentProperty?.id) return [];

      const { data, error } = await supabase
        .from('night_audits')
        .select('*')
        .eq('property_id', currentProperty.id)
        .order('business_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as NightAudit[];
    },
    enabled: !!currentProperty?.id,
  });

  // Get current/today's audit
  const { data: currentAudit, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['night-audit-current', currentProperty?.id, getBusinessDate()],
    queryFn: async () => {
      if (!currentProperty?.id) return null;

      const { data, error } = await supabase
        .from('night_audits')
        .select('*')
        .eq('property_id', currentProperty.id)
        .eq('business_date', getBusinessDate())
        .maybeSingle();

      if (error) throw error;
      return data as NightAudit | null;
    },
    enabled: !!currentProperty?.id,
  });

  // Fetch pre-audit checklist data
  const { data: preAuditData, isLoading: isLoadingPreAudit, refetch: refetchPreAudit } = useQuery({
    queryKey: ['pre-audit-checklist', currentProperty?.id, getBusinessDate()],
    queryFn: async (): Promise<PreAuditChecklist> => {
      if (!currentProperty?.id || !tenant?.id) {
        return {
          allReservationsCheckedIn: true,
          noShowsMarked: true,
          posOrdersPosted: true,
          pendingPaymentsRecorded: true,
          housekeepingComplete: true,
        };
      }

      const businessDate = getBusinessDate();

      // Check for reservations that should have checked in today but haven't
      const { data: pendingArrivals } = await supabase
        .from('reservations')
        .select('id')
        .eq('property_id', currentProperty.id)
        .eq('check_in_date', businessDate)
        .eq('status', 'confirmed')
        .limit(1);

      // Check for unposted POS orders
      const { data: unpostedOrders } = await supabase
        .from('pos_orders')
        .select('id, outlet:pos_outlets!inner(property_id)')
        .eq('pos_outlets.property_id', currentProperty.id)
        .in('status', ['pending', 'preparing', 'ready', 'served'])
        .limit(1);

      // Check for incomplete housekeeping tasks
      const { data: pendingTasks } = await supabase
        .from('housekeeping_tasks')
        .select('id')
        .eq('property_id', currentProperty.id)
        .neq('status', 'completed')
        .limit(1);

      return {
        allReservationsCheckedIn: !pendingArrivals?.length,
        noShowsMarked: true, // This would need manual confirmation
        posOrdersPosted: !unpostedOrders?.length,
        pendingPaymentsRecorded: true, // This would need manual confirmation
        housekeepingComplete: !pendingTasks?.length,
      };
    },
    enabled: !!currentProperty?.id && !!tenant?.id,
  });

  // Calculate audit statistics
  const { data: auditStats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['audit-statistics', currentProperty?.id, getBusinessDate()],
    queryFn: async (): Promise<AuditStatistics> => {
      if (!currentProperty?.id || !tenant?.id) {
        return {
          totalRooms: 0,
          occupiedRooms: 0,
          vacantRooms: 0,
          occupancyRate: 0,
          roomRevenue: 0,
          fbRevenue: 0,
          otherRevenue: 0,
          totalRevenue: 0,
          totalPayments: 0,
          adr: 0,
          revpar: 0,
          arrivalsToday: 0,
          departuresToday: 0,
          stayovers: 0,
          noShows: 0,
        };
      }

      const businessDate = getBusinessDate();

      // Get total rooms
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id, status')
        .eq('property_id', currentProperty.id)
        .eq('is_active', true);

      const totalRooms = rooms?.length || 0;
      const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0;
      const vacantRooms = totalRooms - occupiedRooms;

      // Get today's reservations stats
      const { data: arrivals } = await supabase
        .from('reservations')
        .select('id')
        .eq('property_id', currentProperty.id)
        .eq('check_in_date', businessDate)
        .eq('status', 'checked_in');

      const { data: departures } = await supabase
        .from('reservations')
        .select('id')
        .eq('property_id', currentProperty.id)
        .eq('check_out_date', businessDate)
        .eq('status', 'checked_out');

      const { data: noShows } = await supabase
        .from('reservations')
        .select('id')
        .eq('property_id', currentProperty.id)
        .eq('check_in_date', businessDate)
        .eq('status', 'no_show');

      // Get revenue from folios for today
      const { data: folioItems } = await supabase
        .from('folio_items')
        .select(`
          item_type,
          total_price,
          tax_amount,
          service_date,
          folio:folios!inner(property_id)
        `)
        .eq('folios.property_id', currentProperty.id)
        .eq('service_date', businessDate)
        .eq('voided', false);

      let roomRevenue = 0;
      let fbRevenue = 0;
      let otherRevenue = 0;

      folioItems?.forEach(item => {
        const amount = Number(item.total_price) + Number(item.tax_amount);
        if (item.item_type === 'room_charge') {
          roomRevenue += amount;
        } else if (item.item_type === 'food_beverage') {
          fbRevenue += amount;
        } else if (!['tax', 'service_charge', 'discount', 'deposit'].includes(item.item_type)) {
          otherRevenue += amount;
        }
      });

      // Get payments for today
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          amount,
          created_at,
          folio:folios!inner(property_id)
        `)
        .eq('folios.property_id', currentProperty.id)
        .gte('created_at', `${businessDate}T00:00:00`)
        .lt('created_at', `${businessDate}T23:59:59`)
        .eq('voided', false);

      const totalPayments = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
      const totalRevenue = roomRevenue + fbRevenue + otherRevenue;
      const adr = occupiedRooms > 0 ? roomRevenue / occupiedRooms : 0;
      const revpar = totalRooms > 0 ? roomRevenue / totalRooms : 0;

      return {
        totalRooms,
        occupiedRooms,
        vacantRooms,
        occupancyRate,
        roomRevenue,
        fbRevenue,
        otherRevenue,
        totalRevenue,
        totalPayments,
        adr,
        revpar,
        arrivalsToday: arrivals?.length || 0,
        departuresToday: departures?.length || 0,
        stayovers: occupiedRooms - (arrivals?.length || 0),
        noShows: noShows?.length || 0,
      };
    },
    enabled: !!currentProperty?.id && !!tenant?.id,
  });

  // Fetch detailed room data
  const { data: roomDetails = [], isLoading: isLoadingRoomDetails } = useQuery({
    queryKey: ['night-audit-rooms', currentProperty?.id, getBusinessDate()],
    queryFn: async (): Promise<RoomDetail[]> => {
      if (!currentProperty?.id) return [];

      const { data: rooms, error } = await supabase
        .from('rooms')
        .select(`
          id, room_number, floor, status,
          room_type:room_types(name, base_rate)
        `)
        .eq('property_id', currentProperty.id)
        .eq('is_active', true)
        .order('room_number');

      if (error) throw error;

      // Get current reservations for occupied rooms
      const { data: reservations } = await supabase
        .from('reservations')
        .select(`
          id,
          check_in_date,
          check_out_date,
          guest:guests(first_name, last_name, phone),
          reservation_rooms(room_id, rate_per_night),
          folio:folios(balance)
        `)
        .eq('property_id', currentProperty.id)
        .eq('status', 'checked_in');

      const roomReservationMap = new Map<string, {
        guestName: string;
        guestPhone: string | null;
        rate: number;
        checkIn: string;
        checkOut: string;
        balance: number;
      }>();

      reservations?.forEach(res => {
        res.reservation_rooms?.forEach(rr => {
          if (rr.room_id) {
            const guest = res.guest as { first_name: string; last_name: string; phone: string | null } | null;
            const folios = res.folio as { balance: number }[] | null;
            roomReservationMap.set(rr.room_id, {
              guestName: guest ? `${guest.first_name} ${guest.last_name}` : 'Unknown',
              guestPhone: guest?.phone || null,
              rate: Number(rr.rate_per_night) || 0,
              checkIn: res.check_in_date,
              checkOut: res.check_out_date,
              balance: folios?.[0]?.balance || 0,
            });
          }
        });
      });

      return (rooms || []).map(room => {
        const roomType = room.room_type as { name: string; base_rate: number } | null;
        const reservation = roomReservationMap.get(room.id);
        return {
          id: room.id,
          room_number: room.room_number,
          floor: room.floor,
          status: room.status,
          room_type_name: roomType?.name || 'Unknown',
          guest_name: reservation?.guestName || null,
          guest_phone: reservation?.guestPhone || null,
          rate_per_night: reservation?.rate || roomType?.base_rate || 0,
          check_in_date: reservation?.checkIn || null,
          check_out_date: reservation?.checkOut || null,
          balance: reservation?.balance || 0,
        };
      });
    },
    enabled: !!currentProperty?.id,
  });

  // Fetch detailed guest data
  const { data: guestDetails = [], isLoading: isLoadingGuestDetails } = useQuery({
    queryKey: ['night-audit-guests', currentProperty?.id],
    queryFn: async (): Promise<GuestDetail[]> => {
      if (!currentProperty?.id) return [];

      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          id,
          check_in_date,
          check_out_date,
          adults,
          children,
          status,
          guest:guests!inner(id, first_name, last_name, phone, email, is_vip),
          reservation_rooms(room:rooms(room_number))
        `)
        .eq('property_id', currentProperty.id)
        .eq('status', 'checked_in');

      if (error) throw error;

      return (reservations || []).map(res => {
        const guest = res.guest as { id: string; first_name: string; last_name: string; phone: string | null; email: string | null; is_vip: boolean };
        const rooms = res.reservation_rooms as { room: { room_number: string } | null }[];
        const roomNumbers = rooms
          .filter(r => r.room !== null)
          .map(r => r.room!.room_number)
          .join(', ');

        return {
          id: guest.id,
          first_name: guest.first_name,
          last_name: guest.last_name,
          phone: guest.phone,
          email: guest.email,
          is_vip: guest.is_vip,
          room_number: roomNumbers,
          check_in_date: res.check_in_date,
          check_out_date: res.check_out_date,
          adults: res.adults,
          children: res.children,
          reservation_status: res.status,
        };
      });
    },
    enabled: !!currentProperty?.id,
  });

  // Fetch outstanding folios
  const { data: outstandingFolios = [], isLoading: isLoadingFolios } = useQuery({
    queryKey: ['night-audit-outstanding-folios', currentProperty?.id],
    queryFn: async (): Promise<OutstandingFolio[]> => {
      if (!currentProperty?.id) return [];

      const { data, error } = await supabase
        .from('folios')
        .select(`
          id,
          folio_number,
          total_amount,
          paid_amount,
          balance,
          created_at,
          guest:guests(first_name, last_name),
          reservation:reservations(
            reservation_rooms(room:rooms(room_number))
          )
        `)
        .eq('property_id', currentProperty.id)
        .eq('status', 'open')
        .gt('balance', 0);

      if (error) throw error;

      return (data || []).map(folio => {
        const guest = folio.guest as { first_name: string; last_name: string } | null;
        const reservation = folio.reservation as { reservation_rooms: { room: { room_number: string } | null }[] } | null;
        const roomNumber = reservation?.reservation_rooms?.[0]?.room?.room_number || null;

        return {
          id: folio.id,
          folio_number: folio.folio_number,
          guest_name: guest ? `${guest.first_name} ${guest.last_name}` : 'Unknown',
          room_number: roomNumber,
          total_amount: Number(folio.total_amount),
          paid_amount: Number(folio.paid_amount),
          balance: Number(folio.balance),
          created_at: folio.created_at,
        };
      });
    },
    enabled: !!currentProperty?.id,
  });

  // Fetch payments by method
  const { data: paymentsByMethod, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['night-audit-payments-by-method', currentProperty?.id, getBusinessDate()],
    queryFn: async (): Promise<PaymentsByMethod> => {
      if (!currentProperty?.id) {
        return { cash: 0, credit_card: 0, debit_card: 0, bank_transfer: 0, other: 0 };
      }

      const businessDate = getBusinessDate();

      const { data, error } = await supabase
        .from('payments')
        .select(`
          amount,
          payment_method,
          folio:folios!inner(property_id)
        `)
        .eq('folios.property_id', currentProperty.id)
        .gte('created_at', `${businessDate}T00:00:00`)
        .lt('created_at', `${businessDate}T23:59:59`)
        .eq('voided', false);

      if (error) throw error;

      const result: PaymentsByMethod = { cash: 0, credit_card: 0, debit_card: 0, bank_transfer: 0, other: 0 };

      data?.forEach(payment => {
        const amount = Number(payment.amount);
        switch (payment.payment_method) {
          case 'cash':
            result.cash += amount;
            break;
          case 'credit_card':
            result.credit_card += amount;
            break;
          case 'debit_card':
            result.debit_card += amount;
            break;
          case 'bank_transfer':
            result.bank_transfer += amount;
            break;
          default:
            result.other += amount;
        }
      });

      return result;
    },
    enabled: !!currentProperty?.id,
  });

  // Fetch revenue by category
  const { data: revenueByCategory, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['night-audit-revenue-by-category', currentProperty?.id, getBusinessDate()],
    queryFn: async (): Promise<RevenueByCategory> => {
      if (!currentProperty?.id) {
        return {
          room: 0, food_beverage: 0, laundry: 0, minibar: 0, spa: 0,
          parking: 0, telephone: 0, internet: 0, miscellaneous: 0,
        };
      }

      const businessDate = getBusinessDate();

      const { data, error } = await supabase
        .from('folio_items')
        .select(`
          item_type,
          total_price,
          tax_amount,
          folio:folios!inner(property_id)
        `)
        .eq('folios.property_id', currentProperty.id)
        .eq('service_date', businessDate)
        .eq('voided', false);

      if (error) throw error;

      const result: RevenueByCategory = {
        room: 0, food_beverage: 0, laundry: 0, minibar: 0, spa: 0,
        parking: 0, telephone: 0, internet: 0, miscellaneous: 0,
      };

      data?.forEach(item => {
        const amount = Number(item.total_price) + Number(item.tax_amount);
        switch (item.item_type) {
          case 'room_charge':
            result.room += amount;
            break;
          case 'food_beverage':
            result.food_beverage += amount;
            break;
          case 'laundry':
            result.laundry += amount;
            break;
          case 'minibar':
            result.minibar += amount;
            break;
          case 'spa':
            result.spa += amount;
            break;
          case 'parking':
            result.parking += amount;
            break;
          case 'telephone':
            result.telephone += amount;
            break;
          case 'internet':
            result.internet += amount;
            break;
          case 'miscellaneous':
            result.miscellaneous += amount;
            break;
        }
      });

      return result;
    },
    enabled: !!currentProperty?.id,
  });

  // Start night audit
  const startAudit = useMutation({
    mutationFn: async () => {
      if (!currentProperty?.id || !tenant?.id || !user?.id) {
        throw new Error('Missing required data');
      }

      const businessDate = getBusinessDate();

      // Check if audit already exists
      const { data: existing } = await supabase
        .from('night_audits')
        .select('id, status')
        .eq('property_id', currentProperty.id)
        .eq('business_date', businessDate)
        .maybeSingle();

      if (existing?.status === 'completed') {
        throw new Error('Night audit for this date has already been completed');
      }

      if (existing) {
        // Update existing audit
        const { data, error } = await supabase
          .from('night_audits')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
            run_by: user.id,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Create new audit
      const { data, error } = await supabase
        .from('night_audits')
        .insert({
          tenant_id: tenant.id,
          property_id: currentProperty.id,
          business_date: businessDate,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          run_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['night-audit-current'] });
      queryClient.invalidateQueries({ queryKey: ['night-audits'] });
      toast({
        title: 'Night Audit Started',
        description: 'The night audit process has begun.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Post room charges for all occupied rooms
  const postRoomCharges = useMutation({
    mutationFn: async () => {
      if (!currentProperty?.id || !tenant?.id) {
        throw new Error('Missing required data');
      }

      const businessDate = getBusinessDate();

      // Get all checked-in reservations with their room assignments and rates
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select(`
          id,
          guest_id,
          reservation_rooms (
            id,
            room_id,
            rate_per_night,
            room:rooms(room_number)
          )
        `)
        .eq('property_id', currentProperty.id)
        .eq('status', 'checked_in');

      if (resError) throw resError;

      let chargesPosted = 0;
      let totalRevenue = 0;

      // Get tax and service charge rates from property
      const taxRate = currentProperty.tax_rate || 0;
      const serviceChargeRate = currentProperty.service_charge_rate || 0;

      for (const reservation of reservations || []) {
        // Get or create folio for this reservation
        let { data: folio } = await supabase
          .from('folios')
          .select('id, subtotal, tax_amount, total_amount, balance')
          .eq('reservation_id', reservation.id)
          .eq('status', 'open')
          .maybeSingle();

        if (!folio) {
          // Create folio if doesn't exist
          const { data: property } = await supabase
            .from('properties')
            .select('code')
            .eq('id', currentProperty.id)
            .single();

          const { data: newFolio, error: folioError } = await supabase
            .from('folios')
            .insert({
              tenant_id: tenant.id,
              property_id: currentProperty.id,
              guest_id: reservation.guest_id,
              reservation_id: reservation.id,
              folio_number: `F-${property?.code || 'PROP'}-${Date.now()}`,
            })
            .select('id, subtotal, tax_amount, total_amount, balance')
            .single();

          if (folioError) throw folioError;
          folio = newFolio;
        }

        // Post room charges for each room in the reservation
        for (const resRoom of reservation.reservation_rooms || []) {
          const roomRate = Number(resRoom.rate_per_night);
          const taxAmount = roomRate * (taxRate / 100);
          const roomNumber = resRoom.room?.room_number || 'Unknown';

          // Check if charge already posted for this date
          const { data: existingCharge } = await supabase
            .from('folio_items')
            .select('id')
            .eq('folio_id', folio.id)
            .eq('item_type', 'room_charge')
            .eq('service_date', businessDate)
            .eq('reference_id', resRoom.id)
            .maybeSingle();

          if (!existingCharge) {
            const { error: chargeError } = await supabase
              .from('folio_items')
              .insert({
                tenant_id: tenant.id,
                folio_id: folio.id,
                item_type: 'room_charge',
                description: `Room ${roomNumber} - Night of ${businessDate}`,
                unit_price: roomRate,
                quantity: 1,
                total_price: roomRate,
                tax_amount: taxAmount,
                service_date: businessDate,
                reference_id: resRoom.id,
                reference_type: 'reservation_room',
              });

            if (chargeError) throw chargeError;

            chargesPosted++;
            totalRevenue += roomRate + taxAmount;
          }
        }
      }

      return { chargesPosted, totalRevenue };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['folios'] });
      queryClient.invalidateQueries({ queryKey: ['folio-items'] });
      refetchStats();
      toast({
        title: 'Room Charges Posted',
        description: `Posted ${data.chargesPosted} room charges totaling ৳${data.totalRevenue.toFixed(2)}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Posting Room Charges',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Complete night audit
  const completeAudit = useMutation({
    mutationFn: async (notes?: string) => {
      if (!currentProperty?.id || !tenant?.id || !currentAudit?.id) {
        throw new Error('No active audit to complete');
      }

      const stats = auditStats || {
        totalRooms: 0,
        occupiedRooms: 0,
        occupancyRate: 0,
        roomRevenue: 0,
        fbRevenue: 0,
        otherRevenue: 0,
        totalPayments: 0,
        adr: 0,
        revpar: 0,
        arrivalsToday: 0,
        departuresToday: 0,
        stayovers: 0,
        noShows: 0,
      };

      const { data, error } = await supabase
        .from('night_audits')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          rooms_charged: stats.occupiedRooms,
          total_room_revenue: stats.roomRevenue,
          total_fb_revenue: stats.fbRevenue,
          total_other_revenue: stats.otherRevenue,
          total_payments: stats.totalPayments,
          occupancy_rate: stats.occupancyRate,
          adr: stats.adr,
          revpar: stats.revpar,
          report_data: {
            arrivals: stats.arrivalsToday,
            departures: stats.departuresToday,
            stayovers: stats.stayovers,
            noShows: stats.noShows,
            totalRooms: stats.totalRooms,
            vacantRooms: stats.totalRooms - stats.occupiedRooms,
          },
          notes,
        })
        .eq('id', currentAudit.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['night-audit-current'] });
      queryClient.invalidateQueries({ queryKey: ['night-audits'] });
      toast({
        title: 'Night Audit Completed',
        description: 'The business day has been closed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Completing Audit',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Export CSV function
  const exportCSV = (type: 'summary' | 'detailed' | 'history') => {
    const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const businessDate = getBusinessDate();

    if (type === 'history') {
      const headers = ['Date', 'Status', 'Occupancy %', 'Room Revenue', 'F&B Revenue', 'Other Revenue', 'Total Revenue', 'ADR', 'RevPAR'];
      const rows = auditHistory.map(a => [
        a.business_date,
        a.status,
        a.occupancy_rate.toFixed(1),
        a.total_room_revenue.toFixed(2),
        a.total_fb_revenue.toFixed(2),
        a.total_other_revenue.toFixed(2),
        (a.total_room_revenue + a.total_fb_revenue + a.total_other_revenue).toFixed(2),
        a.adr.toFixed(2),
        a.revpar.toFixed(2),
      ]);
      downloadCSV(`night-audit-history-${format(new Date(), 'yyyy-MM-dd')}.csv`, headers, rows);
    } else if (type === 'summary') {
      const stats = auditStats;
      if (!stats) return;

      const headers = ['Metric', 'Value'];
      const rows: [string, string | number][] = [
        ['Business Date', businessDate],
        ['Total Rooms', stats.totalRooms],
        ['Occupied Rooms', stats.occupiedRooms],
        ['Vacant Rooms', stats.vacantRooms],
        ['Occupancy Rate %', stats.occupancyRate.toFixed(1)],
        ['Arrivals', stats.arrivalsToday],
        ['Departures', stats.departuresToday],
        ['Stayovers', stats.stayovers],
        ['No-Shows', stats.noShows],
        ['Room Revenue', stats.roomRevenue.toFixed(2)],
        ['F&B Revenue', stats.fbRevenue.toFixed(2)],
        ['Other Revenue', stats.otherRevenue.toFixed(2)],
        ['Total Revenue', stats.totalRevenue.toFixed(2)],
        ['Total Payments', stats.totalPayments.toFixed(2)],
        ['ADR', stats.adr.toFixed(2)],
        ['RevPAR', stats.revpar.toFixed(2)],
      ];
      downloadCSV(`night-audit-summary-${businessDate}.csv`, headers, rows);
    } else if (type === 'detailed') {
      // Export rooms and guests
      const roomHeaders = ['Room', 'Floor', 'Type', 'Status', 'Guest', 'Phone', 'Rate', 'Balance'];
      const roomRows = roomDetails.map(r => [
        r.room_number,
        r.floor || '',
        r.room_type_name,
        r.status,
        r.guest_name || '',
        r.guest_phone || '',
        r.rate_per_night.toFixed(2),
        r.balance.toFixed(2),
      ]);

      const guestHeaders = ['Guest Name', 'Room', 'Phone', 'Email', 'Adults', 'Children', 'Check-in', 'Check-out'];
      const guestRows = guestDetails.map(g => [
        `${g.first_name} ${g.last_name}`,
        g.room_number,
        g.phone || '',
        g.email || '',
        g.adults,
        g.children,
        g.check_in_date,
        g.check_out_date,
      ]);

      // Combine into single file with sections
      const content = [
        '=== ROOM STATUS ===',
        roomHeaders.join(','),
        ...roomRows.map(row => row.map(cell => `"${cell}"`).join(',')),
        '',
        '=== GUEST LIST ===',
        guestHeaders.join(','),
        ...guestRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `night-audit-detailed-${businessDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: 'Export Complete',
      description: 'The CSV file has been downloaded.',
    });
  };

  // Get report data for PDF export
  const getReportData = () => {
    return {
      businessDate: getBusinessDate(),
      hotelName: tenant?.name || 'Hotel',
      hotelLogo: tenant?.logo_url || null,
      stats: auditStats || {
        totalRooms: 0,
        occupiedRooms: 0,
        vacantRooms: 0,
        occupancyRate: 0,
        roomRevenue: 0,
        fbRevenue: 0,
        otherRevenue: 0,
        totalRevenue: 0,
        totalPayments: 0,
        adr: 0,
        revpar: 0,
        arrivalsToday: 0,
        departuresToday: 0,
        stayovers: 0,
        noShows: 0,
      },
      rooms: roomDetails,
      guests: guestDetails,
      paymentsByMethod: paymentsByMethod || { cash: 0, credit_card: 0, debit_card: 0, bank_transfer: 0, other: 0 },
      revenueByCategory: revenueByCategory || {
        room: 0, food_beverage: 0, laundry: 0, minibar: 0, spa: 0,
        parking: 0, telephone: 0, internet: 0, miscellaneous: 0,
      },
      generatedAt: format(new Date(), 'MMM d, yyyy h:mm a'),
      generatedBy: profile?.full_name || profile?.username || 'System',
    };
  };

  return {
    // Data
    auditHistory,
    currentAudit,
    preAuditData,
    auditStats,
    businessDate: getBusinessDate(),
    
    // Detail data
    roomDetails,
    guestDetails,
    outstandingFolios,
    paymentsByMethod: paymentsByMethod || { cash: 0, credit_card: 0, debit_card: 0, bank_transfer: 0, other: 0 },
    revenueByCategory: revenueByCategory || {
      room: 0, food_beverage: 0, laundry: 0, minibar: 0, spa: 0,
      parking: 0, telephone: 0, internet: 0, miscellaneous: 0,
    },

    // Loading states
    isLoading: isLoadingHistory || isLoadingCurrent || isLoadingPreAudit || isLoadingStats,
    isLoadingHistory,
    isLoadingCurrent,
    isLoadingPreAudit,
    isLoadingStats,
    isLoadingDetails: isLoadingRoomDetails || isLoadingGuestDetails || isLoadingFolios || isLoadingPayments || isLoadingRevenue,

    // Actions
    startAudit,
    postRoomCharges,
    completeAudit,
    refetchPreAudit,
    refetchStats,
    
    // Export functions
    exportCSV,
    getReportData,
  };
}
