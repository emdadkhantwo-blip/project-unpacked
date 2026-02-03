-- Enable realtime for reservations and housekeeping tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.housekeeping_tasks;