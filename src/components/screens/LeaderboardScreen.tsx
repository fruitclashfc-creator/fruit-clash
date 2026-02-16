import { useState, useEffect } from 'react';
import { GameButton } from '@/components/ui/game-button';
import { GameScreen } from '@/types/game';
import { ArrowLeft, Trophy, Zap, Gem, Medal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface LeaderboardScreenProps {
  onNavigate: (screen: GameScreen) => void;
  currentUserId?: string;
}

interface LeaderboardPlayer {
  user_id: string;
  name: string;
  level: number;
  total_wins: number;
  thunder_points: number;
  gems: number;
  avatar_url: string | null;
}

type SortBy = 'wins' | 'level' | 'thunder' | 'gems';

const getMedalEmoji = (rank: number) => {
  if (rank === 0) return '🥇';
  if (rank === 1) return '🥈';
  if (rank === 2) return '🥉';
  return `#${rank + 1}`;
};

export const LeaderboardScreen = ({ onNavigate, currentUserId }: LeaderboardScreenProps) => {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('wins');
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    const orderCol = sortBy === 'wins' ? 'total_wins' : sortBy === 'level' ? 'level' : sortBy === 'thunder' ? 'thunder_points' : 'gems';
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, name, level, total_wins, thunder_points, gems, avatar_url')
      .order(orderCol, { ascending: false })
      .limit(50);

    if (!error && data) setPlayers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  // Live updates
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sortBy]);

  const sortOptions: { key: SortBy; label: string; icon: React.ReactNode }[] = [
    { key: 'wins', label: 'Wins', icon: <Trophy className="w-3 h-3" /> },
    { key: 'level', label: 'Level', icon: <Medal className="w-3 h-3" /> },
    { key: 'thunder', label: 'Thunder', icon: <Zap className="w-3 h-3" /> },
    { key: 'gems', label: 'Gems', icon: <Gem className="w-3 h-3" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col p-4 animate-slide-up">
      <div className="flex items-center gap-4 mb-6">
        <GameButton variant="ghost" size="icon" onClick={() => onNavigate('lobby')}>
          <ArrowLeft className="w-5 h-5" />
        </GameButton>
        <h1 className="font-game-title text-3xl text-glow-orange text-primary">
          <Trophy className="w-6 h-6 inline mr-2" />
          LEADERBOARD
        </h1>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 mb-4 max-w-lg mx-auto w-full">
        {sortOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-2 rounded-xl font-game-heading text-xs transition-all',
              sortBy === opt.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto w-full space-y-2 flex-1 overflow-auto">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : players.map((p, i) => (
          <div
            key={p.user_id}
            className={cn(
              "flex items-center gap-3 bg-card/80 backdrop-blur-sm rounded-xl p-3 border transition-all",
              p.user_id === currentUserId ? "border-primary bg-primary/10" : "border-border",
              i < 3 && "border-yellow-500/50"
            )}
          >
            <div className={cn(
              "w-8 text-center font-game-title text-lg",
              i === 0 && "text-yellow-400",
              i === 1 && "text-gray-300",
              i === 2 && "text-amber-600",
            )}>
              {getMedalEmoji(i)}
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-lg overflow-hidden">
              {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : '🎮'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-game-heading text-foreground truncate">
                {p.name}
                {p.user_id === currentUserId && <span className="text-xs text-primary ml-1">(You)</span>}
              </h3>
              <p className="text-xs text-muted-foreground">Level {p.level}</p>
            </div>
            <div className="text-right">
              {sortBy === 'wins' && <p className="font-game-heading text-primary">{p.total_wins} <span className="text-xs text-muted-foreground">wins</span></p>}
              {sortBy === 'level' && <p className="font-game-heading text-primary">Lv.{p.level}</p>}
              {sortBy === 'thunder' && <p className="font-game-heading text-yellow-400">⚡{p.thunder_points}</p>}
              {sortBy === 'gems' && <p className="font-game-heading text-cyan-400">💎{p.gems}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
