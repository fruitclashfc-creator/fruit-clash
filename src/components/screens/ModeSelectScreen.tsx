import { GameButton } from '@/components/ui/game-button';
import { GameScreen } from '@/types/game';
import { ArrowLeft, Bot, Users, Swords, Zap } from 'lucide-react';

interface ModeSelectScreenProps {
  onStartBattle: (vsBot: boolean) => void;
  onNavigate: (screen: GameScreen) => void;
}

export const ModeSelectScreen = ({ onStartBattle, onNavigate }: ModeSelectScreenProps) => {
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

      {/* Mode Info */}
      <div className="text-center mb-8">
        <p className="text-muted-foreground">
          Choose your battle mode. You'll select your team of 6 fighters next!
        </p>
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
            onClick={() => onNavigate('multiplayer')}
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
              <span className="text-xs text-muted-foreground">See who's online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
