export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_applications: {
        Row: {
          contact_name: string | null
          created_at: string
          current_software: string | null
          email: string
          full_name: string
          hotel_name: string
          id: string
          logo_url: string | null
          notes: string | null
          password: string | null
          phone: string | null
          property_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          room_count: number | null
          status: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          current_software?: string | null
          email: string
          full_name: string
          hotel_name: string
          id?: string
          logo_url?: string | null
          notes?: string | null
          password?: string | null
          phone?: string | null
          property_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_count?: number | null
          status?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          current_software?: string | null
          email?: string
          full_name?: string
          hotel_name?: string
          id?: string
          logo_url?: string | null
          notes?: string | null
          password?: string | null
          phone?: string | null
          property_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_count?: number | null
          status?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          break_end: string | null
          break_start: string | null
          clock_in: string | null
          clock_out: string | null
          created_at: string
          date: string
          hours_worked: number | null
          id: string
          notes: string | null
          overtime_hours: number | null
          profile_id: string
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          profile_id: string
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          profile_id?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_accounts: {
        Row: {
          address: string | null
          code: string
          contact_person: string | null
          created_at: string
          credit_limit: number | null
          current_balance: number | null
          discount_percentage: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_terms: number | null
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          contact_person?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          discount_percentage?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          contact_person?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          discount_percentage?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_rates: {
        Row: {
          created_at: string
          date: string
          id: string
          is_closed: boolean | null
          min_stay: number | null
          notes: string | null
          property_id: string
          rate: number
          room_type_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_closed?: boolean | null
          min_stay?: number | null
          notes?: string | null
          property_id: string
          rate: number
          room_type_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_closed?: boolean | null
          min_stay?: number | null
          notes?: string | null
          property_id?: string
          rate?: number
          room_type_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_rates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_rates_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_rates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          feature_name: string
          id: string
          is_enabled: boolean
          tenant_id: string
        }
        Insert: {
          created_at?: string
          feature_name: string
          id?: string
          is_enabled?: boolean
          tenant_id: string
        }
        Update: {
          created_at?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      folio_items: {
        Row: {
          created_at: string
          description: string
          folio_id: string
          id: string
          is_posted: boolean | null
          item_type: Database["public"]["Enums"]["folio_item_type"]
          quantity: number | null
          service_date: string | null
          tax_amount: number | null
          tenant_id: string
          total_price: number
          unit_price: number
          updated_at: string
          void_reason: string | null
          voided: boolean | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          created_at?: string
          description: string
          folio_id: string
          id?: string
          is_posted?: boolean | null
          item_type: Database["public"]["Enums"]["folio_item_type"]
          quantity?: number | null
          service_date?: string | null
          tax_amount?: number | null
          tenant_id: string
          total_price: number
          unit_price: number
          updated_at?: string
          void_reason?: string | null
          voided?: boolean | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          folio_id?: string
          id?: string
          is_posted?: boolean | null
          item_type?: Database["public"]["Enums"]["folio_item_type"]
          quantity?: number | null
          service_date?: string | null
          tax_amount?: number | null
          tenant_id?: string
          total_price?: number
          unit_price?: number
          updated_at?: string
          void_reason?: string | null
          voided?: boolean | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folio_items_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folio_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      folios: {
        Row: {
          balance: number | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          folio_number: string
          guest_id: string | null
          id: string
          paid_amount: number | null
          property_id: string
          reservation_id: string | null
          service_charge: number | null
          status: Database["public"]["Enums"]["folio_status"] | null
          subtotal: number | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          balance?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          folio_number: string
          guest_id?: string | null
          id?: string
          paid_amount?: number | null
          property_id: string
          reservation_id?: string | null
          service_charge?: number | null
          status?: Database["public"]["Enums"]["folio_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          balance?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          folio_number?: string
          guest_id?: string | null
          id?: string
          paid_amount?: number | null
          property_id?: string
          reservation_id?: string | null
          service_charge?: number | null
          status?: Database["public"]["Enums"]["folio_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folios_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folios_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folios_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_corporate_accounts: {
        Row: {
          corporate_account_id: string
          created_at: string
          guest_id: string
          id: string
        }
        Insert: {
          corporate_account_id: string
          created_at?: string
          guest_id: string
          id?: string
        }
        Update: {
          corporate_account_id?: string
          created_at?: string
          guest_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_corporate_accounts_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_corporate_accounts_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_notes: {
        Row: {
          created_at: string
          created_by: string | null
          guest_id: string
          id: string
          note: string
          note_type: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          guest_id: string
          id?: string
          note: string
          note_type?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          guest_id?: string
          id?: string
          note?: string
          note_type?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_notes_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          address: string | null
          blacklist_reason: string | null
          city: string | null
          corporate_account_id: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          id: string
          id_number: string | null
          id_type: string | null
          is_blacklisted: boolean | null
          is_vip: boolean | null
          last_name: string
          nationality: string | null
          notes: string | null
          phone: string | null
          preferences: Json | null
          tenant_id: string
          total_revenue: number | null
          total_stays: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          blacklist_reason?: string | null
          city?: string | null
          corporate_account_id?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          is_blacklisted?: boolean | null
          is_vip?: boolean | null
          last_name: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          preferences?: Json | null
          tenant_id: string
          total_revenue?: number | null
          total_stays?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          blacklist_reason?: string | null
          city?: string | null
          corporate_account_id?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          is_blacklisted?: boolean | null
          is_vip?: boolean | null
          last_name?: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          preferences?: Json | null
          tenant_id?: string
          total_revenue?: number | null
          total_stays?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      housekeeping_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          notes: string | null
          priority: number | null
          property_id: string
          room_id: string | null
          scheduled_date: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          priority?: number | null
          property_id: string
          room_id?: string | null
          scheduled_date?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          priority?: number | null
          property_id?: string
          room_id?: string | null
          scheduled_date?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          days_count: number
          end_date: string
          id: string
          leave_type_id: string
          profile_id: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_count: number
          end_date: string
          id?: string
          leave_type_id: string
          profile_id: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_count?: number
          end_date?: string
          id?: string
          leave_type_id?: string
          profile_id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          code: string
          created_at: string
          days_per_year: number | null
          id: string
          is_active: boolean | null
          is_paid: boolean | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          days_per_year?: number | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          days_per_year?: number | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          priority: number | null
          property_id: string
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          room_id: string | null
          status: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: number | null
          property_id: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          room_id?: string | null
          status?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: number | null
          property_id?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          room_id?: string | null
          status?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tickets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      night_audits: {
        Row: {
          adr: number | null
          business_date: string
          checkins_count: number | null
          checkouts_count: number | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          discrepancies: Json | null
          fnb_revenue: number | null
          id: string
          no_shows_count: number | null
          notes: string | null
          occupancy_rate: number | null
          other_revenue: number | null
          property_id: string
          revpar: number | null
          room_revenue: number | null
          rooms_sold: number | null
          started_at: string | null
          status: string | null
          tenant_id: string
          total_revenue: number | null
          updated_at: string
        }
        Insert: {
          adr?: number | null
          business_date: string
          checkins_count?: number | null
          checkouts_count?: number | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          discrepancies?: Json | null
          fnb_revenue?: number | null
          id?: string
          no_shows_count?: number | null
          notes?: string | null
          occupancy_rate?: number | null
          other_revenue?: number | null
          property_id: string
          revpar?: number | null
          room_revenue?: number | null
          rooms_sold?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id: string
          total_revenue?: number | null
          updated_at?: string
        }
        Update: {
          adr?: number | null
          business_date?: string
          checkins_count?: number | null
          checkouts_count?: number | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          discrepancies?: Json | null
          fnb_revenue?: number | null
          id?: string
          no_shows_count?: number | null
          notes?: string | null
          occupancy_rate?: number | null
          other_revenue?: number | null
          property_id?: string
          revpar?: number | null
          room_revenue?: number | null
          rooms_sold?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string
          total_revenue?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "night_audits_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "night_audits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "night_audits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      overtime_records: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          date: string
          hours: number
          id: string
          profile_id: string
          rate_multiplier: number | null
          reason: string | null
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          date: string
          hours: number
          id?: string
          profile_id: string
          rate_multiplier?: number | null
          reason?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          date?: string
          hours?: number
          id?: string
          profile_id?: string
          rate_multiplier?: number | null
          reason?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "overtime_records_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overtime_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overtime_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          adjustment_type: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          inclusions: Json | null
          is_active: boolean | null
          name: string
          price_adjustment: number | null
          property_id: string
          tenant_id: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          adjustment_type?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          inclusions?: Json | null
          is_active?: boolean | null
          name: string
          price_adjustment?: number | null
          property_id: string
          tenant_id: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          adjustment_type?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          inclusions?: Json | null
          is_active?: boolean | null
          name?: string
          price_adjustment?: number | null
          property_id?: string
          tenant_id?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          corporate_account_id: string | null
          created_at: string
          folio_id: string
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference_number: string | null
          tenant_id: string
          updated_at: string
          void_reason: string | null
          voided: boolean | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          corporate_account_id?: string | null
          created_at?: string
          folio_id: string
          id?: string
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference_number?: string | null
          tenant_id: string
          updated_at?: string
          void_reason?: string | null
          voided?: boolean | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          corporate_account_id?: string | null
          created_at?: string
          folio_id?: string
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference_number?: string | null
          tenant_id?: string
          updated_at?: string
          void_reason?: string | null
          voided?: boolean | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          base_salary: number | null
          bonuses: number | null
          created_at: string
          deductions: number | null
          id: string
          net_salary: number | null
          notes: string | null
          overtime_pay: number | null
          paid_at: string | null
          period_end: string
          period_start: string
          profile_id: string
          status: string | null
          tax_amount: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          base_salary?: number | null
          bonuses?: number | null
          created_at?: string
          deductions?: number | null
          id?: string
          net_salary?: number | null
          notes?: string | null
          overtime_pay?: number | null
          paid_at?: string | null
          period_end: string
          period_start: string
          profile_id: string
          status?: string | null
          tax_amount?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          base_salary?: number | null
          bonuses?: number | null
          created_at?: string
          deductions?: number | null
          id?: string
          net_salary?: number | null
          notes?: string | null
          overtime_pay?: number | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          profile_id?: string
          status?: string | null
          tax_amount?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          areas_for_improvement: string | null
          comments: string | null
          created_at: string
          goals: string | null
          id: string
          overall_rating: number | null
          profile_id: string
          review_period_end: string | null
          review_period_start: string | null
          reviewer_id: string | null
          status: string | null
          strengths: string | null
          submitted_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          areas_for_improvement?: string | null
          comments?: string | null
          created_at?: string
          goals?: string | null
          id?: string
          overall_rating?: number | null
          profile_id: string
          review_period_end?: string | null
          review_period_start?: string | null
          reviewer_id?: string | null
          status?: string | null
          strengths?: string | null
          submitted_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          areas_for_improvement?: string | null
          comments?: string | null
          created_at?: string
          goals?: string | null
          id?: string
          overall_rating?: number | null
          profile_id?: string
          review_period_end?: string | null
          review_period_start?: string | null
          reviewer_id?: string | null
          status?: string | null
          strengths?: string | null
          submitted_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          max_properties: number
          max_rooms: number
          max_staff: number
          name: string
          plan_type: string
          price_monthly: number
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          max_properties?: number
          max_rooms?: number
          max_staff?: number
          name: string
          plan_type: string
          price_monthly?: number
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          max_properties?: number
          max_rooms?: number
          max_staff?: number
          name?: string
          plan_type?: string
          price_monthly?: number
        }
        Relationships: []
      }
      pos_menu_categories: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          outlet_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          outlet_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          outlet_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_menu_categories_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "pos_outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_menu_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_menu_items: {
        Row: {
          category_id: string | null
          code: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_available: boolean | null
          modifiers: Json | null
          name: string
          outlet_id: string
          price: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          code?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          modifiers?: Json | null
          name: string
          outlet_id: string
          price?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          code?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          modifiers?: Json | null
          name?: string
          outlet_id?: string
          price?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pos_menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_menu_items_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "pos_outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_menu_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string | null
          modifiers: Json | null
          name: string
          notes: string | null
          order_id: string
          prepared_at: string | null
          quantity: number
          sent_to_kitchen_at: string | null
          served_at: string | null
          status: string | null
          tenant_id: string
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          modifiers?: Json | null
          name: string
          notes?: string | null
          order_id: string
          prepared_at?: string | null
          quantity?: number
          sent_to_kitchen_at?: string | null
          served_at?: string | null
          status?: string | null
          tenant_id: string
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          modifiers?: Json | null
          name?: string
          notes?: string | null
          order_id?: string
          prepared_at?: string | null
          quantity?: number
          sent_to_kitchen_at?: string | null
          served_at?: string | null
          status?: string | null
          tenant_id?: string
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "pos_menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          discount_amount: number | null
          folio_id: string | null
          guest_id: string | null
          id: string
          kitchen_printed_at: string | null
          notes: string | null
          order_number: string
          order_type: string | null
          outlet_id: string
          payment_method: string | null
          payment_status: string | null
          served_by: string | null
          service_charge: number | null
          status: string | null
          subtotal: number | null
          table_id: string | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          folio_id?: string | null
          guest_id?: string | null
          id?: string
          kitchen_printed_at?: string | null
          notes?: string | null
          order_number: string
          order_type?: string | null
          outlet_id: string
          payment_method?: string | null
          payment_status?: string | null
          served_by?: string | null
          service_charge?: number | null
          status?: string | null
          subtotal?: number | null
          table_id?: string | null
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          folio_id?: string | null
          guest_id?: string | null
          id?: string
          kitchen_printed_at?: string | null
          notes?: string | null
          order_number?: string
          order_type?: string | null
          outlet_id?: string
          payment_method?: string | null
          payment_status?: string | null
          served_by?: string | null
          service_charge?: number | null
          status?: string | null
          subtotal?: number | null
          table_id?: string | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "pos_outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_served_by_fkey"
            columns: ["served_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "pos_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_outlets: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          property_id: string
          settings: Json | null
          tenant_id: string
          type: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          property_id: string
          settings?: Json | null
          tenant_id: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          property_id?: string
          settings?: Json | null
          tenant_id?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_outlets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_outlets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_tables: {
        Row: {
          capacity: number | null
          created_at: string
          current_order_id: string | null
          id: string
          is_active: boolean | null
          outlet_id: string
          position_x: number | null
          position_y: number | null
          status: string | null
          table_number: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          current_order_id?: string | null
          id?: string
          is_active?: boolean | null
          outlet_id: string
          position_x?: number | null
          position_y?: number | null
          status?: string | null
          table_number: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          current_order_id?: string | null
          id?: string
          is_active?: boolean | null
          outlet_id?: string
          position_x?: number | null
          position_y?: number | null
          status?: string | null
          table_number?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_tables_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "pos_outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_tables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_email: string | null
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          must_change_password: boolean | null
          phone: string | null
          property_id: string | null
          role: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          auth_email?: string | null
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          must_change_password?: boolean | null
          phone?: string | null
          property_id?: string | null
          role?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          auth_email?: string | null
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          must_change_password?: boolean | null
          phone?: string | null
          property_id?: string | null
          role?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          check_in_time: string | null
          check_out_time: string | null
          city: string | null
          code: string
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          service_charge_rate: number | null
          star_rating: number | null
          status: string | null
          tax_rate: number | null
          tenant_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          service_charge_rate?: number | null
          star_rating?: number | null
          status?: string | null
          tax_rate?: number | null
          tenant_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          service_charge_rate?: number | null
          star_rating?: number | null
          status?: string | null
          tax_rate?: number | null
          tenant_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      property_access: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_access_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_period_rates: {
        Row: {
          created_at: string
          id: string
          rate: number
          rate_period_id: string
          room_type_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rate: number
          rate_period_id: string
          room_type_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rate?: number
          rate_period_id?: string
          room_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_period_rates_rate_period_id_fkey"
            columns: ["rate_period_id"]
            isOneToOne: false
            referencedRelation: "rate_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_period_rates_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          min_stay: number | null
          name: string
          property_id: string
          rate_multiplier: number | null
          start_date: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          min_stay?: number | null
          name: string
          property_id: string
          rate_multiplier?: number | null
          start_date: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          min_stay?: number | null
          name?: string
          property_id?: string
          rate_multiplier?: number | null
          start_date?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_periods_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_sources: {
        Row: {
          code: string
          commission_rate: number | null
          contact_info: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          code: string
          commission_rate?: number | null
          contact_info?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          tenant_id: string
          type: string
          updated_at?: string
        }
        Update: {
          code?: string
          commission_rate?: number | null
          contact_info?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_sources_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_rooms: {
        Row: {
          adults: number | null
          children: number | null
          created_at: string
          id: string
          rate_per_night: number
          reservation_id: string
          room_id: string | null
          room_type_id: string
          updated_at: string
        }
        Insert: {
          adults?: number | null
          children?: number | null
          created_at?: string
          id?: string
          rate_per_night?: number
          reservation_id: string
          room_id?: string | null
          room_type_id: string
          updated_at?: string
        }
        Update: {
          adults?: number | null
          children?: number | null
          created_at?: string
          id?: string
          rate_per_night?: number
          reservation_id?: string
          room_id?: string | null
          room_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_rooms_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          actual_check_in: string | null
          actual_check_out: string | null
          adults: number | null
          check_in_date: string
          check_out_date: string
          children: number | null
          confirmation_number: string
          created_at: string
          created_by: string | null
          guest_id: string
          id: string
          notes: string | null
          property_id: string
          source: string | null
          special_requests: string | null
          status: Database["public"]["Enums"]["reservation_status"] | null
          tenant_id: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          actual_check_in?: string | null
          actual_check_out?: string | null
          adults?: number | null
          check_in_date: string
          check_out_date: string
          children?: number | null
          confirmation_number: string
          created_at?: string
          created_by?: string | null
          guest_id: string
          id?: string
          notes?: string | null
          property_id: string
          source?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          tenant_id: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          actual_check_in?: string | null
          actual_check_out?: string | null
          adults?: number | null
          check_in_date?: string
          check_out_date?: string
          children?: number | null
          confirmation_number?: string
          created_at?: string
          created_by?: string | null
          guest_id?: string
          id?: string
          notes?: string | null
          property_id?: string
          source?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          tenant_id?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          amenities: string[] | null
          base_rate: number
          code: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          max_adults: number | null
          max_children: number | null
          max_occupancy: number
          name: string
          property_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          base_rate?: number
          code: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          max_adults?: number | null
          max_children?: number | null
          max_occupancy?: number
          name: string
          property_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          base_rate?: number
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          max_adults?: number | null
          max_children?: number | null
          max_occupancy?: number
          name?: string
          property_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_types_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          floor: string | null
          housekeeping_status:
            | Database["public"]["Enums"]["housekeeping_status"]
            | null
          id: string
          is_accessible: boolean | null
          is_active: boolean | null
          is_smoking: boolean | null
          notes: string | null
          property_id: string
          room_number: string
          room_type_id: string
          status: Database["public"]["Enums"]["room_status"] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          floor?: string | null
          housekeeping_status?:
            | Database["public"]["Enums"]["housekeeping_status"]
            | null
          id?: string
          is_accessible?: boolean | null
          is_active?: boolean | null
          is_smoking?: boolean | null
          notes?: string | null
          property_id: string
          room_number: string
          room_type_id: string
          status?: Database["public"]["Enums"]["room_status"] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          floor?: string | null
          housekeeping_status?:
            | Database["public"]["Enums"]["housekeeping_status"]
            | null
          id?: string
          is_accessible?: boolean | null
          is_active?: boolean | null
          is_smoking?: boolean | null
          notes?: string | null
          property_id?: string
          room_number?: string
          room_type_id?: string
          status?: Database["public"]["Enums"]["room_status"] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_assignments: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          profile_id: string
          shift_id: string
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          profile_id: string
          shift_id: string
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          profile_id?: string
          shift_id?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          break_minutes: number | null
          color: string | null
          created_at: string
          end_time: string
          id: string
          is_active: boolean | null
          name: string
          property_id: string | null
          start_time: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          break_minutes?: number | null
          color?: string | null
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean | null
          name: string
          property_id?: string | null
          start_time: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          break_minutes?: number | null
          color?: string | null
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          name?: string
          property_id?: string | null
          start_time?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          plan_id: string
          started_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_configurations: {
        Row: {
          applies_to: Json | null
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          is_inclusive: boolean | null
          name: string
          priority: number | null
          property_id: string | null
          rate: number
          tenant_id: string
          type: string | null
          updated_at: string
        }
        Insert: {
          applies_to?: Json | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_inclusive?: boolean | null
          name: string
          priority?: number | null
          property_id?: string | null
          rate: number
          tenant_id: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          applies_to?: Json | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_inclusive?: boolean | null
          name?: string
          priority?: number | null
          property_id?: string | null
          rate?: number
          tenant_id?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_configurations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_configurations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_exemptions: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reason: string | null
          tax_id: string
          tenant_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reason?: string | null
          tax_id: string
          tenant_id: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string | null
          tax_id?: string
          tenant_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_exemptions_tax_id_fkey"
            columns: ["tax_id"]
            isOneToOne: false
            referencedRelation: "tax_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_exemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
          status: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          status?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          status?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      website_configurations: {
        Row: {
          contact_info: Json | null
          created_at: string
          custom_domain: string | null
          hero_image_url: string | null
          id: string
          is_published: boolean | null
          logo_url: string | null
          meta_description: string | null
          meta_title: string | null
          primary_color: string | null
          property_id: string
          secondary_color: string | null
          sections: Json | null
          social_links: Json | null
          subdomain: string | null
          template_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string
          custom_domain?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          primary_color?: string | null
          property_id: string
          secondary_color?: string | null
          sections?: Json | null
          social_links?: Json | null
          subdomain?: string | null
          template_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          contact_info?: Json | null
          created_at?: string
          custom_domain?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          primary_color?: string | null
          property_id?: string
          secondary_color?: string | null
          sections?: Json | null
          social_links?: Json | null
          subdomain?: string | null
          template_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_configurations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_configurations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      website_gallery: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          tenant_id: string
          website_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          tenant_id: string
          website_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          tenant_id?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_gallery_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_gallery_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "website_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          responded_at: string | null
          status: string | null
          tenant_id: string
          website_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          responded_at?: string | null
          status?: string | null
          tenant_id: string
          website_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          responded_at?: string | null
          status?: string | null
          tenant_id?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_inquiries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_inquiries_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "website_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_confirmation_number: { Args: never; Returns: string }
      generate_folio_number: {
        Args: { property_code: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "owner"
        | "manager"
        | "front_desk"
        | "housekeeping"
        | "maintenance"
        | "kitchen"
        | "waiter"
        | "pos"
        | "superadmin"
      folio_item_type:
        | "room_charge"
        | "food_beverage"
        | "laundry"
        | "minibar"
        | "spa"
        | "parking"
        | "telephone"
        | "internet"
        | "miscellaneous"
        | "adjustment"
        | "discount"
        | "tax"
        | "service_charge"
      folio_status: "open" | "closed"
      housekeeping_status: "clean" | "dirty" | "inspected" | "out_of_service"
      maintenance_priority: "low" | "medium" | "high" | "urgent"
      maintenance_status: "open" | "in_progress" | "resolved" | "closed"
      payment_method:
        | "cash"
        | "credit_card"
        | "debit_card"
        | "bank_transfer"
        | "mobile_payment"
        | "corporate_billing"
        | "other"
      reservation_status:
        | "confirmed"
        | "checked_in"
        | "checked_out"
        | "cancelled"
        | "no_show"
      room_status:
        | "vacant"
        | "occupied"
        | "dirty"
        | "maintenance"
        | "out_of_order"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "owner",
        "manager",
        "front_desk",
        "housekeeping",
        "maintenance",
        "kitchen",
        "waiter",
        "pos",
        "superadmin",
      ],
      folio_item_type: [
        "room_charge",
        "food_beverage",
        "laundry",
        "minibar",
        "spa",
        "parking",
        "telephone",
        "internet",
        "miscellaneous",
        "adjustment",
        "discount",
        "tax",
        "service_charge",
      ],
      folio_status: ["open", "closed"],
      housekeeping_status: ["clean", "dirty", "inspected", "out_of_service"],
      maintenance_priority: ["low", "medium", "high", "urgent"],
      maintenance_status: ["open", "in_progress", "resolved", "closed"],
      payment_method: [
        "cash",
        "credit_card",
        "debit_card",
        "bank_transfer",
        "mobile_payment",
        "corporate_billing",
        "other",
      ],
      reservation_status: [
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "no_show",
      ],
      room_status: [
        "vacant",
        "occupied",
        "dirty",
        "maintenance",
        "out_of_order",
      ],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
    },
  },
} as const
