-- Create a security definer function to log cross-tenant access attempts
-- This bypasses RLS to ensure all security events are captured
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    user_id,
    tenant_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    p_action,
    p_entity_type,
    p_entity_id,
    p_user_id,
    p_tenant_id,
    p_old_values,
    p_new_values,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create a specific function for cross-tenant access attempts
CREATE OR REPLACE FUNCTION public.log_cross_tenant_attempt(
  p_user_id UUID,
  p_user_tenant_id UUID,
  p_attempted_tenant_id UUID,
  p_attempted_property_id UUID DEFAULT NULL,
  p_action_type TEXT DEFAULT 'cross_tenant_access',
  p_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.log_security_event(
    p_action := p_action_type,
    p_entity_type := 'security_violation',
    p_entity_id := p_attempted_property_id,
    p_user_id := p_user_id,
    p_tenant_id := p_user_tenant_id,
    p_old_values := jsonb_build_object(
      'user_tenant_id', p_user_tenant_id
    ),
    p_new_values := jsonb_build_object(
      'attempted_tenant_id', p_attempted_tenant_id,
      'attempted_property_id', p_attempted_property_id,
      'details', p_details,
      'severity', 'critical',
      'timestamp', now()
    ),
    p_ip_address := p_ip_address,
    p_user_agent := p_user_agent
  );
END;
$$;

-- Create function to detect and log RLS policy violations
CREATE OR REPLACE FUNCTION public.log_rls_violation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_user_tenant UUID;
  record_tenant UUID;
BEGIN
  -- Get current user info
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get user's tenant
  SELECT tenant_id INTO current_user_tenant
  FROM profiles
  WHERE id = current_user_id;
  
  -- For INSERT/UPDATE operations
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    record_tenant := NEW.tenant_id;
    
    IF record_tenant IS NOT NULL AND record_tenant != current_user_tenant THEN
      PERFORM public.log_cross_tenant_attempt(
        p_user_id := current_user_id,
        p_user_tenant_id := current_user_tenant,
        p_attempted_tenant_id := record_tenant,
        p_action_type := 'rls_bypass_attempt_' || lower(TG_OP),
        p_details := jsonb_build_object(
          'table_name', TG_TABLE_NAME,
          'operation', TG_OP
        )
      );
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_cross_tenant_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_rls_violation TO authenticated;