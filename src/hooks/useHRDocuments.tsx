import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface HRDocument {
  id: string;
  name: string;
  document_type: string;
  file_url: string;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  profile_id: string;
  uploaded_by: string | null;
  // Staff info
  staff_name: string;
  staff_avatar: string | null;
  staff_id: string | null;
  nid_number: string | null;
}

export function useHRDocuments() {
  const { tenantId } = useAuth();

  const {
    data: documents = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["hr-documents", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      // Fetch documents with profile info
      const { data: docs, error: docsError } = await supabase
        .from("hr_documents")
        .select(`
          *,
          profile:profiles!hr_documents_profile_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;

      // Get profile IDs to fetch hr_staff_profiles
      const profileIds = [...new Set(docs?.map((d) => d.profile_id) || [])];
      
      // Fetch staff profiles for NID and staff_id
      const { data: staffProfiles } = await supabase
        .from("hr_staff_profiles")
        .select("profile_id, staff_id, nid_number")
        .in("profile_id", profileIds);

      const staffMap = new Map(
        staffProfiles?.map((sp) => [sp.profile_id, sp]) || []
      );

      return (docs || []).map((doc) => {
        const staffProfile = staffMap.get(doc.profile_id);
        return {
          id: doc.id,
          name: doc.name,
          document_type: doc.document_type,
          file_url: doc.file_url,
          expiry_date: doc.expiry_date,
          notes: doc.notes,
          created_at: doc.created_at,
          profile_id: doc.profile_id,
          uploaded_by: doc.uploaded_by,
          staff_name: (doc.profile as any)?.full_name || "Unknown",
          staff_avatar: (doc.profile as any)?.avatar_url || null,
          staff_id: staffProfile?.staff_id || null,
          nid_number: staffProfile?.nid_number || null,
        };
      });
    },
    enabled: !!tenantId,
  });

  // Calculate stats
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const stats = {
    total: documents.length,
    valid: documents.filter((d) => {
      if (!d.expiry_date) return true;
      return new Date(d.expiry_date) > now;
    }).length,
    expiringSoon: documents.filter((d) => {
      if (!d.expiry_date) return false;
      const expiry = new Date(d.expiry_date);
      return expiry > now && expiry <= thirtyDaysFromNow;
    }).length,
    expired: documents.filter((d) => {
      if (!d.expiry_date) return false;
      return new Date(d.expiry_date) <= now;
    }).length,
  };

  return {
    documents,
    stats,
    isLoading,
    error,
    refetch,
  };
}
