import { useState, useEffect } from 'react';
import { GameButton } from '@/components/ui/game-button';
import { Input } from '@/components/ui/input';
import { GameScreen } from '@/types/game';
import { ArrowLeft, Loader2, Trash2, Plus, Minus, Users, Crown, Zap, Gem, Search } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { FRUIT_FIGHTERS } from '@/data/fighters';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AdminScreenProps {
  onNavigate: (screen: GameScreen) => void;
  userId: string;
}

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

export const AdminScreen = ({ onNavigate, userId }: AdminScreenProps) => {
  const { listPlayers, updatePlayer, deleteUser, addFighter, grantAllFighters } = useAdmin(userId);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [inventory, setInventory] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [editValues, setEditValues] = useState({ thunder_points: 0, gems: 0 });
  const [search, setSearch] = useState('');

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const data = await listPlayers();
      setPlayers(data.players || []);
      // Build inventory map
      const invMap: Record<string, string[]> = {};
      (data.inventory || []).forEach((item: { user_id: string; item_id: string }) => {
        if (!invMap[item.user_id]) invMap[item.user_id] = [];
        invMap[item.user_id].push(item.item_id);
      });
      setInventory(invMap);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load players', variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchPlayers(); }, []);

  const handleUpdateTP = async (playerId: string, amount: number) => {
    const player = players.find(p => p.user_id === playerId);
    if (!player) return;
    const newTP = Math.max(0, player.thunder_points + amount);
    try {
      await updatePlayer(playerId, { thunder_points: newTP });
      setPlayers(prev => prev.map(p => p.user_id === playerId ? { ...p, thunder_points: newTP } : p));
      toast({ title: `${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} ⚡` });
    } catch { toast({ title: 'Failed to update', variant: 'destructive' }); }
  };

  const handleUpdateGems = async (playerId: string, amount: number) => {
    const player = players.find(p => p.user_id === playerId);
    if (!player) return;
    const newGems = Math.max(0, player.gems + amount);
    try {
      await updatePlayer(playerId, { gems: newGems });
      setPlayers(prev => prev.map(p => p.user_id === playerId ? { ...p, gems: newGems } : p));
      toast({ title: `${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} 💎` });
    } catch { toast({ title: 'Failed to update', variant: 'destructive' }); }
  };

  const handleDeleteUser = async (playerId: string) => {
    if (playerId === userId) {
      toast({ title: 'Cannot delete yourself!', variant: 'destructive' });
      return;
    }
    try {
      await deleteUser(playerId);
      setPlayers(prev => prev.filter(p => p.user_id !== playerId));
      setSelectedPlayer(null);
      toast({ title: 'Player deleted' });
    } catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  const handleGrantAllFighters = async (playerId: string) => {
    const allIds = FRUIT_FIGHTERS.map(f => f.id);
    try {
      await grantAllFighters(playerId, allIds);
      toast({ title: 'All fighters granted!' });
      await fetchPlayers();
    } catch { toast({ title: 'Failed to grant fighters', variant: 'destructive' }); }
  };

  const handleAddFighter = async (playerId: string, fighterId: string) => {
    try {
      await addFighter(playerId, fighterId);
      toast({ title: `Added ${FRUIT_FIGHTERS.find(f => f.id === fighterId)?.name || fighterId}` });
      await fetchPlayers();
    } catch { toast({ title: 'Failed to add fighter', variant: 'destructive' }); }
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 animate-slide-up">
      <div className="flex items-center gap-4 mb-6">
        <GameButton variant="ghost" size="icon" onClick={() => onNavigate('lobby')}>
          <ArrowLeft className="w-5 h-5" />
        </GameButton>
        <h1 className="font-game-title text-3xl text-glow-orange text-primary">
          <Crown className="w-6 h-6 inline mr-2" />
          ADMIN PANEL
        </h1>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-lg mx-auto w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-muted border-border"
        />
      </div>

      <div className="max-w-lg mx-auto w-full space-y-3 flex-1 overflow-auto">
        <p className="text-sm text-muted-foreground"><Users className="w-4 h-4 inline" /> {players.length} players total</p>

        {filteredPlayers.map((p) => (
          <div
            key={p.user_id}
            className={cn(
              "bg-card/80 backdrop-blur-sm rounded-xl p-4 border transition-all cursor-pointer",
              selectedPlayer?.user_id === p.user_id ? "border-primary" : "border-border hover:border-primary/50"
            )}
            onClick={() => {
              setSelectedPlayer(selectedPlayer?.user_id === p.user_id ? null : p);
              setEditValues({ thunder_points: 100, gems: 10 });
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-lg overflow-hidden">
                {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : '🎮'}
              </div>
              <div className="flex-1">
                <h3 className="font-game-heading text-foreground">
                  {p.name}
                  {p.user_id === userId && <span className="text-xs text-primary ml-2">(YOU)</span>}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Lv.{p.level} • {p.total_wins} wins • ⚡{p.thunder_points} • 💎{p.gems}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {(inventory[p.user_id] || []).length} 🍎
              </div>
            </div>

            {/* Expanded panel */}
            {selectedPlayer?.user_id === p.user_id && (
              <div className="mt-4 space-y-3 border-t border-border pt-4" onClick={(e) => e.stopPropagation()}>
                {/* Add TP */}
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <Input
                    type="number"
                    value={editValues.thunder_points}
                    onChange={(e) => setEditValues(prev => ({ ...prev, thunder_points: parseInt(e.target.value) || 0 }))}
                    className="w-24 h-8 text-sm bg-muted"
                  />
                  <GameButton variant="primary" size="sm" onClick={() => handleUpdateTP(p.user_id, editValues.thunder_points)}>
                    <Plus className="w-3 h-3" />
                  </GameButton>
                  <GameButton variant="ghost" size="sm" onClick={() => handleUpdateTP(p.user_id, -editValues.thunder_points)}>
                    <Minus className="w-3 h-3" />
                  </GameButton>
                </div>

                {/* Add Gems */}
                <div className="flex items-center gap-2">
                  <Gem className="w-4 h-4 text-cyan-400" />
                  <Input
                    type="number"
                    value={editValues.gems}
                    onChange={(e) => setEditValues(prev => ({ ...prev, gems: parseInt(e.target.value) || 0 }))}
                    className="w-24 h-8 text-sm bg-muted"
                  />
                  <GameButton variant="primary" size="sm" onClick={() => handleUpdateGems(p.user_id, editValues.gems)}>
                    <Plus className="w-3 h-3" />
                  </GameButton>
                  <GameButton variant="ghost" size="sm" onClick={() => handleUpdateGems(p.user_id, -editValues.gems)}>
                    <Minus className="w-3 h-3" />
                  </GameButton>
                </div>

                {/* Fighters */}
                <div className="flex flex-wrap gap-2">
                  <GameButton variant="primary" size="sm" onClick={() => handleGrantAllFighters(p.user_id)}>
                    Grant All Fighters
                  </GameButton>
                  {/* Show unowned fighters to add individually */}
                  <div className="w-full mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Add fighter:</p>
                    <div className="flex flex-wrap gap-1">
                      {FRUIT_FIGHTERS.filter(f => !(inventory[p.user_id] || []).includes(f.id)).slice(0, 10).map(f => (
                        <button
                          key={f.id}
                          onClick={() => handleAddFighter(p.user_id, f.id)}
                          className="text-xl hover:scale-125 transition-transform"
                          title={f.name}
                        >
                          {f.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delete */}
                {p.user_id !== userId && (
                  <GameButton
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteUser(p.user_id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Account
                  </GameButton>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
