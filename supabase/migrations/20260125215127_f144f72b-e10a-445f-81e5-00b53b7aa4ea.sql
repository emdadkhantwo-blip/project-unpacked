-- Allow owners to manage roles for users within their tenant
CREATE POLICY "Owners can manage tenant user roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    -- Current user must be an owner
    public.has_role(auth.uid(), 'owner')
    AND
    -- Target user must be in the same tenant as the owner
    EXISTS (
      SELECT 1 FROM public.profiles p1, public.profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = user_roles.user_id
        AND p1.tenant_id = p2.tenant_id
    )
  )
  WITH CHECK (
    -- Current user must be an owner
    public.has_role(auth.uid(), 'owner')
    AND
    -- Target user must be in the same tenant as the owner
    EXISTS (
      SELECT 1 FROM public.profiles p1, public.profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = user_roles.user_id
        AND p1.tenant_id = p2.tenant_id
    )
  );

-- Also allow owners to view all roles in their tenant (for the staff list)
CREATE POLICY "Owners can view tenant user roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner')
    AND
    EXISTS (
      SELECT 1 FROM public.profiles p1, public.profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = user_roles.user_id
        AND p1.tenant_id = p2.tenant_id
    )
  );