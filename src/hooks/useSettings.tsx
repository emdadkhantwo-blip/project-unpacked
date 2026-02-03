import { useMutation } from '@tanstack/react-query';
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

  // Get settings with defaults merged
  const settings: TenantSettings = {
    branding: {
      ...DEFAULT_SETTINGS.branding,
      primary_color: tenant?.primary_color || DEFAULT_SETTINGS.branding?.primary_color,
      secondary_color: tenant?.secondary_color || DEFAULT_SETTINGS.branding?.secondary_color,
    },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
    },
    defaults: {
      ...DEFAULT_SETTINGS.defaults,
      default_currency: tenant?.currency || DEFAULT_SETTINGS.defaults?.default_currency,
      default_timezone: tenant?.timezone || DEFAULT_SETTINGS.defaults?.default_timezone,
    },
  };

  // Get branding info
  const branding: TenantBranding = {
    name: tenant?.name || '',
    logo_url: tenant?.logo_url || null,
    contact_email: null, // Not in current schema
    contact_phone: null, // Not in current schema
    address: null,
  };

  // Update tenant branding (name, logo)
  const updateBranding = useMutation({
    mutationFn: async (updates: Partial<TenantBranding>) => {
      if (!tenant?.id) throw new Error('No tenant found');

      console.log('Updating branding for tenant:', tenant.id, 'with:', updates);

      const { data, error } = await supabase
        .from('tenants')
        .update({
          name: updates.name,
          logo_url: updates.logo_url,
        })
        .eq('id', tenant.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
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

  // Update tenant settings (colors, timezone, currency)
  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<TenantSettings>) => {
      if (!tenant?.id) throw new Error('No tenant found');

      console.log('Updating settings for tenant:', tenant.id, 'with:', updates);

      // Map settings to actual tenant columns
      const updateData: Record<string, unknown> = {};
      if (updates.branding?.primary_color) {
        updateData.primary_color = updates.branding.primary_color;
      }
      if (updates.branding?.secondary_color) {
        updateData.secondary_color = updates.branding.secondary_color;
      }
      if (updates.defaults?.default_currency) {
        updateData.currency = updates.defaults.default_currency;
      }
      if (updates.defaults?.default_timezone) {
        updateData.timezone = updates.defaults.default_timezone;
      }

      if (Object.keys(updateData).length === 0) {
        console.log('No actual updates to apply');
        return tenant;
      }

      const { data, error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', tenant.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

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

  const updateNotificationSettings = (_updates: Partial<TenantSettings['notifications']>) => {
    // Notification settings not stored in DB yet
    toast.info('Notification settings will be available soon');
    return Promise.resolve();
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
