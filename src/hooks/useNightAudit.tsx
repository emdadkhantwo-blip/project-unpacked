import { useState, useCallback } from "react";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import type { RoomDetail } from "@/components/night-audit/NightAuditRoomList";
import type { GuestDetail } from "@/components/night-audit/NightAuditGuestList";
import type { OutstandingFolio } from "@/components/night-audit/NightAuditOutstandingFolios";
import type { PaymentsByMethod, RevenueByCategory } from "@/components/night-audit/NightAuditRevenueBreakdown";

export interface NightAudit {
  id: string;
  tenant_id: string;
  property_id: string;
  business_date: string;
  status: "pending" | "in_progress" | "completed" | "failed";
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

// Mock implementation since night_audits and pos_orders tables don't exist
export function useNightAudit() {
  const { currentProperty, tenant } = useTenant();
  const { user, profile } = useAuth();

  const getBusinessDate = () => {
    const now = new Date();
    if (now.getHours() < 6) {
      return format(subDays(now, 1), "yyyy-MM-dd");
    }
    return format(now, "yyyy-MM-dd");
  };

  const [auditHistory] = useState<NightAudit[]>([]);
  const [currentAudit] = useState<NightAudit | null>(null);
  const [isLoadingHistory] = useState(false);
  const [isLoadingCurrent] = useState(false);

  const preAuditData: PreAuditChecklist = {
    allReservationsCheckedIn: true,
    noShowsMarked: true,
    posOrdersPosted: true,
    pendingPaymentsRecorded: true,
    housekeepingComplete: true,
  };
  const [isLoadingPreAudit] = useState(false);
  const refetchPreAudit = useCallback(async () => {}, []);

  const auditStats: AuditStatistics = {
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
  const [isLoadingStats] = useState(false);
  const refetchStats = useCallback(async () => {}, []);

  const [roomDetails] = useState<RoomDetail[]>([]);
  const [isLoadingRoomDetails] = useState(false);

  const [guestDetails] = useState<GuestDetail[]>([]);
  const [isLoadingGuestDetails] = useState(false);

  const [outstandingFolios] = useState<OutstandingFolio[]>([]);
  const [isLoadingFolios] = useState(false);

  const paymentsByMethod: PaymentsByMethod = {
    cash: 0,
    credit_card: 0,
    debit_card: 0,
    bank_transfer: 0,
    other: 0,
  };
  const [isLoadingPayments] = useState(false);

  const revenueByCategory: RevenueByCategory = {
    room: 0,
    food_beverage: 0,
    laundry: 0,
    minibar: 0,
    spa: 0,
    parking: 0,
    telephone: 0,
    internet: 0,
    miscellaneous: 0,
  };
  const [isLoadingRevenue] = useState(false);

  // Mock mutations
  const startAuditMutation = {
    mutateAsync: async () => {
      toast({ title: "Night audit started (mock)", description: "night_audits table not available." });
    },
    isPending: false,
  };

  const completeAuditMutation = {
    mutateAsync: async () => {
      toast({ title: "Night audit completed (mock)" });
    },
    isPending: false,
  };

  const postRoomChargesMutation = {
    mutateAsync: async () => {
      toast({ title: "Room charges posted (mock)" });
      return 0;
    },
    isPending: false,
  };

  const markNoShowsMutation = {
    mutateAsync: async () => {
      toast({ title: "No-shows marked (mock)" });
      return 0;
    },
    isPending: false,
  };

  const updateAuditNotesMutation = {
    mutateAsync: async (_: string) => {
      toast({ title: "Notes updated (mock)" });
    },
    isPending: false,
  };

  return {
    // Business date
    businessDate: getBusinessDate(),

    // Audit data
    currentAudit,
    auditHistory,
    isLoadingHistory,
    isLoadingCurrent,

    // Pre-audit checklist
    preAuditData,
    isLoadingPreAudit,
    refetchPreAudit,

    // Statistics
    auditStats,
    isLoadingStats,
    refetchStats,

    // Detailed data
    roomDetails,
    isLoadingRoomDetails,
    guestDetails,
    isLoadingGuestDetails,
    outstandingFolios,
    isLoadingFolios,
    paymentsByMethod,
    isLoadingPayments,
    revenueByCategory,
    isLoadingRevenue,

    // Overall loading state
    isLoading:
      isLoadingHistory ||
      isLoadingCurrent ||
      isLoadingPreAudit ||
      isLoadingStats ||
      isLoadingRoomDetails ||
      isLoadingGuestDetails ||
      isLoadingFolios ||
      isLoadingPayments ||
      isLoadingRevenue,

    // Actions
    startAudit: startAuditMutation.mutateAsync,
    isStartingAudit: startAuditMutation.isPending,

    completeAudit: completeAuditMutation.mutateAsync,
    isCompletingAudit: completeAuditMutation.isPending,

    postRoomCharges: postRoomChargesMutation.mutateAsync,
    isPostingCharges: postRoomChargesMutation.isPending,

    markNoShows: markNoShowsMutation.mutateAsync,
    isMarkingNoShows: markNoShowsMutation.isPending,

    updateAuditNotes: updateAuditNotesMutation.mutateAsync,
    isUpdatingNotes: updateAuditNotesMutation.isPending,
  };
}
