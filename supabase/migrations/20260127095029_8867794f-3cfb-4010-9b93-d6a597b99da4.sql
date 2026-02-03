-- Fix existing corrupted data: rooms with mismatched tenant_id
UPDATE rooms r
SET tenant_id = p.tenant_id
FROM properties p
WHERE r.property_id = p.id
  AND r.tenant_id != p.tenant_id;

-- Fix existing corrupted data: room_types with mismatched tenant_id
UPDATE room_types rt
SET tenant_id = p.tenant_id
FROM properties p
WHERE rt.property_id = p.id
  AND rt.tenant_id != p.tenant_id;

-- Create validation function to ensure tenant_id matches property's tenant_id
CREATE OR REPLACE FUNCTION public.validate_property_tenant_match()
RETURNS TRIGGER AS $$
DECLARE
  property_tenant_id UUID;
BEGIN
  -- Get the tenant_id from the property
  SELECT tenant_id INTO property_tenant_id
  FROM public.properties
  WHERE id = NEW.property_id;
  
  IF property_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Property not found: %', NEW.property_id;
  END IF;
  
  -- Ensure tenant_id matches property's tenant_id
  IF NEW.tenant_id != property_tenant_id THEN
    RAISE EXCEPTION 'tenant_id must match property tenant_id. Expected: %, Got: %', property_tenant_id, NEW.tenant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger for rooms table
DROP TRIGGER IF EXISTS trg_validate_room_tenant ON rooms;
CREATE TRIGGER trg_validate_room_tenant
BEFORE INSERT OR UPDATE ON rooms
FOR EACH ROW EXECUTE FUNCTION public.validate_property_tenant_match();

-- Add trigger for room_types table
DROP TRIGGER IF EXISTS trg_validate_room_type_tenant ON room_types;
CREATE TRIGGER trg_validate_room_type_tenant
BEFORE INSERT OR UPDATE ON room_types
FOR EACH ROW EXECUTE FUNCTION public.validate_property_tenant_match();