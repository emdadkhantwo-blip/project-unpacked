import { useState } from "react";
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
  staff_name: string;
  staff_avatar: string | null;
  staff_id: string | null;
  nid_number: string | null;
}

// Mock data since hr_documents table doesn't exist yet
const MOCK_DOCUMENTS: HRDocument[] = [];

export function useHRDocuments() {
  const { tenantId } = useAuth();
  const [documents] = useState<HRDocument[]>(MOCK_DOCUMENTS);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

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

  const refetch = async () => {
    // No-op for mock
  };

  return {
    documents,
    stats,
    isLoading,
    error,
    refetch,
  };
}
