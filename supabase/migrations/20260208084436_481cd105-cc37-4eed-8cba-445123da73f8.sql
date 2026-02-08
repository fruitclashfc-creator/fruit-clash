-- Add currency columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN thunder_points integer NOT NULL DEFAULT 100,
ADD COLUMN gems integer NOT NULL DEFAULT 10;

-- Create player_inventory table to store owned fruits/boxes
CREATE TABLE public.player_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  item_type text NOT NULL, -- 'fruit' or 'box'
  item_id text NOT NULL, -- fruit type id or box type
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Enable RLS on player_inventory
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;

-- RLS policies for player_inventory
CREATE POLICY "Users can view their own inventory"
ON public.player_inventory FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory"
ON public.player_inventory FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory"
ON public.player_inventory FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory"
ON public.player_inventory FOR DELETE
USING (auth.uid() = user_id);