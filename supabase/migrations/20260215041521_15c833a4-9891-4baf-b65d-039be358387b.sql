
-- Delete non-admin auth users (this cascades to profiles)
DELETE FROM auth.users WHERE id IN ('c67b33f9-6ac9-4a60-a6d8-a2cdbcc65218', 'cd168ba5-7ea5-4c0b-8ea2-ac97a1e08ecd');

-- Create profile for admin fc_creator if missing
INSERT INTO public.profiles (user_id, name, thunder_points, gems, level, total_wins)
VALUES ('7c15ecbc-83c5-4032-9810-9b6fd6a8272b', 'FC CREATOR', 500, 50, 5, 10)
ON CONFLICT (user_id) DO NOTHING;
