-- Fix existing corrupted data: reservations with mismatched tenant_id
UPDATE reservations r
SET tenant_id = p.tenant_id
FROM properties p
WHERE r.property_id = p.id
  AND r.tenant_id != p.tenant_id;

-- Fix existing corrupted data: housekeeping_tasks with mismatched tenant_id
UPDATE housekeeping_tasks ht
SET tenant_id = p.tenant_id
FROM properties p
WHERE ht.property_id = p.id
  AND ht.tenant_id != p.tenant_id;

-- Fix existing corrupted data: maintenance_tickets with mismatched tenant_id
UPDATE maintenance_tickets mt
SET tenant_id = p.tenant_id
FROM properties p
WHERE mt.property_id = p.id
  AND mt.tenant_id != p.tenant_id;

-- Add trigger for reservations table
DROP TRIGGER IF EXISTS trg_validate_reservation_tenant ON reservations;
CREATE TRIGGER trg_validate_reservation_tenant
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION public.validate_property_tenant_match();

-- Add trigger for housekeeping_tasks table
DROP TRIGGER IF EXISTS trg_validate_housekeeping_task_tenant ON housekeeping_tasks;
CREATE TRIGGER trg_validate_housekeeping_task_tenant
BEFORE INSERT OR UPDATE ON housekeeping_tasks
FOR EACH ROW EXECUTE FUNCTION public.validate_property_tenant_match();

-- Add trigger for maintenance_tickets table
DROP TRIGGER IF EXISTS trg_validate_maintenance_ticket_tenant ON maintenance_tickets;
CREATE TRIGGER trg_validate_maintenance_ticket_tenant
BEFORE INSERT OR UPDATE ON maintenance_tickets
FOR EACH ROW EXECUTE FUNCTION public.validate_property_tenant_match();