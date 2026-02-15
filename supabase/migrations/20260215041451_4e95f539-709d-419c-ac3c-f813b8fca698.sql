
-- Fix profiles RLS: drop restrictive policies, recreate as permissive
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix player_inventory RLS
DROP POLICY IF EXISTS "Users can view their own inventory" ON public.player_inventory;
DROP POLICY IF EXISTS "Users can insert their own inventory" ON public.player_inventory;
DROP POLICY IF EXISTS "Users can update their own inventory" ON public.player_inventory;
DROP POLICY IF EXISTS "Users can delete their own inventory" ON public.player_inventory;

CREATE POLICY "Users can view their own inventory" ON public.player_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own inventory" ON public.player_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own inventory" ON public.player_inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own inventory" ON public.player_inventory FOR DELETE USING (auth.uid() = user_id);

-- Fix active_matches RLS
DROP POLICY IF EXISTS "Players can view their matches" ON public.active_matches;
DROP POLICY IF EXISTS "Players can create matches" ON public.active_matches;
DROP POLICY IF EXISTS "Players can update their matches" ON public.active_matches;
DROP POLICY IF EXISTS "Players can delete their matches" ON public.active_matches;

CREATE POLICY "Players can view their matches" ON public.active_matches FOR SELECT USING ((auth.uid() = player1_id) OR (auth.uid() = player2_id));
CREATE POLICY "Players can create matches" ON public.active_matches FOR INSERT WITH CHECK ((auth.uid() = player1_id) OR (auth.uid() = player2_id));
CREATE POLICY "Players can update their matches" ON public.active_matches FOR UPDATE USING ((auth.uid() = player1_id) OR (auth.uid() = player2_id));
CREATE POLICY "Players can delete their matches" ON public.active_matches FOR DELETE USING ((auth.uid() = player1_id) OR (auth.uid() = player2_id));

-- Fix game_invitations RLS
DROP POLICY IF EXISTS "Users can view their invitations" ON public.game_invitations;
DROP POLICY IF EXISTS "Users can send invitations" ON public.game_invitations;
DROP POLICY IF EXISTS "Users can respond to received invitations" ON public.game_invitations;
DROP POLICY IF EXISTS "Users can cancel their sent invitations" ON public.game_invitations;

CREATE POLICY "Users can view their invitations" ON public.game_invitations FOR SELECT USING ((auth.uid() = from_user_id) OR (auth.uid() = to_user_id));
CREATE POLICY "Users can send invitations" ON public.game_invitations FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can respond to received invitations" ON public.game_invitations FOR UPDATE USING (auth.uid() = to_user_id);
CREATE POLICY "Users can cancel their sent invitations" ON public.game_invitations FOR DELETE USING (auth.uid() = from_user_id);

-- Fix online_players RLS
DROP POLICY IF EXISTS "Anyone can view online players" ON public.online_players;
DROP POLICY IF EXISTS "Users can insert their own presence" ON public.online_players;
DROP POLICY IF EXISTS "Users can update their own presence" ON public.online_players;
DROP POLICY IF EXISTS "Users can delete their own presence" ON public.online_players;

CREATE POLICY "Anyone can view online players" ON public.online_players FOR SELECT USING (true);
CREATE POLICY "Users can insert their own presence" ON public.online_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own presence" ON public.online_players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own presence" ON public.online_players FOR DELETE USING (auth.uid() = user_id);

-- Fix storage policies for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
