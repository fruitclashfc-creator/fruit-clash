import { GameButton } from '@/components/ui/game-button';
import { GameScreen, FruitFighter } from '@/types/game';
import { ArrowLeft, Bot, Users, Swords, Zap } from 'lucide-react';

interface ModeSelectScreenProps {
  selectedFighter: FruitFighter | null;
  onStartBattle: (vsBot: boolean) => void;
  onNavigate: (screen: GameScreen) => void;
}

export const ModeSelectScreen = ({ selectedFighter, onStartBattle, onNavigate }: ModeSelectScreenProps) => {
  if (!selectedFighter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-slide-up">
        <div className="text-center">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h2 className="font-game-title text-2xl text-foreground mb-4">
            No Fighter Selected
          </h2>
          <p className="text-muted-foreground mb-6">
            Choose a fighter before entering battle!
          </p>
          <GameButton variant="primary" onClick={() => onNavigate('fighters')}>
            Choose Fighter
          </GameButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <GameButton variant="ghost" size="icon" onClick={() => onNavigate('lobby')}>
          <ArrowLeft className="w-5 h-5" />
        </GameButton>
        <h1 className="font-game-title text-3xl text-glow-orange text-primary">
          SELECT MODE
        </h1>
      </div>

      {/* Selected Fighter Display */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-card to-muted border-2 border-primary flex items-center justify-center box-glow-orange">
            <span className="text-5xl animate-float">{selectedFighter.emoji}</span>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary px-3 py-1 rounded-lg">
            <span className="font-game-heading text-xs text-primary-foreground">
              {selectedFighter.name}
            </span>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="w-full space-y-6">
          {/* VS Bot Mode */}
          <div 
            onClick={() => onStartBattle(true)}
            className="group cursor-pointer bg-card/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-muted hover:border-accent transition-all hover:box-glow-cyan"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent to-cyan-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot className="w-8 h-8 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-game-heading text-xl text-foreground mb-1">VS BOT</h3>
                <p className="text-sm text-muted-foreground">
                  Practice against AI opponents
                </p>
              </div>
              <Swords className="w-6 h-6 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-game-energy" />
              <span className="text-xs text-muted-foreground">Instant match • No waiting</span>
            </div>
          </div>

          {/* Multiplayer Mode */}
          <div 
            onClick={() => onStartBattle(false)}
            className="group cursor-pointer bg-card/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-muted hover:border-secondary transition-all hover:box-glow-purple"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-secondary to-purple-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-game-heading text-xl text-foreground mb-1">MULTIPLAYER</h3>
                <p className="text-sm text-muted-foreground">
                  Battle real players online
                </p>
              </div>
              <Swords className="w-6 h-6 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-game-health animate-pulse" />
              <span className="text-xs text-muted-foreground">42 players online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
