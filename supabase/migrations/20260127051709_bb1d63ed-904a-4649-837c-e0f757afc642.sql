-- Create active_matches table to sync multiplayer battles
CREATE TABLE public.active_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_id UUID NOT NULL,
  player1_name TEXT NOT NULL,
  player2_id UUID NOT NULL,
  player2_name TEXT NOT NULL,
  player1_team JSONB,
  player2_team JSONB,
  player1_ready BOOLEAN NOT NULL DEFAULT false,
  player2_ready BOOLEAN NOT NULL DEFAULT false,
  current_turn UUID,
  battle_state JSONB,
  pending_action JSONB,
  status TEXT NOT NULL DEFAULT 'waiting_teams',
  winner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.active_matches ENABLE ROW LEVEL SECURITY;

-- Players can view matches they're in
CREATE POLICY "Players can view their matches"
ON public.active_matches
FOR SELECT
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Players can create matches
CREATE POLICY "Players can create matches"
ON public.active_matches
FOR INSERT
WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Players can update matches they're in
CREATE POLICY "Players can update their matches"
ON public.active_matches
FOR UPDATE
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Players can delete matches they're in
CREATE POLICY "Players can delete their matches"
ON public.active_matches
FOR DELETE
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Enable realtime for active_matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_matches;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_active_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_active_matches_updated_at
BEFORE UPDATE ON public.active_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_active_matches_updated_at();