import { useEffect, useState } from 'react';
import { Star, Trophy, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelUpNotificationProps {
  newLevel: number;
  onClose: () => void;
}

export const LevelUpNotification = ({ newLevel, onClose }: LevelUpNotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getLevelIcon = () => {
    if (newLevel >= 15) return <Crown className="w-8 h-8 text-amber-400" />;
    if (newLevel >= 10) return <Trophy className="w-8 h-8 text-amber-400" />;
    return <Star className="w-8 h-8 text-primary" />;
  };

  const getTierName = () => {
    if (newLevel >= 18) return { name: 'Mythic', color: 'text-pink-400' };
    if (newLevel >= 15) return { name: 'Legendary', color: 'text-amber-400' };
    if (newLevel >= 12) return { name: 'Epic', color: 'text-purple-400' };
    if (newLevel >= 8) return { name: 'Rare', color: 'text-blue-400' };
    if (newLevel >= 4) return { name: 'Common', color: 'text-muted-foreground' };
    return { name: 'Novice', color: 'text-muted-foreground' };
  };

  const tier = getTierName();

  return (
    <div
      className={cn(
        'fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      )}
    >
      <div className="bg-card/95 backdrop-blur-sm rounded-xl px-6 py-4 border-2 border-primary shadow-lg flex items-center gap-4">
        <div className="animate-bounce">
          {getLevelIcon()}
        </div>
        <div>
          <p className="font-game-heading text-lg text-foreground">
            Level Up! 🎉
          </p>
          <p className="text-sm text-muted-foreground">
            You reached <span className="font-bold text-primary">Level {newLevel}</span>
            <span className={cn('ml-1', tier.color)}>({tier.name})</span>
          </p>
        </div>
      </div>
    </div>
  );
};