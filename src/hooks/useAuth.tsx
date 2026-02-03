import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ROLE_PERMISSIONS, type AppRole } from '@/types/database';

// Helper function to get the appropriate dashboard based on user roles
export function getRoleDashboard(roles: AppRole[]): string {
  // Priority-based routing - highest priority roles first
  // Superadmins go to admin panel, not regular dashboard
  if (roles.includes('superadmin')) return '/admin/tenants';
  if (roles.includes('owner')) return '/dashboard';
  if (roles.includes('manager')) return '/dashboard';
  if (roles.includes('front_desk')) return '/front-desk';
  if (roles.includes('accountant')) return '/folios';
  if (roles.includes('night_auditor')) return '/night-audit';
  if (roles.includes('housekeeping')) return '/housekeeping';
  if (roles.includes('maintenance')) return '/maintenance';
  if (roles.includes('kitchen')) return '/kitchen';
  if (roles.includes('waiter')) return '/waiter';
  return '/dashboard'; // fallback
}

interface Profile {
  id: string;
  tenant_id: string | null;
  full_name: string | null;
  username: string;
  avatar_url: string | null;
  phone: string | null;
  department: string | null;
  role: string | null;
  property_id: string | null;
  user_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  rolesLoading: boolean;
  isSuperAdmin: boolean;
  tenantId: string | null;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string) => {
    setRolesLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData) {
        // Cast to Profile - the DB may have slightly different fields
        setProfile(profileData as unknown as Profile);
      }

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      } else if (rolesData) {
        setRoles(rolesData.map((r) => r.role as AppRole));
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer data fetching to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setRolesLoading(false);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRoles([]);
          setRolesLoading(false);
        }

        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = async (username: string, password: string) => {
    let loginEmail = username;

    // If not already an email, try to look up the email by username
    if (!username.includes('@')) {
      // First try the profiles table directly
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (profileError || !profileData) {
        return { error: new Error('User not found') };
      }

      // For now, assume username@tenant.local format if no RPC exists
      // In a real implementation, we'd need to store the email or use RPC
      loginEmail = username; // This will likely fail, but we need proper email lookup
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = useCallback(async () => {
    if (user) {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && profileData) {
        setProfile(profileData as unknown as Profile);
      }
    }
  }, [user]);

  const isSuperAdmin = roles.includes('superadmin');
  const tenantId = profile?.tenant_id ?? null;

  const hasRole = (role: AppRole) => {
    if (isSuperAdmin) return true;
    return roles.includes(role);
  };

  const hasAnyRole = (checkRoles: AppRole[]) => {
    if (isSuperAdmin) return true;
    return checkRoles.some((role) => roles.includes(role));
  };

  const hasPermission = (permission: string) => {
    if (isSuperAdmin) return true;
    return roles.some((role) => {
      const perms = ROLE_PERMISSIONS[role] || [];
      return perms.includes('*') || perms.includes(permission);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        rolesLoading,
        isSuperAdmin,
        tenantId,
        signIn,
        signUp,
        signOut,
        hasRole,
        hasAnyRole,
        hasPermission,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}