import { GameButton } from '@/components/ui/game-button';
import { Player, GameScreen } from '@/types/game';
import { Swords, Settings, LogOut, Zap, Gem, ShoppingBag } from 'lucide-react';
import { LevelProgress } from '@/components/LevelProgress';

interface LobbyScreenProps {
  player: Player;
  onNavigate: (screen: GameScreen) => void;
  onLogout?: () => void;
  onStartBattle: () => void;
}

export const LobbyScreen = ({ player, onNavigate, onLogout, onStartBattle }: LobbyScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 pb-8 animate-slide-up">
      {/* Header with username */}
      <div className="w-full max-w-lg space-y-3">
        <div className="flex items-center justify-between bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border">
          {/* Player info */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-2xl border-2 border-orange-400/50 overflow-hidden">
              {player.avatarUrl ? (
                <img src={player.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                '🎮'
              )}
            </div>
            <div>
              <h2 className="font-game-heading text-lg text-foreground">{player.name}</h2>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>Level {player.level}</span>
                <span>•</span>
                <span>{player.totalWins} Wins</span>
              </div>
            </div>
          </div>

          {/* Logout button */}
          {onLogout && (
            <GameButton 
              variant="ghost" 
              size="icon"
              onClick={onLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
            </GameButton>
          )}
        </div>

        {/* Currency Bar */}
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-border">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="font-game-heading text-sm text-yellow-400">{player.thunderPoints}</span>
            <span className="text-xs text-muted-foreground">Thunder</span>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-border">
            <Gem className="w-4 h-4 text-cyan-400" />
            <span className="font-game-heading text-sm text-cyan-400">{player.gems}</span>
            <span className="text-xs text-muted-foreground">Gems</span>
          </div>
        </div>

        {/* Level Progress */}
        <LevelProgress 
          currentLevel={player.level} 
          totalWins={player.totalWins} 
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-game-title text-5xl md:text-6xl text-glow-orange text-primary mb-2">
            FRUIT CLASH
          </h1>
          <p className="text-muted-foreground font-game-heading">
            Build your team. Dominate the arena.
          </p>
        </div>

        {/* Team Preview */}
        <div className="flex justify-center gap-2 mb-8">
          {player.selectedTeam.length > 0 ? (
            player.selectedTeam.slice(0, 6).map((fighter, i) => (
              <div 
                key={fighter.id + i}
                className="w-12 h-12 rounded-lg bg-gradient-to-br from-card to-muted border border-primary/50 flex items-center justify-center"
              >
                <span className="text-2xl">{fighter.emoji}</span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No team selected yet</p>
          )}
        </div>

        {/* Battle Button */}
        <div className="w-full space-y-4">
          <GameButton 
            variant="primary" 
            size="xl" 
            className="w-full"
            onClick={onStartBattle}
          >
            <Swords className="w-6 h-6" />
            BATTLE NOW
          </GameButton>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="w-full max-w-lg">
        <div className="flex justify-center gap-3">
          <GameButton 
            variant="ghost" 
            size="lg"
            onClick={() => onNavigate('fighters')}
          >
            <span className="text-2xl">⚔️</span>
            Fighters
          </GameButton>
          <GameButton 
            variant="ghost" 
            size="lg"
            onClick={() => onNavigate('shop')}
          >
            <ShoppingBag className="w-5 h-5" />
            Shop
          </GameButton>
          <GameButton 
            variant="ghost" 
            size="lg"
            onClick={() => onNavigate('settings')}
          >
            <Settings className="w-5 h-5" />
            Settings
          </GameButton>
        </div>
      </div>
    </div>
  );
};
