import { useState } from 'react';
import { FighterCard } from '@/components/FighterCard';
import { GameButton } from '@/components/ui/game-button';
import { HealthBar } from '@/components/HealthBar';
import { FRUIT_FIGHTERS, getRarityColor } from '@/data/fighters';
import { FruitFighter, GameScreen } from '@/types/game';
import { ArrowLeft, Sword, Shield, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FightersScreenProps {
  onNavigate: (screen: GameScreen) => void;
}

export const FightersScreen = ({ onNavigate }: FightersScreenProps) => {
  const [previewFighter, setPreviewFighter] = useState<FruitFighter | null>(FRUIT_FIGHTERS[0]);

  const handleSelect = (fighter: FruitFighter) => {
    setPreviewFighter(fighter);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <GameButton variant="ghost" size="icon" onClick={() => onNavigate('lobby')}>
          <ArrowLeft className="w-5 h-5" />
        </GameButton>
        <h1 className="font-game-title text-3xl text-glow-orange text-primary">
          FIGHTERS GALLERY
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
                getRarityColor(previewFighter.rarity)
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

              {/* Abilities */}
              <div className="w-full space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-game-heading text-primary">Abilities</span>
                </div>
                {previewFighter.abilities.map(ability => (
                  <div key={ability.id} className="bg-muted rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{ability.name}</span>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        ability.type === 'attack' && 'bg-destructive/20 text-destructive',
                        ability.type === 'defense' && 'bg-accent/20 text-accent',
                        ability.type === 'special' && 'bg-primary/20 text-primary'
                      )}>
                        {ability.type === 'attack' && `${ability.damage} DMG`}
                        {ability.type === 'defense' && `${ability.defense} DEF`}
                        {ability.type === 'special' && `${ability.damage} DMG`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{ability.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fighter Grid */}
        <div className="flex-1 overflow-y-auto">
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
