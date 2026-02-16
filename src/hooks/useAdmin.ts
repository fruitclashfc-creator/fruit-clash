import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlayerData {
  id: string;
  user_id: string;
  name: string;
  level: number;
  total_wins: number;
  thunder_points: number;
  gems: number;
  avatar_url: string | null;
}

interface InventoryItem {
  user_id: string;
  item_id: string;
  quantity: number;
}

export const useAdmin = (userId: string | null) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!data);
      setLoading(false);
    };
    checkAdmin();
  }, [userId]);

  const adminAction = useCallback(async (action: string, params: Record<string, unknown> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await supabase.functions.invoke('admin-manage', {
      body: { action, ...params },
    });

    if (response.error) throw response.error;
    return response.data;
  }, []);

  const listPlayers = useCallback(async (): Promise<{ players: PlayerData[]; inventory: InventoryItem[] }> => {
    return adminAction('list_players');
  }, [adminAction]);

  const updatePlayer = useCallback(async (user_id: string, updates: Partial<Pick<PlayerData, 'name' | 'level' | 'total_wins' | 'thunder_points' | 'gems'>>) => {
    return adminAction('update_player', { user_id, updates });
  }, [adminAction]);

  const deleteUser = useCallback(async (user_id: string) => {
    return adminAction('delete_user', { user_id });
  }, [adminAction]);

  const addFighter = useCallback(async (user_id: string, fighter_id: string) => {
    return adminAction('add_fighter', { user_id, fighter_id });
  }, [adminAction]);

  const grantAllFighters = useCallback(async (user_id: string, fighter_ids: string[]) => {
    return adminAction('grant_all_fighters', { user_id, fighter_ids });
  }, [adminAction]);

  const changePassword = useCallback(async (user_id: string, new_password: string) => {
    return adminAction('change_password', { user_id, new_password });
  }, [adminAction]);

  return {
    isAdmin,
    loading,
    listPlayers,
    updatePlayer,
    deleteUser,
    addFighter,
    grantAllFighters,
    changePassword,
  };
};
