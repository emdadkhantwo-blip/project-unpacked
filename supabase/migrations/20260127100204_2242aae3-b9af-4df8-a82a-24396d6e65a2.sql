-- Fix any existing corrupted data in folios
UPDATE public.folios f
SET tenant_id = p.tenant_id
FROM public.properties p
WHERE f.property_id = p.id
  AND f.tenant_id != p.tenant_id;

-- Fix any existing corrupted data in pos_orders (via outlet -> property)
UPDATE public.pos_orders po
SET tenant_id = p.tenant_id
FROM public.pos_outlets o
JOIN public.properties p ON o.property_id = p.id
WHERE po.outlet_id = o.id
  AND po.tenant_id != p.tenant_id;

-- Fix any existing corrupted data in night_audits
UPDATE public.night_audits na
SET tenant_id = p.tenant_id
FROM public.properties p
WHERE na.property_id = p.id
  AND na.tenant_id != p.tenant_id;

-- Create validation function for outlet-scoped tables (pos_orders)
CREATE OR REPLACE FUNCTION public.validate_outlet_tenant_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  outlet_tenant_id UUID;
BEGIN
  -- Get the tenant_id from the outlet's property
  SELECT p.tenant_id INTO outlet_tenant_id
  FROM public.pos_outlets o
  JOIN public.properties p ON o.property_id = p.id
  WHERE o.id = NEW.outlet_id;
  
  IF outlet_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Outlet not found: %', NEW.outlet_id;
  END IF;
  
  -- Ensure tenant_id matches outlet's property tenant_id
  IF NEW.tenant_id != outlet_tenant_id THEN
    RAISE EXCEPTION 'tenant_id must match outlet property tenant_id. Expected: %, Got: %', outlet_tenant_id, NEW.tenant_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for folios
DROP TRIGGER IF EXISTS trg_validate_folio_tenant ON public.folios;
CREATE TRIGGER trg_validate_folio_tenant
  BEFORE INSERT OR UPDATE ON public.folios
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_property_tenant_match();

-- Create trigger for pos_orders (uses outlet validation)
DROP TRIGGER IF EXISTS trg_validate_pos_order_tenant ON public.pos_orders;
CREATE TRIGGER trg_validate_pos_order_tenant
  BEFORE INSERT OR UPDATE ON public.pos_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_outlet_tenant_match();

-- Create trigger for night_audits
DROP TRIGGER IF EXISTS trg_validate_night_audit_tenant ON public.night_audits;
CREATE TRIGGER trg_validate_night_audit_tenant
  BEFORE INSERT OR UPDATE ON public.night_audits
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_property_tenant_match();