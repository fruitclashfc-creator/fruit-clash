import { useState, useEffect } from 'react';
import { GameButton } from '@/components/ui/game-button';
import { Input } from '@/components/ui/input';
import { GameScreen } from '@/types/game';
import { ArrowLeft, Loader2, Trash2, Plus, Minus, Users, Crown, Zap, Gem, Search, X, Check, Eye } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { FRUIT_FIGHTERS } from '@/data/fighters';
import { getRarityColor } from '@/data/fighters';
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
  const { listPlayers, updatePlayer, deleteUser, addFighter, grantAllFighters, removeFighter } = useAdmin(userId);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [inventory, setInventory] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [editValues, setEditValues] = useState({ thunder_points: 100, gems: 10 });
  const [search, setSearch] = useState('');
  const [viewingAvatar, setViewingAvatar] = useState<{ name: string; url: string } | null>(null);
  const [playerDetailView, setPlayerDetailView] = useState<string | null>(null);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const data = await listPlayers();
      setPlayers(data.players || []);
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
      setPlayerDetailView(null);
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
      setInventory(prev => ({
        ...prev,
        [playerId]: [...(prev[playerId] || []), fighterId],
      }));
      toast({ title: `Added ${FRUIT_FIGHTERS.find(f => f.id === fighterId)?.name || fighterId}` });
    } catch { toast({ title: 'Failed to add fighter', variant: 'destructive' }); }
  };

  const handleRemoveFighter = async (playerId: string, fighterId: string) => {
    try {
      await removeFighter(playerId, fighterId);
      setInventory(prev => ({
        ...prev,
        [playerId]: (prev[playerId] || []).filter(id => id !== fighterId),
      }));
      toast({ title: `Removed ${FRUIT_FIGHTERS.find(f => f.id === fighterId)?.name || fighterId}` });
    } catch { toast({ title: 'Failed to remove fighter', variant: 'destructive' }); }
  };

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const detailPlayer = playerDetailView ? players.find(p => p.user_id === playerDetailView) : null;
  const detailInventory = playerDetailView ? (inventory[playerDetailView] || []) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Player Detail / Impersonation View
  if (detailPlayer) {
    const ownedIds = new Set(detailInventory);
    const ownedFighters = FRUIT_FIGHTERS.filter(f => ownedIds.has(f.id));
    const unownedFighters = FRUIT_FIGHTERS.filter(f => !ownedIds.has(f.id));

    return (
      <div className="min-h-screen flex flex-col p-4 animate-slide-up">
        <div className="flex items-center gap-4 mb-6">
          <GameButton variant="ghost" size="icon" onClick={() => setPlayerDetailView(null)}>
            <ArrowLeft className="w-5 h-5" />
          </GameButton>
          <h1 className="font-game-title text-2xl text-glow-orange text-primary truncate">
            {detailPlayer.name}'s Account
          </h1>
        </div>

        <div className="max-w-lg mx-auto w-full space-y-4 flex-1 overflow-auto">
          {/* Player Info Card */}
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-2xl overflow-hidden cursor-pointer"
                onClick={() => detailPlayer.avatar_url && setViewingAvatar({ name: detailPlayer.name, url: detailPlayer.avatar_url })}
              >
                {detailPlayer.avatar_url ? <img src={detailPlayer.avatar_url} className="w-full h-full object-cover" /> : '🎮'}
              </div>
              <div>
                <h2 className="font-game-heading text-xl text-foreground">{detailPlayer.name}</h2>
                <p className="text-sm text-muted-foreground">Level {detailPlayer.level} • {detailPlayer.total_wins} Wins</p>
              </div>
            </div>

            {/* Currency Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
                <span className="font-game-heading text-yellow-400 w-16">{detailPlayer.thunder_points}</span>
                <Input
                  type="number"
                  value={editValues.thunder_points}
                  onChange={(e) => setEditValues(prev => ({ ...prev, thunder_points: parseInt(e.target.value) || 0 }))}
                  className="w-20 h-8 text-sm bg-muted"
                />
                <GameButton variant="primary" size="sm" onClick={() => handleUpdateTP(detailPlayer.user_id, editValues.thunder_points)}>
                  <Plus className="w-3 h-3" />
                </GameButton>
                <GameButton variant="ghost" size="sm" onClick={() => handleUpdateTP(detailPlayer.user_id, -editValues.thunder_points)}>
                  <Minus className="w-3 h-3" />
                </GameButton>
              </div>
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-game-heading text-cyan-400 w-16">{detailPlayer.gems}</span>
                <Input
                  type="number"
                  value={editValues.gems}
                  onChange={(e) => setEditValues(prev => ({ ...prev, gems: parseInt(e.target.value) || 0 }))}
                  className="w-20 h-8 text-sm bg-muted"
                />
                <GameButton variant="primary" size="sm" onClick={() => handleUpdateGems(detailPlayer.user_id, editValues.gems)}>
                  <Plus className="w-3 h-3" />
                </GameButton>
                <GameButton variant="ghost" size="sm" onClick={() => handleUpdateGems(detailPlayer.user_id, -editValues.gems)}>
                  <Minus className="w-3 h-3" />
                </GameButton>
              </div>
            </div>
          </div>

          {/* Owned Fighters */}
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-game-heading text-foreground">
                Owned Fighters ({ownedFighters.length}/{FRUIT_FIGHTERS.length})
              </h3>
              <GameButton variant="primary" size="sm" onClick={() => handleGrantAllFighters(detailPlayer.user_id)}>
                Grant All
              </GameButton>
            </div>
            {ownedFighters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No fighters owned</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {ownedFighters.map(f => (
                  <div key={f.id} className="flex flex-col items-center p-2 rounded-lg bg-muted/50 border border-border relative group">
                    <span className="text-2xl">{f.emoji}</span>
                    <span className={cn("text-xs font-medium truncate w-full text-center", getRarityColor(f.rarity))}>{f.name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{f.rarity}</span>
                    <button
                      onClick={() => handleRemoveFighter(detailPlayer.user_id, f.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full items-center justify-center text-white hidden group-hover:flex text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unowned Fighters */}
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border">
            <h3 className="font-game-heading text-foreground mb-3">
              Unowned Fighters ({unownedFighters.length})
            </h3>
            {unownedFighters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-green-400">Player owns all fighters! ✅</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {unownedFighters.map(f => (
                  <button
                    key={f.id}
                    onClick={() => handleAddFighter(detailPlayer.user_id, f.id)}
                    className="flex flex-col items-center p-2 rounded-lg bg-muted/30 border border-dashed border-border hover:border-primary hover:bg-primary/10 transition-all opacity-60 hover:opacity-100"
                  >
                    <span className="text-2xl">{f.emoji}</span>
                    <span className={cn("text-xs font-medium truncate w-full text-center", getRarityColor(f.rarity))}>{f.name}</span>
                    <span className="text-[10px] text-green-400">+ Add</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Danger Zone */}
          {detailPlayer.user_id !== userId && (
            <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/30">
              <GameButton
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive w-full"
                onClick={() => handleDeleteUser(detailPlayer.user_id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete This Account
              </GameButton>
            </div>
          )}
        </div>

        {/* Avatar Viewer Modal */}
        {viewingAvatar && (
          <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setViewingAvatar(null)}>
            <div className="relative max-w-sm mx-4">
              <img src={viewingAvatar.url} alt={viewingAvatar.name} className="w-64 h-64 rounded-2xl object-cover border-4 border-primary" />
              <p className="text-center mt-3 font-game-heading text-foreground">{viewingAvatar.name}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Player List View
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
            className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border hover:border-primary/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-lg overflow-hidden cursor-pointer"
                onClick={() => p.avatar_url && setViewingAvatar({ name: p.name, url: p.avatar_url })}
              >
                {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : '🎮'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-game-heading text-foreground truncate">
                  {p.name}
                  {p.user_id === userId && <span className="text-xs text-primary ml-2">(YOU)</span>}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Lv.{p.level} • {p.total_wins} wins • ⚡{p.thunder_points} • 💎{p.gems} • {(inventory[p.user_id] || []).length} 🍎
                </p>
              </div>
              <GameButton
                variant="primary"
                size="sm"
                onClick={() => {
                  setPlayerDetailView(p.user_id);
                  setEditValues({ thunder_points: 100, gems: 10 });
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                Enter
              </GameButton>
            </div>
          </div>
        ))}
      </div>

      {/* Avatar Viewer Modal */}
      {viewingAvatar && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setViewingAvatar(null)}>
          <div className="relative max-w-sm mx-4">
            <img src={viewingAvatar.url} alt={viewingAvatar.name} className="w-64 h-64 rounded-2xl object-cover border-4 border-primary" />
            <p className="text-center mt-3 font-game-heading text-foreground">{viewingAvatar.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};
