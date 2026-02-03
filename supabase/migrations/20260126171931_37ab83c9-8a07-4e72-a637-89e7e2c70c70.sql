-- Create storage bucket for guest documents (private for PII)
INSERT INTO storage.buckets (id, name, public)
VALUES ('guest-documents', 'guest-documents', false);

-- Create table for reservation guest IDs
CREATE TABLE public.reservation_guest_ids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  guest_number integer NOT NULL DEFAULT 1,
  document_url text NOT NULL,
  document_type text NOT NULL DEFAULT 'image',
  file_name text,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.reservation_guest_ids ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authorized staff can manage reservation_guest_ids"
  ON public.reservation_guest_ids FOR ALL
  USING (
    tenant_id = current_tenant_id() AND (
      has_role(auth.uid(), 'owner') OR
      has_role(auth.uid(), 'manager') OR
      has_role(auth.uid(), 'front_desk')
    )
  );

CREATE POLICY "Superadmins full access to reservation_guest_ids"
  ON public.reservation_guest_ids FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Tenant users can view reservation_guest_ids"
  ON public.reservation_guest_ids FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Storage policies for guest-documents bucket
CREATE POLICY "Authenticated users can upload guest documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'guest-documents');

CREATE POLICY "Tenant users can view their guest documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'guest-documents');

CREATE POLICY "Authorized staff can delete guest documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'guest-documents');