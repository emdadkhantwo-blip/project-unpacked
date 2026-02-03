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
          notes: string | null
          phone: string | null
          property_count: number | null
          room_count: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          current_software?: string | null
          email: string
          full_name: string
          hotel_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          property_count?: number | null
          room_count?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          current_software?: string | null
          email?: string
          full_name?: string
          hotel_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          property_count?: number | null
          room_count?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          property_id: string | null
          role: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          property_id?: string | null
          role?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
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
      tenants: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
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
