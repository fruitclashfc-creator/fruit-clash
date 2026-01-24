-- Create table for tracking online players (presence)
CREATE TABLE public.online_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.online_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies for online_players
-- Anyone authenticated can see who's online
CREATE POLICY "Anyone can view online players"
ON public.online_players
FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own presence
CREATE POLICY "Users can insert their own presence"
ON public.online_players
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own presence
CREATE POLICY "Users can update their own presence"
ON public.online_players
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own presence
CREATE POLICY "Users can delete their own presence"
ON public.online_players
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create table for game invitations
CREATE TABLE public.game_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL,
  from_user_name TEXT NOT NULL,
  to_user_id UUID NOT NULL,
  to_user_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_invitations
-- Users can see invitations they sent or received
CREATE POLICY "Users can view their invitations"
ON public.game_invitations
FOR SELECT
TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can create invitations (as sender)
CREATE POLICY "Users can send invitations"
ON public.game_invitations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

-- Users can update invitations they received (to accept/decline)
CREATE POLICY "Users can respond to received invitations"
ON public.game_invitations
FOR UPDATE
TO authenticated
USING (auth.uid() = to_user_id);

-- Users can delete their sent invitations
CREATE POLICY "Users can cancel their sent invitations"
ON public.game_invitations
FOR DELETE
TO authenticated
USING (auth.uid() = from_user_id);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_invitations;

-- Add trigger for updated_at on game_invitations
CREATE TRIGGER update_game_invitations_updated_at
BEFORE UPDATE ON public.game_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();