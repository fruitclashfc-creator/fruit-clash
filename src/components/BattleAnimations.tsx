import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AbilityType } from '@/types/game';

interface Projectile {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: AbilityType;
  emoji: string;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  type: 'hit' | 'special' | 'shield' | 'kill';
}

interface BattleAnimationsProps {
  projectile: Projectile | null;
  particles: Particle[];
  screenShake: boolean;
  onProjectileComplete?: () => void;
  onParticleComplete?: (id: string) => void;
}

export const BattleAnimations = ({
  projectile,
  particles,
  screenShake,
  onProjectileComplete,
  onParticleComplete,
}: BattleAnimationsProps) => {
  return (
    <>
      {/* Screen Shake Overlay */}
      {screenShake && (
        <div className="fixed inset-0 pointer-events-none z-40 animate-screen-shake" />
      )}

      {/* Projectile */}
      {projectile && (
        <ProjectileEffect 
          {...projectile} 
          onComplete={onProjectileComplete}
        />
      )}

      {/* Particles */}
      {particles.map((particle) => (
        <ParticleEffect
          key={particle.id}
          {...particle}
          onComplete={() => onParticleComplete?.(particle.id)}
        />
      ))}
    </>
  );
};

interface ProjectileEffectProps extends Projectile {
  onComplete?: () => void;
}

const ProjectileEffect = ({ 
  fromX, fromY, toX, toY, type, emoji, onComplete 
}: ProjectileEffectProps) => {
  const [position, setPosition] = useState({ x: fromX, y: fromY });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Animate to target
    const timeout = setTimeout(() => {
      setPosition({ x: toX, y: toY });
    }, 50);

    // Complete after animation
    const complete = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 500);

    return () => {
      clearTimeout(timeout);
      clearTimeout(complete);
    };
  }, [fromX, fromY, toX, toY, onComplete]);

  if (!visible) return null;

  const getProjectileStyle = () => {
    switch (type) {
      case 'attack':
        return 'from-destructive to-orange-500';
      case 'special':
        return 'from-amber-400 to-primary';
      case 'defense':
        return 'from-blue-400 to-cyan-400';
      default:
        return 'from-primary to-secondary';
    }
  };

  return (
    <div
      className={cn(
        'fixed z-50 pointer-events-none transition-all duration-500 ease-out',
        'flex items-center justify-center'
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Projectile glow */}
      <div className={cn(
        'absolute w-16 h-16 rounded-full blur-xl opacity-60 bg-gradient-to-r',
        getProjectileStyle()
      )} />
      
      {/* Projectile core */}
      <div className={cn(
        'relative w-12 h-12 rounded-full flex items-center justify-center',
        'bg-gradient-to-r shadow-lg animate-pulse-glow',
        getProjectileStyle()
      )}>
        <span className="text-2xl animate-spin-slow">{emoji}</span>
      </div>

      {/* Trail effect */}
      <div className={cn(
        'absolute w-20 h-4 -left-16 rounded-full blur-md opacity-40 bg-gradient-to-l',
        getProjectileStyle()
      )} />
    </div>
  );
};

interface ParticleEffectProps extends Particle {
  onComplete?: () => void;
}

const ParticleEffect = ({ x, y, type, onComplete }: ParticleEffectProps) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      onComplete?.();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [onComplete]);

  const getParticles = () => {
    switch (type) {
      case 'hit':
        return ['💥', '⚡', '✨'];
      case 'special':
        return ['🌟', '⭐', '💫', '✨', '🔥'];
      case 'shield':
        return ['🛡️', '💠', '❄️'];
      case 'kill':
        return ['💀', '☠️', '💥', '🔥', '⚡'];
      default:
        return ['✨'];
    }
  };

  const particles = getParticles();

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {particles.map((emoji, i) => (
        <span
          key={i}
          className="absolute text-2xl animate-particle-burst"
          style={{
            '--particle-angle': `${(360 / particles.length) * i}deg`,
            '--particle-distance': type === 'kill' ? '80px' : '50px',
            animationDelay: `${i * 50}ms`,
          } as React.CSSProperties}
        >
          {emoji}
        </span>
      ))}

      {/* Impact flash */}
      <div className={cn(
        'absolute w-24 h-24 rounded-full animate-impact-flash',
        type === 'hit' && 'bg-destructive/50',
        type === 'special' && 'bg-amber-400/50',
        type === 'shield' && 'bg-blue-400/50',
        type === 'kill' && 'bg-destructive/70'
      )} />
    </div>
  );
};

// Hook to manage battle animations
export const useBattleAnimations = () => {
  const [projectile, setProjectile] = useState<Projectile | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [screenShake, setScreenShake] = useState(false);

  const fireProjectile = (
    fromElement: HTMLElement | null,
    toElement: HTMLElement | null,
    type: AbilityType,
    emoji: string
  ) => {
    if (!fromElement || !toElement) return;

    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    setProjectile({
      id: Date.now().toString(),
      fromX: fromRect.left + fromRect.width / 2,
      fromY: fromRect.top + fromRect.height / 2,
      toX: toRect.left + toRect.width / 2,
      toY: toRect.top + toRect.height / 2,
      type,
      emoji,
    });
  };

  const spawnParticles = (
    element: HTMLElement | null,
    type: 'hit' | 'special' | 'shield' | 'kill'
  ) => {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const newParticle: Particle = {
      id: Date.now().toString(),
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      type,
    };

    setParticles((prev) => [...prev, newParticle]);
  };

  const triggerScreenShake = (intensity: 'light' | 'heavy' = 'light') => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), intensity === 'heavy' ? 600 : 300);
  };

  const clearProjectile = () => setProjectile(null);
  
  const removeParticle = (id: string) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    projectile,
    particles,
    screenShake,
    fireProjectile,
    spawnParticles,
    triggerScreenShake,
    clearProjectile,
    removeParticle,
  };
};

export type { Projectile, Particle };
