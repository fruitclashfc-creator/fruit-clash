import { useState } from 'react';
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

export const ShopScreen = ({ player, onNavigate, onPurchaseBox }: ShopScreenProps) => {
  const [openingResult, setOpeningResult] = useState<{
    fruit: Rarity;
    gems: number;
    fighter: typeof FRUIT_FIGHTERS[0];
  } | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  const getFighterByRarity = (rarity: Rarity) => {
    const fighters = FRUIT_FIGHTERS.filter(f => f.rarity === rarity);
    return fighters[Math.floor(Math.random() * fighters.length)];
  };

  const handleBuyBox = (boxIndex: number) => {
    const box = BOXES[boxIndex];
    if (player.thunderPoints < box.cost) return;

    setIsOpening(true);
    
    // Animate opening
    setTimeout(() => {
      const result = rollBox(box);
      const fighter = getFighterByRarity(result.fruit);
      setOpeningResult({ ...result, fighter });
      setIsOpening(false);
      onPurchaseBox(box.cost, result.gems, result.fruit);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <GameButton variant="ghost" size="icon" onClick={() => onNavigate('lobby')}>
          <ArrowLeft className="w-5 h-5" />
        </GameButton>
        <h1 className="font-game-title text-3xl text-glow-orange text-primary">SHOP</h1>
        <div className="w-12" />
      </div>

      {/* Currency Display */}
      <div className="flex justify-center gap-4 mb-8">
        <div className="flex items-center gap-2 bg-card/80 rounded-xl px-4 py-2 border border-border">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span className="font-game-heading text-yellow-400">{player.thunderPoints}</span>
          <span className="text-xs text-muted-foreground">Thunder</span>
        </div>
        <div className="flex items-center gap-2 bg-card/80 rounded-xl px-4 py-2 border border-border">
          <Gem className="w-5 h-5 text-cyan-400" />
          <span className="font-game-heading text-cyan-400">{player.gems}</span>
          <span className="text-xs text-muted-foreground">Gems</span>
        </div>
      </div>

      {/* Boxes */}
      <div className="flex-1 space-y-4 max-w-lg mx-auto w-full">
        {BOXES.map((box, i) => {
          const canAfford = player.thunderPoints >= box.cost;
          return (
            <div
              key={box.type}
              className={cn(
                'bg-card/80 backdrop-blur-sm rounded-2xl p-5 border-2 transition-all',
                canAfford ? 'border-primary/50 hover:border-primary' : 'border-border opacity-60',
                box.type === 'legendary' && canAfford && 'box-glow-gold'
              )}
            >
              <div className="flex items-center gap-4">
                <span className="text-5xl">{box.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-game-heading text-lg text-foreground">{box.name}</h3>
                  <p className="text-xs text-muted-foreground">{box.description}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">
                      💎 Gem chance: {Math.round(box.gemChance * 100)}%
                    </span>
                    {box.fruitRarityWeights.legendary > 0 && (
                      <span className="text-xs text-pink-400">
                        ⭐ Legend: {box.fruitRarityWeights.legendary}%
                      </span>
                    )}
                  </div>
                </div>
                <GameButton
                  variant={box.type === 'legendary' ? 'gold' : box.type === 'premium' ? 'secondary' : 'primary'}
                  size="sm"
                  disabled={!canAfford}
                  onClick={() => handleBuyBox(i)}
                >
                  <Zap className="w-4 h-4" />
                  {box.cost}
                </GameButton>
              </div>
            </div>
          );
        })}
      </div>

      {/* Opening Animation */}
      {isOpening && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center">
            <span className="text-8xl block animate-bounce">📦</span>
            <p className="font-game-title text-2xl text-primary mt-4 animate-pulse">Opening...</p>
          </div>
        </div>
      )}

      {/* Result Popup */}
      {openingResult && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 animate-scale-in">
          <div className="bg-card rounded-2xl p-8 text-center border-2 border-primary box-glow-orange max-w-sm mx-4">
            <span className="text-7xl block mb-4">{openingResult.fighter.emoji}</span>
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
              <div className="mt-4 flex items-center justify-center gap-2">
                <Gem className="w-5 h-5 text-cyan-400" />
                <span className="font-game-heading text-cyan-400">+{openingResult.gems} Gems!</span>
              </div>
            )}
            
            <GameButton
              variant="primary"
              className="mt-6"
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
