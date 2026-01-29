-- Enable realtime for active_matches and game_invitations tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_players;