import { useState, useEffect } from 'react';
import { GameButton } from '@/components/ui/game-button';
import { HealthBar } from '@/components/HealthBar';
import { BattleState, GameScreen } from '@/types/game';
import { Sword, Shield, Sparkles, ArrowLeft, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BattleScreenProps {
  battleState: BattleState;
  onAttack: () => void;
  onDefend: () => void;
  onSpecial: () => void;
  onNavigate: (screen: GameScreen) => void;
  onRestart: () => void;
}

export const BattleScreen = ({ 
  battleState, 
  onAttack, 
  onDefend, 
  onSpecial, 
  onNavigate,
  onRestart 
}: BattleScreenProps) => {
  const [showDamage, setShowDamage] = useState<{ player: number | null; opponent: number | null }>({
    player: null,
    opponent: null
  });
  const [isAnimating, setIsAnimating] = useState(false);

  const { player, opponent, turn, battleLog, winner } = battleState;

  // Show damage numbers briefly
  useEffect(() => {
    if (showDamage.player || showDamage.opponent) {
      const timer = setTimeout(() => {
        setShowDamage({ player: null, opponent: null });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showDamage]);

  const handleAction = (action: () => void) => {
    if (isAnimating || turn !== 'player' || winner) return;
    setIsAnimating(true);
    action();
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <GameButton variant="ghost" size="icon" onClick={() => onNavigate('lobby')}>
          <ArrowLeft className="w-5 h-5" />
        </GameButton>
        <h1 className="font-game-title text-2xl text-glow-orange text-primary">
          {opponent.isBot ? 'VS BOT' : 'PVP BATTLE'}
        </h1>
        <div className="w-12" />
      </div>

      {/* Battle Arena */}
      <div className="flex-1 flex flex-col">
        {/* Opponent Side */}
        <div className="flex-1 flex flex-col items-center justify-end pb-8">
          <div className="relative">
            {/* Damage indicator */}
            {showDamage.opponent && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-game-title text-2xl text-destructive animate-slide-up">
                -{showDamage.opponent}
              </div>
            )}
            
            <div className={cn(
              'w-28 h-28 rounded-2xl flex items-center justify-center bg-gradient-to-br border-2 border-destructive/50 transition-all',
              opponent.fighter.color,
              turn === 'opponent' && 'box-glow-orange scale-105'
            )}>
              <span className={cn(
                'text-6xl transition-transform',
                isAnimating && turn === 'opponent' && 'animate-shake'
              )}>
                {opponent.fighter.emoji}
              </span>
            </div>
          </div>
          
          <div className="mt-3 text-center w-48">
            <h3 className="font-game-heading text-lg text-foreground">
              {opponent.fighter.name}
            </h3>
            <HealthBar 
              current={opponent.currentHealth} 
              max={opponent.fighter.maxHealth}
              size="md"
            />
          </div>
        </div>

        {/* VS Indicator */}
        <div className="flex items-center justify-center py-4">
          <div className="bg-primary px-6 py-2 rounded-full">
            <span className="font-game-title text-xl text-primary-foreground">VS</span>
          </div>
        </div>

        {/* Player Side */}
        <div className="flex-1 flex flex-col items-center justify-start pt-8">
          <div className="mb-3 text-center w-48">
            <h3 className="font-game-heading text-lg text-foreground">
              {player.fighter.name}
            </h3>
            <HealthBar 
              current={player.currentHealth} 
              max={player.fighter.maxHealth}
              size="md"
            />
          </div>

          <div className="relative">
            {/* Damage indicator */}
            {showDamage.player && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-game-title text-2xl text-destructive animate-slide-up">
                -{showDamage.player}
              </div>
            )}
            
            <div className={cn(
              'w-28 h-28 rounded-2xl flex items-center justify-center bg-gradient-to-br border-2 border-primary/50 transition-all',
              player.fighter.color,
              turn === 'player' && 'box-glow-orange scale-105'
            )}>
              <span className={cn(
                'text-6xl transition-transform',
                isAnimating && turn === 'player' && 'animate-shake'
              )}>
                {player.fighter.emoji}
              </span>
            </div>
          </div>

          {/* Energy Bar */}
          <div className="mt-4 w-48">
            <HealthBar 
              current={player.energy} 
              max={100}
              label="Energy"
              size="sm"
              variant="energy"
            />
          </div>
        </div>
      </div>

      {/* Battle Log */}
      <div className="h-20 bg-card/80 backdrop-blur-sm rounded-xl p-3 mb-4 overflow-y-auto border border-border">
        {battleLog.slice(-3).map((log, i) => (
          <p key={i} className="text-sm text-muted-foreground">
            {log}
          </p>
        ))}
      </div>

      {/* Winner Overlay */}
      {winner && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-scale-in">
          <div className="bg-card rounded-2xl p-8 text-center border-2 border-primary box-glow-orange max-w-sm mx-4">
            <span className="text-6xl mb-4 block">
              {winner === 'player' ? '🏆' : '💀'}
            </span>
            <h2 className="font-game-title text-3xl text-foreground mb-2">
              {winner === 'player' ? 'VICTORY!' : 'DEFEAT'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {winner === 'player' 
                ? 'You dominated the arena!' 
                : 'Better luck next time...'}
            </p>
            <div className="flex gap-4">
              <GameButton variant="ghost" onClick={() => onNavigate('lobby')}>
                <ArrowLeft className="w-4 h-4" />
                Lobby
              </GameButton>
              <GameButton variant="primary" onClick={onRestart}>
                <RotateCcw className="w-4 h-4" />
                Rematch
              </GameButton>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <GameButton 
          variant="destructive" 
          size="lg"
          onClick={() => handleAction(onAttack)}
          disabled={turn !== 'player' || !!winner}
          className="flex-col h-20"
        >
          <Sword className="w-6 h-6 mb-1" />
          <span className="text-xs">ATTACK</span>
        </GameButton>
        <GameButton 
          variant="accent" 
          size="lg"
          onClick={() => handleAction(onDefend)}
          disabled={turn !== 'player' || !!winner}
          className="flex-col h-20"
        >
          <Shield className="w-6 h-6 mb-1" />
          <span className="text-xs">DEFEND</span>
        </GameButton>
        <GameButton 
          variant="gold" 
          size="lg"
          onClick={() => handleAction(onSpecial)}
          disabled={turn !== 'player' || player.energy < 50 || !!winner}
          className="flex-col h-20"
        >
          <Sparkles className="w-6 h-6 mb-1" />
          <span className="text-xs">SPECIAL</span>
        </GameButton>
      </div>
    </div>
  );
};
