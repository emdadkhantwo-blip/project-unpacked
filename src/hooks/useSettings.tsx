import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from './useTenant';
import { toast } from 'sonner';

export interface TenantSettings {
  // Branding
  branding?: {
    primary_color?: string;
    secondary_color?: string;
    logo_position?: 'left' | 'center';
    show_powered_by?: boolean;
  };
  // Notifications
  notifications?: {
    email_new_reservation?: boolean;
    email_check_in?: boolean;
    email_check_out?: boolean;
    email_payment_received?: boolean;
    email_daily_report?: boolean;
    daily_report_time?: string;
  };
  // System Defaults
  defaults?: {
    check_in_time?: string;
    check_out_time?: string;
    default_currency?: string;
    default_timezone?: string;
    date_format?: string;
    time_format?: '12h' | '24h';
    cancellation_policy_hours?: number;
    no_show_charge_percent?: number;
  };
}

export interface TenantBranding {
  name: string;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
}

const DEFAULT_SETTINGS: TenantSettings = {
  branding: {
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    logo_position: 'left',
    show_powered_by: true,
  },
  notifications: {
    email_new_reservation: true,
    email_check_in: true,
    email_check_out: true,
    email_payment_received: true,
    email_daily_report: false,
    daily_report_time: '08:00',
  },
  defaults: {
    check_in_time: '14:00',
    check_out_time: '11:00',
    default_currency: 'BDT',
    default_timezone: 'Asia/Dhaka',
    date_format: 'DD/MM/YYYY',
    time_format: '12h',
    cancellation_policy_hours: 24,
    no_show_charge_percent: 100,
  },
};

export function useSettings() {
  const { tenant, refreshTenant } = useTenant();
  const queryClient = useQueryClient();

  // Get settings with defaults merged
  const settings: TenantSettings = {
    branding: {
      ...DEFAULT_SETTINGS.branding,
      ...(tenant?.settings as TenantSettings)?.branding,
    },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(tenant?.settings as TenantSettings)?.notifications,
    },
    defaults: {
      ...DEFAULT_SETTINGS.defaults,
      ...(tenant?.settings as TenantSettings)?.defaults,
    },
  };

  // Get branding info
  const branding: TenantBranding = {
    name: tenant?.name || '',
    logo_url: tenant?.logo_url || null,
    contact_email: tenant?.contact_email || null,
    contact_phone: tenant?.contact_phone || null,
    address: null, // From tenant table if available
  };

  // Update tenant branding (name, logo, contact info)
  const updateBranding = useMutation({
    mutationFn: async (updates: Partial<TenantBranding>) => {
      if (!tenant?.id) throw new Error('No tenant found');

      console.log('Updating branding for tenant:', tenant.id, 'with:', updates);

      const { data, error } = await supabase
        .from('tenants')
        .update({
          name: updates.name,
          logo_url: updates.logo_url,
          contact_email: updates.contact_email,
          contact_phone: updates.contact_phone,
        })
        .eq('id', tenant.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // If no data returned, the RLS policy blocked the update
      if (!data) {
        throw new Error('Update was blocked by permissions. Please ensure you have owner access.');
      }

      console.log('Branding update successful:', data);
      return data;
    },
    onSuccess: () => {
      toast.success('Branding updated successfully');
      refreshTenant();
    },
    onError: (error) => {
      console.error('Error updating branding:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update branding');
    },
  });

  // Update tenant settings (stored in settings JSONB)
  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<TenantSettings>) => {
      if (!tenant?.id) throw new Error('No tenant found');

      const currentSettings = (tenant.settings as TenantSettings) || {};
      const newSettings = {
        ...currentSettings,
        ...updates,
      };

      console.log('Updating settings for tenant:', tenant.id, 'with:', newSettings);

      const { data, error } = await supabase
        .from('tenants')
        .update({ settings: newSettings as unknown as Record<string, never> })
        .eq('id', tenant.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // If no data returned, the RLS policy blocked the update
      if (!data) {
        throw new Error('Update was blocked by permissions. Please ensure you have owner access.');
      }

      console.log('Settings update successful:', data);
      return data;
    },
    onSuccess: () => {
      toast.success('Settings updated successfully');
      refreshTenant();
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update settings');
    },
  });

  // Update specific section of settings
  const updateBrandingSettings = (updates: Partial<TenantSettings['branding']>) => {
    return updateSettings.mutateAsync({
      branding: { ...settings.branding, ...updates },
    });
  };

  const updateNotificationSettings = (updates: Partial<TenantSettings['notifications']>) => {
    return updateSettings.mutateAsync({
      notifications: { ...settings.notifications, ...updates },
    });
  };

  const updateDefaultSettings = (updates: Partial<TenantSettings['defaults']>) => {
    return updateSettings.mutateAsync({
      defaults: { ...settings.defaults, ...updates },
    });
  };

  return {
    settings,
    branding,
    updateBranding,
    updateSettings,
    updateBrandingSettings,
    updateNotificationSettings,
    updateDefaultSettings,
    isUpdating: updateBranding.isPending || updateSettings.isPending,
  };
}
