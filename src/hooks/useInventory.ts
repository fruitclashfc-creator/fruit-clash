import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FRUIT_FIGHTERS } from '@/data/fighters';
import { Rarity } from '@/types/game';

const MAX_FRUIT_QUANTITY = 15;

// 6 starter common fruits
const STARTER_FIGHTER_IDS = ['bomb', 'spike', 'chop', 'spring', 'slime', 'light'];

interface InventoryItem {
  item_id: string;
  item_type: string;
  quantity: number;
}

export const useInventory = (userId: string | null) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('player_inventory')
      .select('item_id, item_type, quantity')
      .eq('user_id', userId);

    if (!error && data) {
      setInventory(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const grantStarterFruits = useCallback(async () => {
    if (!userId) return;
    // Check if player already has any inventory
    const { data: existing } = await supabase
      .from('player_inventory')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existing && existing.length > 0) return; // Already has inventory

    const inserts = STARTER_FIGHTER_IDS.map(id => ({
      user_id: userId,
      item_id: id,
      item_type: 'fighter',
      quantity: 1,
    }));

    await supabase.from('player_inventory').insert(inserts);
    await fetchInventory();
  }, [userId, fetchInventory]);

  const addFighter = useCallback(async (fighterId: string): Promise<boolean> => {
    if (!userId) return false;

    const existing = inventory.find(i => i.item_id === fighterId && i.item_type === 'fighter');

    if (existing && existing.quantity >= MAX_FRUIT_QUANTITY) {
      return false; // Already at max
    }

    if (existing) {
      await supabase
        .from('player_inventory')
        .update({ quantity: existing.quantity + 1 })
        .eq('user_id', userId)
        .eq('item_id', fighterId)
        .eq('item_type', 'fighter');
    } else {
      await supabase.from('player_inventory').insert({
        user_id: userId,
        item_id: fighterId,
        item_type: 'fighter',
        quantity: 1,
      });
    }

    await fetchInventory();
    return true;
  }, [userId, inventory, fetchInventory]);

  const getOwnedFighters = useCallback(() => {
    return inventory
      .filter(i => i.item_type === 'fighter')
      .map(i => {
        const fighter = FRUIT_FIGHTERS.find(f => f.id === i.item_id);
        return fighter ? { ...fighter, quantity: i.quantity } : null;
      })
      .filter(Boolean) as (typeof FRUIT_FIGHTERS[0] & { quantity: number })[];
  }, [inventory]);

  const getFighterQuantity = useCallback((fighterId: string) => {
    const item = inventory.find(i => i.item_id === fighterId && i.item_type === 'fighter');
    return item?.quantity ?? 0;
  }, [inventory]);

  return {
    inventory,
    loading,
    grantStarterFruits,
    addFighter,
    getOwnedFighters,
    getFighterQuantity,
    refetch: fetchInventory,
  };
};
