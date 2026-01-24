import { useState } from 'react';
import { GameButton } from '@/components/ui/game-button';
import { FruitFighter, GameScreen } from '@/types/game';
import { FRUIT_FIGHTERS, getRarityColor } from '@/data/fighters';
import { ArrowLeft, Check, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HealthBar } from '@/components/HealthBar';

interface TeamSelectScreenProps {
  onTeamSelected: (team: FruitFighter[]) => void;
  onNavigate: (screen: GameScreen) => void;
}

const TEAM_SIZE = 6;

export const TeamSelectScreen = ({ onTeamSelected, onNavigate }: TeamSelectScreenProps) => {
  const [selectedTeam, setSelectedTeam] = useState<FruitFighter[]>([]);
  const [selectedForDetails, setSelectedForDetails] = useState<FruitFighter | null>(null);

  const toggleFighter = (fighter: FruitFighter) => {
    const isSelected = selectedTeam.some(f => f.id === fighter.id);
    
    if (isSelected) {
      setSelectedTeam(prev => prev.filter(f => f.id !== fighter.id));
    } else if (selectedTeam.length < TEAM_SIZE) {
      setSelectedTeam(prev => [...prev, fighter]);
    }
  };

  const handleConfirm = () => {
    if (selectedTeam.length === TEAM_SIZE) {
      onTeamSelected(selectedTeam);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <GameButton variant="ghost" size="icon" onClick={() => onNavigate('mode-select')}>
          <ArrowLeft className="w-5 h-5" />
        </GameButton>
        <h1 className="font-game-title text-2xl text-glow-orange text-primary">
          SELECT YOUR TEAM
        </h1>
        <div className="w-12" />
      </div>

      {/* Selection Counter */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <span className="font-game-heading text-lg">
          {selectedTeam.length} / {TEAM_SIZE}
        </span>
      </div>

      {/* Selected Team Preview */}
      <div className="bg-card/50 rounded-xl p-3 mb-4 border border-border">
        <p className="text-xs text-muted-foreground text-center mb-2">Your Team</p>
        <div className="flex justify-center gap-2">
          {[...Array(TEAM_SIZE)].map((_, i) => {
            const fighter = selectedTeam[i];
            return (
              <div
                key={i}
                className={cn(
                  'w-12 h-12 rounded-lg border-2 border-dashed flex items-center justify-center',
                  fighter ? 'border-primary bg-primary/10' : 'border-muted-foreground/30'
                )}
              >
                {fighter ? (
                  <span className="text-2xl">{fighter.emoji}</span>
                ) : (
                  <span className="text-muted-foreground/50">?</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fighter Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {FRUIT_FIGHTERS.map(fighter => {
            const isSelected = selectedTeam.some(f => f.id === fighter.id);
            const isDisabled = !isSelected && selectedTeam.length >= TEAM_SIZE;
            
            return (
              <div
                key={fighter.id}
                onClick={() => !isDisabled && toggleFighter(fighter)}
                onDoubleClick={() => setSelectedForDetails(fighter)}
                className={cn(
                  'relative p-3 rounded-xl border-2 transition-all cursor-pointer',
                  'flex flex-col items-center',
                  isSelected && 'border-primary bg-primary/10 scale-105',
                  !isSelected && !isDisabled && 'border-border hover:border-primary/50',
                  isDisabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br',
                  fighter.color
                )}>
                  <span className="text-3xl">{fighter.emoji}</span>
                </div>
                
                <span className={cn(
                  'text-xs mt-2 font-medium',
                  getRarityColor(fighter.rarity)
                )}>
                  {fighter.name}
                </span>
                
                <span className="text-xs text-muted-foreground capitalize">
                  {fighter.rarity}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fighter Details Modal */}
      {selectedForDetails && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedForDetails(null)}
        >
          <div 
            className="bg-card rounded-2xl p-6 border-2 border-primary max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={cn(
                'w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br',
                selectedForDetails.color
              )}>
                <span className="text-4xl">{selectedForDetails.emoji}</span>
              </div>
              <div>
                <h3 className="font-game-heading text-xl">{selectedForDetails.name}</h3>
                <span className={cn('text-sm capitalize', getRarityColor(selectedForDetails.rarity))}>
                  {selectedForDetails.rarity}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <HealthBar current={selectedForDetails.health} max={selectedForDetails.maxHealth} label="Health" />
              <div className="flex justify-between text-sm">
                <span>Attack: {selectedForDetails.attack}</span>
                <span>Defense: {selectedForDetails.defense}</span>
                <span>Speed: {selectedForDetails.speed}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Abilities:</h4>
              {selectedForDetails.abilities.map(ability => (
                <div key={ability.id} className="bg-background/50 rounded-lg p-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{ability.name}</span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      ability.type === 'attack' && 'bg-destructive/20 text-destructive',
                      ability.type === 'defense' && 'bg-blue-500/20 text-blue-400',
                      ability.type === 'special' && 'bg-amber-500/20 text-amber-400'
                    )}>
                      {ability.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ability.description}</p>
                </div>
              ))}
            </div>

            <GameButton 
              variant="ghost" 
              className="w-full mt-4"
              onClick={() => setSelectedForDetails(null)}
            >
              Close
            </GameButton>
          </div>
        </div>
      )}

      {/* Confirm Button */}
      <GameButton
        variant="primary"
        size="lg"
        className="w-full mt-4"
        onClick={handleConfirm}
        disabled={selectedTeam.length !== TEAM_SIZE}
      >
        {selectedTeam.length === TEAM_SIZE 
          ? 'Start Battle!' 
          : `Select ${TEAM_SIZE - selectedTeam.length} more fighters`}
      </GameButton>
    </div>
  );
};
