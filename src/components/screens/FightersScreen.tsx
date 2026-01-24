import { useState } from 'react';
import { FighterCard } from '@/components/FighterCard';
import { GameButton } from '@/components/ui/game-button';
import { HealthBar } from '@/components/HealthBar';
import { FRUIT_FIGHTERS } from '@/data/fighters';
import { FruitFighter, GameScreen } from '@/types/game';
import { ArrowLeft, Sword, Shield, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FightersScreenProps {
  selectedFighter: FruitFighter | null;
  onSelectFighter: (fighter: FruitFighter) => void;
  onNavigate: (screen: GameScreen) => void;
}

export const FightersScreen = ({ selectedFighter, onSelectFighter, onNavigate }: FightersScreenProps) => {
  const [previewFighter, setPreviewFighter] = useState<FruitFighter | null>(selectedFighter);

  const handleSelect = (fighter: FruitFighter) => {
    setPreviewFighter(fighter);
  };

  const handleConfirm = () => {
    if (previewFighter) {
      onSelectFighter(previewFighter);
      onNavigate('lobby');
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <GameButton variant="ghost" size="icon" onClick={() => onNavigate('lobby')}>
          <ArrowLeft className="w-5 h-5" />
        </GameButton>
        <h1 className="font-game-title text-3xl text-glow-orange text-primary">
          CHOOSE FIGHTER
        </h1>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Fighter Preview */}
        {previewFighter && (
          <div className="lg:w-1/3 bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border animate-scale-in">
            <div className="flex flex-col items-center">
              {/* Large emoji preview */}
              <div className={cn(
                'w-32 h-32 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br',
                previewFighter.color
              )}>
                <span className="text-7xl animate-float">{previewFighter.emoji}</span>
              </div>

              <h2 className="font-game-title text-2xl text-foreground mb-1">
                {previewFighter.name}
              </h2>
              <span className={cn(
                'uppercase font-bold text-sm mb-4',
                previewFighter.rarity === 'legendary' && 'text-game-legendary',
                previewFighter.rarity === 'epic' && 'text-game-epic',
                previewFighter.rarity === 'rare' && 'text-game-rare'
              )}>
                {previewFighter.rarity}
              </span>

              {/* Stats */}
              <div className="w-full space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <Sword className="w-4 h-4 text-destructive" />
                  <HealthBar 
                    current={previewFighter.attack} 
                    max={50} 
                    label="Attack" 
                    showValue={false}
                    size="sm"
                    variant="health"
                  />
                  <span className="text-sm font-bold w-8">{previewFighter.attack}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-game-health" />
                  <HealthBar 
                    current={previewFighter.defense} 
                    max={50} 
                    label="Defense" 
                    showValue={false}
                    size="sm"
                  />
                  <span className="text-sm font-bold w-8">{previewFighter.defense}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-game-energy" />
                  <HealthBar 
                    current={previewFighter.speed} 
                    max={50} 
                    label="Speed" 
                    showValue={false}
                    size="sm"
                    variant="energy"
                  />
                  <span className="text-sm font-bold w-8">{previewFighter.speed}</span>
                </div>
              </div>

              {/* Ability */}
              <div className="w-full bg-muted rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-game-heading text-primary">{previewFighter.ability}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {previewFighter.abilityDescription}
                </p>
              </div>

              <GameButton 
                variant="gold" 
                size="lg" 
                className="w-full"
                onClick={handleConfirm}
              >
                SELECT FIGHTER
              </GameButton>
            </div>
          </div>
        )}

        {/* Fighter Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 gap-3">
            {FRUIT_FIGHTERS.map((fighter) => (
              <FighterCard
                key={fighter.id}
                fighter={fighter}
                isSelected={previewFighter?.id === fighter.id}
                onClick={() => handleSelect(fighter)}
                size="md"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
