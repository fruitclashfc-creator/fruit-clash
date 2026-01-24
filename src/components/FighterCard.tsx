import { FruitFighter } from '@/types/game';
import { getRarityColor } from '@/data/fighters';
import { cn } from '@/lib/utils';

interface FighterCardProps {
  fighter: FruitFighter;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const FighterCard = ({ fighter, isSelected, onClick, size = 'md' }: FighterCardProps) => {
  const sizeClasses = {
    sm: 'w-24 h-32',
    md: 'w-32 h-44',
    lg: 'w-40 h-56',
  };

  const emojiSizes = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-6xl',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-2xl cursor-pointer transition-all duration-300 card-gradient border-2 overflow-hidden group',
        sizeClasses[size],
        isSelected 
          ? 'border-primary box-glow-orange scale-105' 
          : 'border-muted hover:border-primary/50 hover:scale-102',
        getRarityColor(fighter.rarity)
      )}
    >
      {/* Rarity glow background */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-20',
        fighter.color
      )} />
      
      {/* Character emoji */}
      <div className="flex flex-col items-center justify-center h-full p-2 relative z-10">
        <span className={cn('animate-float', emojiSizes[size])}>
          {fighter.emoji}
        </span>
        
        <div className="mt-2 text-center">
          <h3 className={cn(
            'font-game-heading text-foreground',
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          )}>
            {fighter.name}
          </h3>
          <span className={cn(
            'uppercase font-bold text-xs',
            fighter.rarity === 'legendary' && 'text-pink-400',
            fighter.rarity === 'mythic' && 'text-game-legendary',
            fighter.rarity === 'epic' && 'text-game-epic',
            fighter.rarity === 'rare' && 'text-game-rare',
            fighter.rarity === 'common' && 'text-game-common'
          )}>
            {fighter.rarity}
          </span>
        </div>

        {/* Stats bar */}
        {size !== 'sm' && (
          <div className="absolute bottom-2 left-2 right-2 flex gap-1">
            <div className="flex-1 h-1 rounded bg-destructive/60" title="Attack" />
            <div className="flex-1 h-1 rounded bg-game-health/60" title="Defense" />
            <div className="flex-1 h-1 rounded bg-game-energy/60" title="Speed" />
          </div>
        )}
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <span className="text-xs">✓</span>
        </div>
      )}
    </div>
  );
};
