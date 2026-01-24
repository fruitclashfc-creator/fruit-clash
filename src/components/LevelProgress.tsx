import { cn } from '@/lib/utils';
import { Star, Trophy, Crown } from 'lucide-react';

interface LevelProgressProps {
  currentLevel: number;
  totalWins: number;
  className?: string;
}

// Level requirements: wins needed to reach each level
const LEVEL_REQUIREMENTS = [
  0,   // Level 1: 0 wins (starting level)
  1,   // Level 2: 1 win
  3,   // Level 3: 2 more wins (1+2=3 total)
  7,   // Level 4: 4 more wins (3+4=7 total)
  13,  // Level 5: 6 more wins
  21,  // Level 6: 8 more wins
  31,  // Level 7: 10 more wins
  43,  // Level 8: 12 more wins
  57,  // Level 9: 14 more wins
  73,  // Level 10: 16 more wins
  91,  // Level 11: 18 more wins
  111, // Level 12: 20 more wins
  133, // Level 13: 22 more wins
  157, // Level 14: 24 more wins
  183, // Level 15: 26 more wins
  211, // Level 16: 28 more wins
  241, // Level 17: 30 more wins
  273, // Level 18: 32 more wins
  307, // Level 19: 34 more wins
  343, // Level 20: 36 more wins (MAX)
];

const MAX_LEVEL = 20;

export const calculateLevel = (totalWins: number): number => {
  for (let i = LEVEL_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (totalWins >= LEVEL_REQUIREMENTS[i]) {
      return Math.min(i + 1, MAX_LEVEL);
    }
  }
  return 1;
};

export const getWinsForLevel = (level: number): number => {
  if (level <= 1) return 0;
  if (level > MAX_LEVEL) return LEVEL_REQUIREMENTS[MAX_LEVEL - 1];
  return LEVEL_REQUIREMENTS[level - 1];
};

export const getWinsToNextLevel = (level: number): number => {
  if (level >= MAX_LEVEL) return 0;
  return LEVEL_REQUIREMENTS[level] - LEVEL_REQUIREMENTS[level - 1];
};

export const getLevelProgress = (totalWins: number): { current: number; needed: number; percentage: number } => {
  const level = calculateLevel(totalWins);
  if (level >= MAX_LEVEL) {
    return { current: 0, needed: 0, percentage: 100 };
  }
  
  const winsAtCurrentLevel = LEVEL_REQUIREMENTS[level - 1];
  const winsAtNextLevel = LEVEL_REQUIREMENTS[level];
  const winsIntoLevel = totalWins - winsAtCurrentLevel;
  const winsNeeded = winsAtNextLevel - winsAtCurrentLevel;
  const percentage = (winsIntoLevel / winsNeeded) * 100;
  
  return { 
    current: winsIntoLevel, 
    needed: winsNeeded, 
    percentage: Math.min(percentage, 100) 
  };
};

export const LevelProgress = ({ currentLevel, totalWins, className }: LevelProgressProps) => {
  const progress = getLevelProgress(totalWins);
  const isMaxLevel = currentLevel >= MAX_LEVEL;

  const getLevelIcon = () => {
    if (currentLevel >= 15) return <Crown className="w-5 h-5 text-game-legendary" />;
    if (currentLevel >= 10) return <Trophy className="w-5 h-5 text-game-legendary" />;
    return <Star className="w-5 h-5 text-primary" />;
  };

  const getLevelTier = () => {
    if (currentLevel >= 18) return { name: 'Mythic', color: 'text-pink-400' };
    if (currentLevel >= 15) return { name: 'Legendary', color: 'text-game-legendary' };
    if (currentLevel >= 12) return { name: 'Epic', color: 'text-purple-400' };
    if (currentLevel >= 8) return { name: 'Rare', color: 'text-blue-400' };
    if (currentLevel >= 4) return { name: 'Common', color: 'text-muted-foreground' };
    return { name: 'Novice', color: 'text-muted-foreground' };
  };

  const tier = getLevelTier();

  return (
    <div className={cn('bg-card/80 backdrop-blur-sm rounded-xl p-3 border border-border', className)}>
      {/* Level Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getLevelIcon()}
          <div>
            <span className="font-game-heading text-lg text-foreground">Level {currentLevel}</span>
            <span className={cn('text-xs ml-2', tier.color)}>({tier.name})</span>
          </div>
        </div>
        {isMaxLevel ? (
          <span className="text-xs text-game-legendary font-game-heading animate-pulse-glow">MAX</span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {progress.current}/{progress.needed} wins
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-muted rounded-full overflow-hidden">
        {/* Progress fill */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
            isMaxLevel 
              ? 'bg-gradient-to-r from-amber-400 via-primary to-amber-400 animate-shimmer' 
              : 'bg-gradient-to-r from-primary to-orange-400'
          )}
          style={{ width: `${progress.percentage}%` }}
        />
        
        {/* Level markers */}
        <div className="absolute inset-0 flex items-center justify-between px-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                (i + 1) * 20 <= progress.percentage 
                  ? 'bg-white/80' 
                  : 'bg-white/20'
              )}
            />
          ))}
        </div>
      </div>

      {/* Next level preview */}
      {!isMaxLevel && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {progress.needed - progress.current} more {progress.needed - progress.current === 1 ? 'win' : 'wins'} to Level {currentLevel + 1}
        </p>
      )}
    </div>
  );
};
