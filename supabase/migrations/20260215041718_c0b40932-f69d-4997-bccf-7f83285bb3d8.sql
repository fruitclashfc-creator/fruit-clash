
-- Grant starter fruits to admin (fc_creator)
INSERT INTO public.player_inventory (user_id, item_id, item_type, quantity) VALUES
  ('7c15ecbc-83c5-4032-9810-9b6fd6a8272b', 'bomb', 'fighter', 1),
  ('7c15ecbc-83c5-4032-9810-9b6fd6a8272b', 'spike', 'fighter', 1),
  ('7c15ecbc-83c5-4032-9810-9b6fd6a8272b', 'chop', 'fighter', 1),
  ('7c15ecbc-83c5-4032-9810-9b6fd6a8272b', 'spring', 'fighter', 1),
  ('7c15ecbc-83c5-4032-9810-9b6fd6a8272b', 'slime', 'fighter', 1),
  ('7c15ecbc-83c5-4032-9810-9b6fd6a8272b', 'light', 'fighter', 1)
ON CONFLICT DO NOTHING;
