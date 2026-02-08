import { GameButton } from '@/components/ui/game-button';
import { BattleRewards } from '@/types/game';
import { Zap, Gem } from 'lucide-react';

interface BattleRewardsPopupProps {
  rewards: BattleRewards;
  onClose: () => void;
}

export const BattleRewardsPopup = ({ rewards, onClose }: BattleRewardsPopupProps) => {
  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-[60] animate-scale-in">
      <div className="bg-card rounded-2xl p-8 text-center border-2 border-primary box-glow-orange max-w-sm mx-4">
        <span className="text-5xl block mb-3">
          {rewards.isVictory ? '🎉' : '📊'}
        </span>
        <h2 className="font-game-title text-2xl text-foreground mb-1">
          {rewards.isVictory ? 'VICTORY REWARDS!' : 'MATCH REWARDS'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {rewards.isVictory ? 'Great battle, champion!' : 'Better luck next time!'}
        </p>
        
        <div className="flex justify-center gap-6 mb-6">
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-xl bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
              <Zap className="w-7 h-7 text-yellow-400" />
            </div>
            <span className="font-game-heading text-lg text-yellow-400">+{rewards.thunderPoints}</span>
            <span className="text-xs text-muted-foreground">Thunder</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
              <Gem className="w-7 h-7 text-cyan-400" />
            </div>
            <span className="font-game-heading text-lg text-cyan-400">+{rewards.gems}</span>
            <span className="text-xs text-muted-foreground">Gems</span>
          </div>
        </div>
        
        <GameButton variant="primary" onClick={onClose}>
          Collect
        </GameButton>
      </div>
    </div>
  );
};
