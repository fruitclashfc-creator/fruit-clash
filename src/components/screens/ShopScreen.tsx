import { useState, useEffect, useRef } from 'react';
import { GameButton } from '@/components/ui/game-button';
import { GameScreen, Player, Rarity } from '@/types/game';
import { ArrowLeft, Zap, Gem } from 'lucide-react';
import { BOXES } from '@/data/boxes';
import { rollBox } from '@/data/boxes';
import { FRUIT_FIGHTERS, getRarityColor } from '@/data/fighters';
import { cn } from '@/lib/utils';

interface ShopScreenProps {
  player: Player;
  onNavigate: (screen: GameScreen) => void;
  onPurchaseBox: (cost: number, gems: number, fruitRarity: Rarity) => void;
}

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'mythic', 'legendary'];

const RARITY_GLOW: Record<Rarity, string> = {
  common: 'shadow-[0_0_30px_hsl(230,15%,50%,0.5)]',
  rare: 'shadow-[0_0_40px_hsl(210,100%,55%,0.6)]',
  epic: 'shadow-[0_0_50px_hsl(280,80%,60%,0.7)]',
  mythic: 'shadow-[0_0_60px_hsl(340,80%,55%,0.8)]',
  legendary: 'shadow-[0_0_80px_hsl(45,100%,60%,0.9)]',
};

const RARITY_BG: Record<Rarity, string> = {
  common: 'from-gray-600 to-gray-800',
  rare: 'from-blue-500 to-blue-800',
  epic: 'from-purple-500 to-purple-800',
  mythic: 'from-pink-500 to-rose-800',
  legendary: 'from-yellow-400 to-amber-700',
};

export const ShopScreen = ({ player, onNavigate, onPurchaseBox }: ShopScreenProps) => {
  const [openingResult, setOpeningResult] = useState<{
    fruit: Rarity;
    gems: number;
    fighter: typeof FRUIT_FIGHTERS[0];
  } | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [starDropPhase, setStarDropPhase] = useState<'cycling' | 'slowing' | 'reveal' | null>(null);
  const [cyclingRarity, setCyclingRarity] = useState<Rarity>('common');
  const [cyclingFighter, setCyclingFighter] = useState<typeof FRUIT_FIGHTERS[0] | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getFighterByRarity = (rarity: Rarity) => {
    const fighters = FRUIT_FIGHTERS.filter(f => f.rarity === rarity);
    return fighters[Math.floor(Math.random() * fighters.length)];
  };

  const getRandomFighter = () => {
    const f = FRUIT_FIGHTERS[Math.floor(Math.random() * FRUIT_FIGHTERS.length)];
    return f;
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleBuyBox = (boxIndex: number) => {
    const box = BOXES[boxIndex];
    if (player.thunderPoints < box.cost || isOpening) return;

    setIsOpening(true);
    setStarDropPhase('cycling');

    // Fast cycling phase
    let speed = 80;
    let count = 0;
    const maxCycles = 25;

    const cycle = () => {
      const f = getRandomFighter();
      setCyclingRarity(f.rarity);
      setCyclingFighter(f);
      count++;

      if (count >= maxCycles) {
        // Slowing phase
        setStarDropPhase('slowing');
        let slowCount = 0;
        const slowMax = 8;

        const slowCycle = () => {
          const sf = getRandomFighter();
          setCyclingRarity(sf.rarity);
          setCyclingFighter(sf);
          slowCount++;
          speed += 80;

          if (slowCount >= slowMax) {
            // Reveal
            const result = rollBox(box);
            const fighter = getFighterByRarity(result.fruit);
            setCyclingRarity(result.fruit);
            setCyclingFighter(fighter);
            setStarDropPhase('reveal');

            setTimeout(() => {
              setOpeningResult({ ...result, fighter });
              setStarDropPhase(null);
              setIsOpening(false);
              onPurchaseBox(box.cost, result.gems, result.fruit);
            }, 1200);
          } else {
            setTimeout(slowCycle, speed);
          }
        };
        setTimeout(slowCycle, speed);
      } else {
        setTimeout(cycle, speed);
      }
    };
    setTimeout(cycle, speed);
  };

  return (
    <div className="min-h-screen flex flex-col p-3 sm:p-4 animate-slide-up safe-area-inset">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <GameButton variant="ghost" size="icon" onClick={() => onNavigate('lobby')}>
          <ArrowLeft className="w-5 h-5" />
        </GameButton>
        <h1 className="font-game-title text-2xl sm:text-3xl text-glow-orange text-primary">SHOP</h1>
        <div className="w-12" />
      </div>

      {/* Currency Display */}
      <div className="flex justify-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-card/80 rounded-xl px-3 py-2 border border-border">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="font-game-heading text-sm text-yellow-400">{player.thunderPoints}</span>
          <span className="text-xs text-muted-foreground">TP</span>
        </div>
        <div className="flex items-center gap-2 bg-card/80 rounded-xl px-3 py-2 border border-border">
          <Gem className="w-4 h-4 text-cyan-400" />
          <span className="font-game-heading text-sm text-cyan-400">{player.gems}</span>
          <span className="text-xs text-muted-foreground">Gems</span>
        </div>
      </div>

      {/* Boxes Grid */}
      <div className="flex-1 space-y-3 max-w-lg mx-auto w-full">
        {BOXES.map((box, i) => {
          const canAfford = player.thunderPoints >= box.cost;
          return (
            <button
              key={box.type}
              disabled={!canAfford || isOpening}
              onClick={() => handleBuyBox(i)}
              className={cn(
                'w-full bg-card/80 backdrop-blur-sm rounded-2xl p-4 border-2 transition-all text-left active:scale-[0.98]',
                canAfford && !isOpening ? 'border-primary/50 hover:border-primary' : 'border-border opacity-60',
                box.type === 'legendary' && canAfford && 'box-glow-gold'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center text-4xl shrink-0',
                  box.type === 'legendary' && 'animate-pulse-glow'
                )}>
                  {box.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-game-heading text-base text-foreground">{box.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{box.description}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      💎 {Math.round(box.gemChance * 100)}%
                    </span>
                    {box.fruitRarityWeights.legendary > 0 && (
                      <span className="text-[10px] text-pink-400">
                        ⭐ {box.fruitRarityWeights.legendary}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-primary/20 rounded-lg px-3 py-2 shrink-0">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-game-heading text-sm text-primary">{box.cost}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Star Drop Opening Animation */}
      {(starDropPhase === 'cycling' || starDropPhase === 'slowing' || starDropPhase === 'reveal') && cyclingFighter && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center">
            {/* Rarity ring */}
            <div className={cn(
              'w-36 h-36 sm:w-44 sm:h-44 rounded-full mx-auto flex items-center justify-center border-4 transition-all duration-200',
              `bg-gradient-to-br ${RARITY_BG[cyclingRarity]}`,
              RARITY_GLOW[cyclingRarity],
              starDropPhase === 'reveal' && 'scale-110 border-4',
              starDropPhase === 'cycling' && 'animate-pulse',
              cyclingRarity === 'legendary' ? 'border-yellow-400' :
              cyclingRarity === 'mythic' ? 'border-pink-400' :
              cyclingRarity === 'epic' ? 'border-purple-400' :
              cyclingRarity === 'rare' ? 'border-blue-400' : 'border-gray-400'
            )}>
              <span className={cn(
                'text-7xl sm:text-8xl transition-transform duration-150',
                starDropPhase === 'reveal' && 'animate-bounce'
              )}>
                {cyclingFighter.emoji}
              </span>
            </div>

            {/* Rarity label */}
            <div className={cn(
              'mt-4 font-game-title text-2xl sm:text-3xl uppercase transition-all duration-200',
              getRarityColor(cyclingRarity),
              starDropPhase === 'reveal' && 'scale-125'
            )}>
              {starDropPhase === 'reveal' ? cyclingFighter.name : '???'}
            </div>
            <div className={cn(
              'font-game-heading text-sm uppercase mt-1',
              getRarityColor(cyclingRarity)
            )}>
              {cyclingRarity}
            </div>

            {/* Rarity indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {RARITY_ORDER.map(r => (
                <div
                  key={r}
                  className={cn(
                    'w-3 h-3 rounded-full transition-all duration-150',
                    r === cyclingRarity ? 'scale-150' : 'scale-100 opacity-40',
                    r === 'common' && 'bg-gray-400',
                    r === 'rare' && 'bg-blue-400',
                    r === 'epic' && 'bg-purple-400',
                    r === 'mythic' && 'bg-pink-400',
                    r === 'legendary' && 'bg-yellow-400',
                  )}
                />
              ))}
            </div>

            {starDropPhase !== 'reveal' && (
              <p className="font-game-heading text-sm text-muted-foreground mt-6 animate-pulse">
                {starDropPhase === 'cycling' ? 'Rolling...' : 'Almost there...'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Result Popup */}
      {openingResult && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 animate-scale-in">
          <div className={cn(
            'bg-card rounded-2xl p-6 sm:p-8 text-center border-2 max-w-sm mx-4 w-full',
            openingResult.fruit === 'legendary' ? 'border-yellow-400 box-glow-gold' :
            openingResult.fruit === 'mythic' ? 'border-pink-400 box-glow-purple' :
            'border-primary box-glow-orange'
          )}>
            <div className={cn(
              'w-24 h-24 rounded-full mx-auto flex items-center justify-center bg-gradient-to-br mb-4',
              RARITY_BG[openingResult.fruit]
            )}>
              <span className="text-5xl">{openingResult.fighter.emoji}</span>
            </div>
            <h2 className="font-game-title text-2xl text-foreground mb-1">
              {openingResult.fighter.name}
            </h2>
            <span className={cn(
              'uppercase font-bold text-sm',
              getRarityColor(openingResult.fruit)
            )}>
              {openingResult.fruit}
            </span>
            
            {openingResult.gems > 0 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <Gem className="w-5 h-5 text-cyan-400" />
                <span className="font-game-heading text-cyan-400">+{openingResult.gems} Gems!</span>
              </div>
            )}
            
            <GameButton
              variant="primary"
              className="mt-5 w-full"
              onClick={() => setOpeningResult(null)}
            >
              Awesome!
            </GameButton>
          </div>
        </div>
      )}
    </div>
  );
};
