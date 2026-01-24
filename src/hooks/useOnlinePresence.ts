import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface OnlinePlayer {
  id: string;
  user_id: string;
  name: string;
  level: number;
  last_seen: string;
}

export const useOnlinePresence = () => {
  const { user, profile } = useAuth();
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch online players
  const fetchOnlinePlayers = useCallback(async () => {
    try {
      // Get players who were seen in the last 2 minutes
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('online_players')
        .select('*')
        .gte('last_seen', twoMinutesAgo)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      
      // Filter out current user
      const filtered = (data || []).filter(p => p.user_id !== user?.id);
      setOnlinePlayers(filtered);
    } catch (err) {
      console.error('Error fetching online players:', err);
      setError('Failed to fetch online players');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Mark user as online
  const goOnline = useCallback(async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('online_players')
        .upsert({
          user_id: user.id,
          name: profile.name,
          level: profile.level,
          last_seen: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (err) {
      console.error('Error going online:', err);
    }
  }, [user, profile]);

  // Mark user as offline
  const goOffline = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('online_players')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error going offline:', err);
    }
  }, [user]);

  // Update presence heartbeat
  useEffect(() => {
    if (!user || !profile) return;

    // Go online immediately
    goOnline();

    // Set up heartbeat to update last_seen every 30 seconds
    const heartbeat = setInterval(goOnline, 30000);

    // Go offline when component unmounts
    return () => {
      clearInterval(heartbeat);
      goOffline();
    };
  }, [user, profile, goOnline, goOffline]);

  // Fetch online players and set up realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchOnlinePlayers();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('online-players-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'online_players',
        },
        () => {
          // Refetch when changes occur
          fetchOnlinePlayers();
        }
      )
      .subscribe();

    // Refresh every 30 seconds to clean up stale entries
    const refreshInterval = setInterval(fetchOnlinePlayers, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(refreshInterval);
    };
  }, [user, fetchOnlinePlayers]);

  return {
    onlinePlayers,
    loading,
    error,
    refresh: fetchOnlinePlayers,
  };
};
