import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  contact_email: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
}

interface Property {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  status: string;
  city: string | null;
  country: string | null;
  currency: string;
  timezone: string;
  tax_rate: number;
  service_charge_rate: number;
}

interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  plan?: {
    name: string;
    plan_type: string;
    max_properties: number;
    max_staff: number;
    max_rooms: number;
    features: Record<string, boolean>;
  };
}

interface TenantContextType {
  tenant: Tenant | null;
  properties: Property[];
  currentProperty: Property | null;
  subscription: Subscription | null;
  isLoading: boolean;
  setCurrentProperty: (property: Property | null) => void;
  refreshTenant: () => Promise<void>;
  hasFeature: (feature: string) => boolean;
  isWithinLimit: (resource: 'properties' | 'staff' | 'rooms', currentCount: number) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { tenantId, isSuperAdmin, isLoading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTenantData = async () => {
    if (!tenantId) {
      setTenant(null);
      setProperties([]);
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .maybeSingle();

      if (tenantError) {
        console.error('Error fetching tenant:', tenantError);
      } else if (tenantData) {
        setTenant(tenantData as Tenant);
      }

      // Fetch properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
      } else if (propertiesData) {
        setProperties(propertiesData as Property[]);
        // Set first property as current if none selected
        if (!currentProperty && propertiesData.length > 0) {
          setCurrentProperty(propertiesData[0] as Property);
        }
      }

      // Fetch subscription with plan
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
      } else if (subData) {
        setSubscription(subData as unknown as Subscription);
      }
    } catch (error) {
      console.error('Error in fetchTenantData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchTenantData();
    }
  }, [tenantId, authLoading]);

  const refreshTenant = async () => {
    await fetchTenantData();
  };

  const hasFeature = (feature: string): boolean => {
    if (isSuperAdmin) return true;
    if (!subscription?.plan?.features) return false;
    return subscription.plan.features[feature] === true;
  };

  const isWithinLimit = (resource: 'properties' | 'staff' | 'rooms', currentCount: number): boolean => {
    if (isSuperAdmin) return true;
    if (!subscription?.plan) return false;

    const limits = {
      properties: subscription.plan.max_properties,
      staff: subscription.plan.max_staff,
      rooms: subscription.plan.max_rooms,
    };

    return currentCount < limits[resource];
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        properties,
        currentProperty,
        subscription,
        isLoading: isLoading || authLoading,
        setCurrentProperty,
        refreshTenant,
        hasFeature,
        isWithinLimit,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}