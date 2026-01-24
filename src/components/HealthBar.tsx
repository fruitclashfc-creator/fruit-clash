import { cn } from '@/lib/utils';

interface HealthBarProps {
  current: number;
  max: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'health' | 'energy';
}

export const HealthBar = ({ 
  current, 
  max, 
  label, 
  showValue = true, 
  size = 'md',
  variant = 'health' 
}: HealthBarProps) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  const getBarColor = () => {
    if (variant === 'energy') return 'bg-game-energy';
    if (percentage > 50) return 'bg-game-health';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-destructive';
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-game-heading text-foreground">{label}</span>
          )}
          {showValue && (
            <span className="text-sm font-bold text-foreground">
              {current}/{max}
            </span>
          )}
        </div>
      )}
      <div className={cn(
        'w-full rounded-full bg-muted overflow-hidden border border-border',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getBarColor()
          )}
          style={{ width: `${percentage}%` }}
        >
          <div className="h-full w-full bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </div>
    </div>
  );
};
