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
          created_at: string
          email: string
          full_name: string
          hotel_name: string
          id: string
          logo_url: string | null
          password: string
          phone: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["admin_application_status"]
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          hotel_name: string
          id?: string
          logo_url?: string | null
          password: string
          phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["admin_application_status"]
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          hotel_name?: string
          id?: string
          logo_url?: string | null
          password?: string
          phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["admin_application_status"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      biometric_credentials: {
        Row: {
          created_at: string | null
          credential_id: string
          device_name: string | null
          id: string
          profile_id: string
          public_key: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          credential_id: string
          device_name?: string | null
          id?: string
          profile_id: string
          public_key: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          credential_id?: string
          device_name?: string | null
          id?: string
          profile_id?: string
          public_key?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "biometric_credentials_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biometric_credentials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
          tenant_id: string
          tool_calls: Json | null
          tool_results: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id: string
          tenant_id: string
          tool_calls?: Json | null
          tool_results?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
          tenant_id?: string
          tool_calls?: Json | null
          tool_results?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["contact_submission_status"]
          website_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_submission_status"]
          website_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_submission_status"]
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "website_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_accounts: {
        Row: {
          account_code: string
          billing_address: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          credit_limit: number | null
          current_balance: number
          discount_percentage: number | null
          id: string
          is_active: boolean | null
          notes: string | null
          payment_terms: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          account_code: string
          billing_address?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          payment_terms?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          account_code?: string
          billing_address?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          payment_terms?: string | null
          tenant_id?: string
          updated_at?: string | null
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
          calculated_rate: number
          created_at: string
          date: string
          id: string
          is_manual_override: boolean
          property_id: string
          rate_period_id: string | null
          room_type_id: string
          tenant_id: string
        }
        Insert: {
          calculated_rate: number
          created_at?: string
          date: string
          id?: string
          is_manual_override?: boolean
          property_id: string
          rate_period_id?: string | null
          room_type_id: string
          tenant_id: string
        }
        Update: {
          calculated_rate?: number
          created_at?: string
          date?: string
          id?: string
          is_manual_override?: boolean
          property_id?: string
          rate_period_id?: string | null
          room_type_id?: string
          tenant_id?: string
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
            foreignKeyName: "daily_rates_rate_period_id_fkey"
            columns: ["rate_period_id"]
            isOneToOne: false
            referencedRelation: "rate_periods"
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
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_name: string
          id?: string
          is_enabled?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean
          tenant_id?: string
          updated_at?: string
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
          is_posted: boolean
          item_type: Database["public"]["Enums"]["folio_item_type"]
          posted_by: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          service_date: string
          tax_amount: number
          tax_breakdown: Json | null
          tenant_id: string
          total_price: number
          unit_price: number
          void_reason: string | null
          voided: boolean
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          created_at?: string
          description: string
          folio_id: string
          id?: string
          is_posted?: boolean
          item_type: Database["public"]["Enums"]["folio_item_type"]
          posted_by?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          service_date?: string
          tax_amount?: number
          tax_breakdown?: Json | null
          tenant_id: string
          total_price: number
          unit_price: number
          void_reason?: string | null
          voided?: boolean
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          folio_id?: string
          id?: string
          is_posted?: boolean
          item_type?: Database["public"]["Enums"]["folio_item_type"]
          posted_by?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          service_date?: string
          tax_amount?: number
          tax_breakdown?: Json | null
          tenant_id?: string
          total_price?: number
          unit_price?: number
          void_reason?: string | null
          voided?: boolean
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
          balance: number
          closed_at: string | null
          closed_by: string | null
          created_at: string
          folio_number: string
          guest_id: string
          id: string
          paid_amount: number
          property_id: string
          reservation_id: string | null
          service_charge: number
          status: string
          subtotal: number
          tax_amount: number
          tenant_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          balance?: number
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          folio_number: string
          guest_id: string
          id?: string
          paid_amount?: number
          property_id: string
          reservation_id?: string | null
          service_charge?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          tenant_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          folio_number?: string
          guest_id?: string
          id?: string
          paid_amount?: number
          property_id?: string
          reservation_id?: string | null
          service_charge?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          tenant_id?: string
          total_amount?: number
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
          is_primary: boolean
          tenant_id: string
        }
        Insert: {
          corporate_account_id: string
          created_at?: string
          guest_id: string
          id?: string
          is_primary?: boolean
          tenant_id: string
        }
        Update: {
          corporate_account_id?: string
          created_at?: string
          guest_id?: string
          id?: string
          is_primary?: boolean
          tenant_id?: string
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
          {
            foreignKeyName: "guest_corporate_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          guest_id: string
          id: string
          is_pinned: boolean | null
          note_type: string
          tenant_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          guest_id: string
          id?: string
          is_pinned?: boolean | null
          note_type?: string
          tenant_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          guest_id?: string
          id?: string
          is_pinned?: boolean | null
          note_type?: string
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
          is_blacklisted: boolean
          is_vip: boolean
          last_name: string
          nationality: string | null
          notes: string | null
          phone: string | null
          preferences: Json | null
          tenant_id: string
          total_revenue: number
          total_stays: number
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
          is_blacklisted?: boolean
          is_vip?: boolean
          last_name: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          preferences?: Json | null
          tenant_id: string
          total_revenue?: number
          total_stays?: number
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
          is_blacklisted?: boolean
          is_vip?: boolean
          last_name?: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          preferences?: Json | null
          tenant_id?: string
          total_revenue?: number
          total_stays?: number
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
          created_at: string
          id: string
          notes: string | null
          priority: number
          property_id: string
          room_id: string
          started_at: string | null
          status: string
          task_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          priority?: number
          property_id: string
          room_id: string
          started_at?: string | null
          status?: string
          task_type?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          priority?: number
          property_id?: string
          room_id?: string
          started_at?: string | null
          status?: string
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
      hr_attendance: {
        Row: {
          break_end: string | null
          break_start: string | null
          clock_in: string | null
          clock_out: string | null
          created_at: string
          date: string
          id: string
          ip_address: string | null
          is_early_departure: boolean | null
          is_late: boolean | null
          notes: string | null
          profile_id: string
          tenant_id: string
          worked_hours: number | null
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          id?: string
          ip_address?: string | null
          is_early_departure?: boolean | null
          is_late?: boolean | null
          notes?: string | null
          profile_id: string
          tenant_id: string
          worked_hours?: number | null
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          id?: string
          ip_address?: string | null
          is_early_departure?: boolean | null
          is_late?: boolean | null
          notes?: string | null
          profile_id?: string
          tenant_id?: string
          worked_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_attendance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_attendance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_departments: {
        Row: {
          code: string
          created_at: string
          id: string
          manager_id: string | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          manager_id?: string | null
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          manager_id?: string | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_documents: {
        Row: {
          created_at: string
          document_type: string
          expiry_date: string | null
          file_url: string
          id: string
          name: string
          notes: string | null
          profile_id: string
          tenant_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          expiry_date?: string | null
          file_url: string
          id?: string
          name: string
          notes?: string | null
          profile_id: string
          tenant_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          expiry_date?: string | null
          file_url?: string
          id?: string
          name?: string
          notes?: string | null
          profile_id?: string
          tenant_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leave_balances: {
        Row: {
          created_at: string
          id: string
          leave_type_id: string
          profile_id: string
          remaining_days: number | null
          tenant_id: string
          total_days: number | null
          used_days: number | null
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          leave_type_id: string
          profile_id: string
          remaining_days?: number | null
          tenant_id: string
          total_days?: number | null
          used_days?: number | null
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          leave_type_id?: string
          profile_id?: string
          remaining_days?: number | null
          tenant_id?: string
          total_days?: number | null
          used_days?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "hr_leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_balances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_balances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leave_requests: {
        Row: {
          created_at: string
          days: number
          end_date: string
          id: string
          leave_type_id: string
          notes: string | null
          profile_id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["hr_leave_status"] | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          days: number
          end_date: string
          id?: string
          leave_type_id: string
          notes?: string | null
          profile_id: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["hr_leave_status"] | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          days?: number
          end_date?: string
          id?: string
          leave_type_id?: string
          notes?: string | null
          profile_id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["hr_leave_status"] | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "hr_leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leave_types: {
        Row: {
          code: string
          color: string | null
          created_at: string
          days_per_year: number | null
          id: string
          is_active: boolean | null
          is_paid: boolean | null
          name: string
          tenant_id: string
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          days_per_year?: number | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          name: string
          tenant_id: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          days_per_year?: number | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_leave_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_overtime_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          date: string
          hours: number
          id: string
          payroll_entry_id: string | null
          profile_id: string
          rate_multiplier: number | null
          status: Database["public"]["Enums"]["hr_overtime_status"] | null
          tenant_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          date: string
          hours: number
          id?: string
          payroll_entry_id?: string | null
          profile_id: string
          rate_multiplier?: number | null
          status?: Database["public"]["Enums"]["hr_overtime_status"] | null
          tenant_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          date?: string
          hours?: number
          id?: string
          payroll_entry_id?: string | null
          profile_id?: string
          rate_multiplier?: number | null
          status?: Database["public"]["Enums"]["hr_overtime_status"] | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_overtime_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_overtime_entries_payroll_entry_id_fkey"
            columns: ["payroll_entry_id"]
            isOneToOne: false
            referencedRelation: "hr_payroll_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_overtime_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_overtime_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_payroll_entries: {
        Row: {
          allowances: Json | null
          attendance_days: number | null
          basic_salary: number | null
          created_at: string
          deductions: Json | null
          gross_pay: number | null
          id: string
          net_pay: number | null
          overtime_pay: number | null
          period_id: string
          profile_id: string
          tenant_id: string
        }
        Insert: {
          allowances?: Json | null
          attendance_days?: number | null
          basic_salary?: number | null
          created_at?: string
          deductions?: Json | null
          gross_pay?: number | null
          id?: string
          net_pay?: number | null
          overtime_pay?: number | null
          period_id: string
          profile_id: string
          tenant_id: string
        }
        Update: {
          allowances?: Json | null
          attendance_days?: number | null
          basic_salary?: number | null
          created_at?: string
          deductions?: Json | null
          gross_pay?: number | null
          id?: string
          net_pay?: number | null
          overtime_pay?: number | null
          period_id?: string
          profile_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_payroll_entries_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "hr_payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_payroll_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_payroll_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_payroll_periods: {
        Row: {
          created_at: string
          end_date: string
          finalized_at: string | null
          finalized_by: string | null
          id: string
          month: number
          property_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["hr_payroll_status"] | null
          tenant_id: string
          year: number
        }
        Insert: {
          created_at?: string
          end_date: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          month: number
          property_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["hr_payroll_status"] | null
          tenant_id: string
          year: number
        }
        Update: {
          created_at?: string
          end_date?: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          month?: number
          property_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["hr_payroll_status"] | null
          tenant_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_payroll_periods_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_payroll_periods_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_payroll_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_performance_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          note_type: Database["public"]["Enums"]["hr_performance_note_type"]
          profile_id: string
          rating: number | null
          tenant_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          note_type?: Database["public"]["Enums"]["hr_performance_note_type"]
          profile_id: string
          rating?: number | null
          tenant_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          note_type?: Database["public"]["Enums"]["hr_performance_note_type"]
          profile_id?: string
          rating?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_performance_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_performance_notes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_performance_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_permissions: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      hr_role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "hr_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_role_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_shift_assignments: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          profile_id: string
          shift_id: string
          status:
            | Database["public"]["Enums"]["hr_shift_assignment_status"]
            | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          profile_id: string
          shift_id: string
          status?:
            | Database["public"]["Enums"]["hr_shift_assignment_status"]
            | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          profile_id?: string
          shift_id?: string
          status?:
            | Database["public"]["Enums"]["hr_shift_assignment_status"]
            | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_shift_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_shift_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "hr_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_shift_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_shifts: {
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
        }
        Relationships: [
          {
            foreignKeyName: "hr_shifts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_shifts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_staff_profiles: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          created_at: string
          department_id: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employment_type: Database["public"]["Enums"]["hr_employment_type"]
          id: string
          join_date: string | null
          nid_number: string | null
          notes: string | null
          profile_id: string
          salary_amount: number | null
          salary_currency: string | null
          staff_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string
          department_id?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_type?: Database["public"]["Enums"]["hr_employment_type"]
          id?: string
          join_date?: string | null
          nid_number?: string | null
          notes?: string | null
          profile_id: string
          salary_amount?: number | null
          salary_currency?: string | null
          staff_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string
          department_id?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_type?: Database["public"]["Enums"]["hr_employment_type"]
          id?: string
          join_date?: string | null
          nid_number?: string | null
          notes?: string | null
          profile_id?: string
          salary_amount?: number | null
          salary_currency?: string | null
          staff_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_staff_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_staff_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_staff_profiles_tenant_id_fkey"
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
          created_at: string
          description: string | null
          id: string
          priority: number
          property_id: string
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          room_id: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: number
          property_id: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          room_id?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: number
          property_id?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          room_id?: string | null
          status?: string
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
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          occupancy_rate: number | null
          property_id: string
          report_data: Json | null
          revpar: number | null
          rooms_charged: number | null
          run_by: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["night_audit_status"]
          tenant_id: string
          total_fb_revenue: number | null
          total_other_revenue: number | null
          total_payments: number | null
          total_room_revenue: number | null
          updated_at: string
        }
        Insert: {
          adr?: number | null
          business_date: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          occupancy_rate?: number | null
          property_id: string
          report_data?: Json | null
          revpar?: number | null
          rooms_charged?: number | null
          run_by?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["night_audit_status"]
          tenant_id: string
          total_fb_revenue?: number | null
          total_other_revenue?: number | null
          total_payments?: number | null
          total_room_revenue?: number | null
          updated_at?: string
        }
        Update: {
          adr?: number | null
          business_date?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          occupancy_rate?: number | null
          property_id?: string
          report_data?: Json | null
          revpar?: number | null
          rooms_charged?: number | null
          run_by?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["night_audit_status"]
          tenant_id?: string
          total_fb_revenue?: number | null
          total_other_revenue?: number | null
          total_payments?: number | null
          total_room_revenue?: number | null
          updated_at?: string
        }
        Relationships: [
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
      packages: {
        Row: {
          adjustment_type: Database["public"]["Enums"]["package_adjustment_type"]
          applicable_room_types: string[] | null
          code: string
          created_at: string
          description: string | null
          id: string
          inclusions: Json | null
          is_active: boolean
          min_nights: number | null
          name: string
          price_adjustment: number
          property_id: string
          tenant_id: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          adjustment_type?: Database["public"]["Enums"]["package_adjustment_type"]
          applicable_room_types?: string[] | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          inclusions?: Json | null
          is_active?: boolean
          min_nights?: number | null
          name: string
          price_adjustment?: number
          property_id: string
          tenant_id: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          adjustment_type?: Database["public"]["Enums"]["package_adjustment_type"]
          applicable_room_types?: string[] | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          inclusions?: Json | null
          is_active?: boolean
          min_nights?: number | null
          name?: string
          price_adjustment?: number
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
          received_by: string | null
          reference_number: string | null
          tenant_id: string
          void_reason: string | null
          voided: boolean
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
          received_by?: string | null
          reference_number?: string | null
          tenant_id: string
          void_reason?: string | null
          voided?: boolean
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
          received_by?: string | null
          reference_number?: string | null
          tenant_id?: string
          void_reason?: string | null
          voided?: boolean
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
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
      plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          max_properties: number
          max_rooms: number
          max_staff: number
          name: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
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
          plan_type: Database["public"]["Enums"]["subscription_plan"]
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
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          price_monthly?: number
        }
        Relationships: []
      }
      pos_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          outlet_id: string
          sort_order: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          outlet_id: string
          sort_order?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          outlet_id?: string
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_categories_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "pos_outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_items: {
        Row: {
          category_id: string | null
          code: string
          cost: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_available: boolean
          name: string
          outlet_id: string
          prep_time_minutes: number | null
          price: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          code: string
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          name: string
          outlet_id: string
          prep_time_minutes?: number | null
          price: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          code?: string
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          name?: string
          outlet_id?: string
          prep_time_minutes?: number | null
          price?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pos_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_items_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "pos_outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_items_tenant_id_fkey"
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
          item_id: string | null
          item_name: string
          notes: string | null
          order_id: string
          prepared_at: string | null
          quantity: number
          served_at: string | null
          status: string
          tenant_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          item_name: string
          notes?: string | null
          order_id: string
          prepared_at?: string | null
          quantity?: number
          served_at?: string | null
          status?: string
          tenant_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          item_name?: string
          notes?: string | null
          order_id?: string
          prepared_at?: string | null
          quantity?: number
          served_at?: string | null
          status?: string
          tenant_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "pos_items"
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
          covers: number | null
          created_at: string
          created_by: string | null
          folio_id: string | null
          guest_id: string | null
          id: string
          notes: string | null
          order_number: string
          outlet_id: string
          posted_at: string | null
          posted_by: string | null
          room_id: string | null
          service_charge: number
          status: Database["public"]["Enums"]["pos_order_status"]
          subtotal: number
          table_number: string | null
          tax_amount: number
          tenant_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          covers?: number | null
          created_at?: string
          created_by?: string | null
          folio_id?: string | null
          guest_id?: string | null
          id?: string
          notes?: string | null
          order_number: string
          outlet_id: string
          posted_at?: string | null
          posted_by?: string | null
          room_id?: string | null
          service_charge?: number
          status?: Database["public"]["Enums"]["pos_order_status"]
          subtotal?: number
          table_number?: string | null
          tax_amount?: number
          tenant_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          covers?: number | null
          created_at?: string
          created_by?: string | null
          folio_id?: string | null
          guest_id?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          outlet_id?: string
          posted_at?: string | null
          posted_by?: string | null
          room_id?: string | null
          service_charge?: number
          status?: Database["public"]["Enums"]["pos_order_status"]
          subtotal?: number
          table_number?: string | null
          tax_amount?: number
          tenant_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
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
            foreignKeyName: "pos_orders_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
          is_active: boolean
          name: string
          property_id: string
          settings: Json | null
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          property_id: string
          settings?: Json | null
          tenant_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          property_id?: string
          settings?: Json | null
          tenant_id?: string
          type?: string
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
      profiles: {
        Row: {
          auth_email: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          must_change_password: boolean
          phone: string | null
          tenant_id: string | null
          updated_at: string
          username: string
        }
        Insert: {
          auth_email?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          last_login_at?: string | null
          must_change_password?: boolean
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          auth_email?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          must_change_password?: boolean
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
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
          city: string | null
          code: string
          country: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          service_charge_rate: number | null
          settings: Json | null
          status: Database["public"]["Enums"]["property_status"]
          tax_rate: number | null
          tenant_id: string
          timezone: string | null
          updated_at: string
          use_advanced_tax: boolean | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          service_charge_rate?: number | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["property_status"]
          tax_rate?: number | null
          tenant_id: string
          timezone?: string | null
          updated_at?: string
          use_advanced_tax?: boolean | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          service_charge_rate?: number | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["property_status"]
          tax_rate?: number | null
          tenant_id?: string
          timezone?: string | null
          updated_at?: string
          use_advanced_tax?: boolean | null
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
      rate_periods: {
        Row: {
          adjustment_type: Database["public"]["Enums"]["rate_adjustment_type"]
          amount: number
          created_at: string
          days_of_week: number[] | null
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          priority: number
          property_id: string
          rate_type: Database["public"]["Enums"]["rate_period_type"]
          room_type_id: string | null
          start_date: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          adjustment_type?: Database["public"]["Enums"]["rate_adjustment_type"]
          amount?: number
          created_at?: string
          days_of_week?: number[] | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          property_id: string
          rate_type?: Database["public"]["Enums"]["rate_period_type"]
          room_type_id?: string | null
          start_date?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          adjustment_type?: Database["public"]["Enums"]["rate_adjustment_type"]
          amount?: number
          created_at?: string
          days_of_week?: number[] | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          property_id?: string
          rate_type?: Database["public"]["Enums"]["rate_period_type"]
          room_type_id?: string | null
          start_date?: string | null
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
            foreignKeyName: "rate_periods_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
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
      references: {
        Row: {
          code: string
          created_at: string | null
          discount_percentage: number | null
          discount_type: string | null
          fixed_discount: number | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          property_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_percentage?: number | null
          discount_type?: string | null
          fixed_discount?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          property_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_percentage?: number | null
          discount_type?: string | null
          fixed_discount?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          property_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "references_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "references_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          payment_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string
          status: string
          tenant_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          payment_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          payment_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_guest_ids: {
        Row: {
          created_at: string
          document_type: string
          document_url: string
          file_name: string | null
          guest_number: number
          id: string
          reservation_id: string
          tenant_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string
          document_url: string
          file_name?: string | null
          guest_number?: number
          id?: string
          reservation_id: string
          tenant_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          document_url?: string
          file_name?: string | null
          guest_number?: number
          id?: string
          reservation_id?: string
          tenant_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservation_guest_ids_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_guest_ids_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_rooms: {
        Row: {
          adults: number
          children: number
          created_at: string
          id: string
          rate_per_night: number
          reservation_id: string
          room_id: string | null
          room_type_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          adults?: number
          children?: number
          created_at?: string
          id?: string
          rate_per_night: number
          reservation_id: string
          room_id?: string | null
          room_type_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          adults?: number
          children?: number
          created_at?: string
          id?: string
          rate_per_night?: number
          reservation_id?: string
          room_id?: string | null
          room_type_id?: string
          tenant_id?: string
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
          {
            foreignKeyName: "reservation_rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          actual_check_in: string | null
          actual_check_out: string | null
          adults: number
          check_in_date: string
          check_out_date: string
          children: number
          confirmation_number: string
          created_at: string
          created_by: string | null
          discount_amount: number | null
          guest_id: string
          id: string
          internal_notes: string | null
          paid_amount: number
          property_id: string
          reference_id: string | null
          source: Database["public"]["Enums"]["booking_source"]
          source_reference: string | null
          special_requests: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          tenant_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          actual_check_in?: string | null
          actual_check_out?: string | null
          adults?: number
          check_in_date: string
          check_out_date: string
          children?: number
          confirmation_number: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          guest_id: string
          id?: string
          internal_notes?: string | null
          paid_amount?: number
          property_id: string
          reference_id?: string | null
          source?: Database["public"]["Enums"]["booking_source"]
          source_reference?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          tenant_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          actual_check_in?: string | null
          actual_check_out?: string | null
          adults?: number
          check_in_date?: string
          check_out_date?: string
          children?: number
          confirmation_number?: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          guest_id?: string
          id?: string
          internal_notes?: string | null
          paid_amount?: number
          property_id?: string
          reference_id?: string | null
          source?: Database["public"]["Enums"]["booking_source"]
          source_reference?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          tenant_id?: string
          total_amount?: number
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
            foreignKeyName: "reservations_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "references"
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
          amenities: Json | null
          base_rate: number
          code: string
          created_at: string
          description: string | null
          id: string
          images: Json | null
          is_active: boolean
          max_occupancy: number
          name: string
          property_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amenities?: Json | null
          base_rate?: number
          code: string
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean
          max_occupancy?: number
          name: string
          property_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amenities?: Json | null
          base_rate?: number
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean
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
          id: string
          is_active: boolean
          notes: string | null
          property_id: string
          room_number: string
          room_type_id: string
          status: Database["public"]["Enums"]["room_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          floor?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          property_id: string
          room_number: string
          room_type_id: string
          status?: Database["public"]["Enums"]["room_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          floor?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          property_id?: string
          room_number?: string
          room_type_id?: string
          status?: Database["public"]["Enums"]["room_status"]
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
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
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
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_configurations: {
        Row: {
          applies_to: Database["public"]["Enums"]["tax_applies_to"][]
          calculation_order: number
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_compound: boolean
          is_inclusive: boolean
          name: string
          property_id: string
          rate: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          applies_to?: Database["public"]["Enums"]["tax_applies_to"][]
          calculation_order?: number
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_compound?: boolean
          is_inclusive?: boolean
          name: string
          property_id: string
          rate?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["tax_applies_to"][]
          calculation_order?: number
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_compound?: boolean
          is_inclusive?: boolean
          name?: string
          property_id?: string
          rate?: number
          tenant_id?: string
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
          entity_type: Database["public"]["Enums"]["tax_exemption_entity_type"]
          exemption_rate: number | null
          exemption_type: Database["public"]["Enums"]["tax_exemption_type"]
          id: string
          notes: string | null
          tax_configuration_id: string
          tenant_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["tax_exemption_entity_type"]
          exemption_rate?: number | null
          exemption_type?: Database["public"]["Enums"]["tax_exemption_type"]
          id?: string
          notes?: string | null
          tax_configuration_id: string
          tenant_id: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["tax_exemption_entity_type"]
          exemption_rate?: number | null
          exemption_type?: Database["public"]["Enums"]["tax_exemption_type"]
          id?: string
          notes?: string | null
          tax_configuration_id?: string
          tenant_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_exemptions_tax_configuration_id_fkey"
            columns: ["tax_configuration_id"]
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
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      website_configurations: {
        Row: {
          created_at: string
          custom_domain: string | null
          font_family: string | null
          hero_image_url: string | null
          id: string
          is_published: boolean
          logo_url: string | null
          primary_color: string | null
          property_id: string
          secondary_color: string | null
          sections: Json | null
          seo_description: string | null
          seo_title: string | null
          social_links: Json | null
          subdomain: string | null
          template_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          font_family?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          primary_color?: string | null
          property_id: string
          secondary_color?: string | null
          sections?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          social_links?: Json | null
          subdomain?: string | null
          template_id?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          font_family?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          primary_color?: string | null
          property_id?: string
          secondary_color?: string | null
          sections?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          social_links?: Json | null
          subdomain?: string | null
          template_id?: string
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
          category: string | null
          created_at: string
          id: string
          image_url: string
          sort_order: number
          website_id: string
        }
        Insert: {
          caption?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
          website_id: string
        }
        Update: {
          caption?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_gallery_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "website_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_pages: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          is_published: boolean
          slug: string
          title: string
          updated_at: string
          website_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          is_published?: boolean
          slug: string
          title: string
          updated_at?: string
          website_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          title?: string
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_pages_website_id_fkey"
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
      current_tenant_id: { Args: never; Returns: string }
      generate_confirmation_number: {
        Args: { property_code: string }
        Returns: string
      }
      generate_folio_number: {
        Args: { property_code: string }
        Returns: string
      }
      generate_pos_order_number: {
        Args: { outlet_code: string }
        Returns: string
      }
      get_auth_email_by_username: {
        Args: { lookup_username: string }
        Returns: string
      }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_property_access: {
        Args: { _property_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
      log_cross_tenant_attempt: {
        Args: {
          p_action_type?: string
          p_attempted_property_id?: string
          p_attempted_tenant_id: string
          p_details?: Json
          p_ip_address?: string
          p_user_agent?: string
          p_user_id: string
          p_user_tenant_id: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type?: string
          p_ip_address?: string
          p_new_values?: Json
          p_old_values?: Json
          p_tenant_id?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      admin_application_status: "pending" | "approved" | "rejected"
      app_role:
        | "superadmin"
        | "owner"
        | "manager"
        | "front_desk"
        | "accountant"
        | "housekeeping"
        | "maintenance"
        | "kitchen"
        | "waiter"
        | "night_auditor"
      booking_source:
        | "direct"
        | "phone"
        | "walk_in"
        | "website"
        | "ota_booking"
        | "ota_expedia"
        | "ota_agoda"
        | "corporate"
        | "travel_agent"
        | "other"
      contact_submission_status: "new" | "read" | "replied"
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
        | "tax"
        | "service_charge"
        | "discount"
        | "deposit"
      hr_employment_type: "full_time" | "part_time" | "contract"
      hr_leave_status: "pending" | "approved" | "rejected"
      hr_overtime_status: "pending" | "approved" | "rejected"
      hr_payroll_status: "draft" | "finalized"
      hr_performance_note_type: "feedback" | "warning" | "reward" | "kpi"
      hr_shift_assignment_status: "scheduled" | "completed" | "absent"
      night_audit_status: "pending" | "in_progress" | "completed" | "failed"
      package_adjustment_type: "fixed" | "percentage"
      payment_method:
        | "cash"
        | "credit_card"
        | "debit_card"
        | "bank_transfer"
        | "other"
      pos_order_status:
        | "pending"
        | "preparing"
        | "ready"
        | "served"
        | "cancelled"
        | "posted"
      property_status: "active" | "inactive" | "maintenance"
      rate_adjustment_type: "fixed" | "percentage" | "override"
      rate_period_type:
        | "weekend"
        | "seasonal"
        | "event"
        | "last_minute"
        | "holiday"
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
      subscription_plan: "starter" | "growth" | "pro"
      tax_applies_to: "room" | "food" | "service" | "other" | "all"
      tax_exemption_entity_type: "corporate_account" | "guest"
      tax_exemption_type: "full" | "partial"
      tenant_status: "active" | "suspended" | "pending"
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
      admin_application_status: ["pending", "approved", "rejected"],
      app_role: [
        "superadmin",
        "owner",
        "manager",
        "front_desk",
        "accountant",
        "housekeeping",
        "maintenance",
        "kitchen",
        "waiter",
        "night_auditor",
      ],
      booking_source: [
        "direct",
        "phone",
        "walk_in",
        "website",
        "ota_booking",
        "ota_expedia",
        "ota_agoda",
        "corporate",
        "travel_agent",
        "other",
      ],
      contact_submission_status: ["new", "read", "replied"],
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
        "tax",
        "service_charge",
        "discount",
        "deposit",
      ],
      hr_employment_type: ["full_time", "part_time", "contract"],
      hr_leave_status: ["pending", "approved", "rejected"],
      hr_overtime_status: ["pending", "approved", "rejected"],
      hr_payroll_status: ["draft", "finalized"],
      hr_performance_note_type: ["feedback", "warning", "reward", "kpi"],
      hr_shift_assignment_status: ["scheduled", "completed", "absent"],
      night_audit_status: ["pending", "in_progress", "completed", "failed"],
      package_adjustment_type: ["fixed", "percentage"],
      payment_method: [
        "cash",
        "credit_card",
        "debit_card",
        "bank_transfer",
        "other",
      ],
      pos_order_status: [
        "pending",
        "preparing",
        "ready",
        "served",
        "cancelled",
        "posted",
      ],
      property_status: ["active", "inactive", "maintenance"],
      rate_adjustment_type: ["fixed", "percentage", "override"],
      rate_period_type: [
        "weekend",
        "seasonal",
        "event",
        "last_minute",
        "holiday",
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
      subscription_plan: ["starter", "growth", "pro"],
      tax_applies_to: ["room", "food", "service", "other", "all"],
      tax_exemption_entity_type: ["corporate_account", "guest"],
      tax_exemption_type: ["full", "partial"],
      tenant_status: ["active", "suspended", "pending"],
    },
  },
} as const
