-- Enable realtime for folios and payments
ALTER PUBLICATION supabase_realtime ADD TABLE public.folios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.folio_items;