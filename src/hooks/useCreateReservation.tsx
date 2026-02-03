import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";

export interface CreateReservationInput {
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  source: string;
  special_requests?: string;
  internal_notes?: string;
  reference_id?: string;
  discount_amount?: number;
  rooms: Array<{
    room_type_id: string;
    room_id?: string;
    rate_per_night: number;
    adults: number;
    children: number;
  }>;
  idFiles?: Map<number, { file: File; type: string; fileName: string }>;
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant();
  const propertyId = currentProperty?.id;
  const tenantId = tenant?.id;

  return useMutation({
    mutationFn: async (input: CreateReservationInput) => {
      if (!propertyId || !tenantId) throw new Error("No property selected");

      // Get property code for confirmation number
      const { data: property, error: propError } = await supabase
        .from("properties")
        .select("code")
        .eq("id", propertyId)
        .single();

      if (propError) throw propError;

      // Generate confirmation number using the function
      const { data: confirmationNumber, error: confError } = await supabase
        .rpc("generate_confirmation_number");

      if (confError) throw confError;

      // Calculate total amount (after discount)
      const nights = Math.ceil(
        (new Date(input.check_out_date).getTime() - new Date(input.check_in_date).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const subtotal = input.rooms.reduce((sum, room) => sum + room.rate_per_night * nights, 0);
      const discountAmount = input.discount_amount || 0;
      const totalAmount = Math.max(0, subtotal - discountAmount);

      // Create reservation
      const { data: reservation, error: resError } = await supabase
        .from("reservations")
        .insert({
          tenant_id: tenantId,
          property_id: propertyId,
          guest_id: input.guest_id,
          confirmation_number: confirmationNumber,
          check_in_date: input.check_in_date,
          check_out_date: input.check_out_date,
          adults: input.adults,
          children: input.children,
          source: input.source as any,
          special_requests: input.special_requests || null,
          notes: input.internal_notes || null,
          total_amount: totalAmount,
          status: "confirmed",
        })
        .select()
        .single();

      if (resError) throw resError;

      // Create reservation rooms
      const reservationRooms = input.rooms.map((room) => ({
        reservation_id: reservation.id,
        room_type_id: room.room_type_id,
        room_id: room.room_id || null,
        rate_per_night: room.rate_per_night,
        adults: room.adults,
        children: room.children,
      }));

      const { error: rrError } = await supabase
        .from("reservation_rooms")
        .insert(reservationRooms);

      if (rrError) throw rrError;

      // Generate folio number
      const { data: folioNumber, error: folioNumError } = await supabase
        .rpc("generate_folio_number", { property_code: property.code });

      if (folioNumError) throw folioNumError;

      // Fetch property rates for tax and service charge
      const { data: propertyRates } = await supabase
        .from("properties")
        .select("tax_rate, service_charge_rate")
        .eq("id", propertyId)
        .single();

      const taxRate = propertyRates?.tax_rate || 0;
      const serviceChargeRate = propertyRates?.service_charge_rate || 0;

      // Calculate folio totals with tax and service charge applied to room cost
      const folioSubtotal = totalAmount; // Room cost after discount
      const folioTaxAmount = folioSubtotal * (taxRate / 100);
      const folioServiceCharge = folioSubtotal * (serviceChargeRate / 100);
      const folioTotalAmount = folioSubtotal + folioTaxAmount + folioServiceCharge;

      // Create folio with properly initialized financial fields
      const { error: folioError } = await supabase
        .from("folios")
        .insert({
          tenant_id: tenantId,
          property_id: propertyId,
          guest_id: input.guest_id,
          reservation_id: reservation.id,
          folio_number: folioNumber,
          subtotal: folioSubtotal,
          tax_amount: folioTaxAmount,
          service_charge: folioServiceCharge,
          total_amount: folioTotalAmount,
          balance: folioTotalAmount,
          status: "open",
        });

      if (folioError) throw folioError;

      // Skip guest ID document upload - reservation_guest_ids table doesn't exist yet
      // This feature will be implemented when the table is created

      return reservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["reservation-stats", propertyId] });
      toast.success("Reservation created successfully");
    },
    onError: (error) => {
      console.error("Error creating reservation:", error);
      toast.error("Failed to create reservation");
    },
  });
}
