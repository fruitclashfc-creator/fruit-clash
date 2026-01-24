import { useEffect, useState } from 'react';
import { GameButton } from '@/components/ui/game-button';
import { cn } from '@/lib/utils';
import { Star, Crown, Trophy, Sparkles } from 'lucide-react';

interface LevelUpPopupProps {
  previousLevel: number;
  newLevel: number;
  onClose: () => void;
}

export const LevelUpPopup = ({ previousLevel, newLevel, onClose }: LevelUpPopupProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Delay content appearance for dramatic effect
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const getLevelIcon = (level: number) => {
    if (level >= 15) return <Crown className="w-12 h-12 text-game-legendary" />;
    if (level >= 10) return <Trophy className="w-12 h-12 text-game-legendary" />;
    return <Star className="w-12 h-12 text-primary" />;
  };

  const getLevelTier = (level: number) => {
    if (level >= 18) return { name: 'Mythic', color: 'text-pink-400', bg: 'from-pink-500/20 to-purple-500/20' };
    if (level >= 15) return { name: 'Legendary', color: 'text-game-legendary', bg: 'from-amber-500/20 to-orange-500/20' };
    if (level >= 12) return { name: 'Epic', color: 'text-purple-400', bg: 'from-purple-500/20 to-pink-500/20' };
    if (level >= 8) return { name: 'Rare', color: 'text-blue-400', bg: 'from-blue-500/20 to-cyan-500/20' };
    if (level >= 4) return { name: 'Common', color: 'text-muted-foreground', bg: 'from-muted/20 to-card/20' };
    return { name: 'Novice', color: 'text-muted-foreground', bg: 'from-muted/20 to-card/20' };
  };

  const tier = getLevelTier(newLevel);
  const tierChanged = getLevelTier(previousLevel).name !== tier.name;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
      {/* Particle effects background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `hsl(${35 + Math.random() * 30}, 100%, ${50 + Math.random() * 20}%)`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      <div className={cn(
        'relative bg-gradient-to-br rounded-3xl p-8 text-center border-2 border-primary max-w-md mx-4 w-full',
        'transform transition-all duration-500',
        tier.bg,
        showContent ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
      )}>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl -z-10" />
        
        {/* Sparkle decorations */}
        <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-primary animate-pulse" />
        <Sparkles className="absolute -bottom-4 -left-4 w-8 h-8 text-primary animate-pulse" style={{ animationDelay: '0.5s' }} />

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse-glow" />
            {getLevelIcon(newLevel)}
          </div>
        </div>

        {/* Title */}
        <h2 className="font-game-title text-4xl text-glow-gold text-primary mb-2 animate-bounce">
          LEVEL UP!
        </h2>

        {/* Level transition */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center">
            <span className="font-game-heading text-2xl text-muted-foreground">{previousLevel}</span>
          </div>
          <div className="text-2xl animate-pulse">→</div>
          <div className="text-center">
            <span className="font-game-title text-4xl text-foreground text-glow-orange">{newLevel}</span>
          </div>
        </div>

        {/* Tier badge */}
        <div className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6',
          tierChanged ? 'bg-primary/20 animate-pulse-glow' : 'bg-muted/30'
        )}>
          <span className={cn('font-game-heading', tier.color)}>
            {tierChanged ? `NEW TIER: ${tier.name}!` : tier.name}
          </span>
        </div>

        {/* Congratulations message */}
        <p className="text-muted-foreground mb-6">
          Keep battling to unlock even greater power!
        </p>

        {/* Close button */}
        <GameButton 
          variant="primary" 
          size="lg"
          onClick={onClose}
          className="w-full"
        >
          Awesome!
        </GameButton>
      </div>
    </div>
  );
};
