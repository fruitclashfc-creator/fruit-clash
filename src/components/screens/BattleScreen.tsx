import { useState, useEffect, useRef } from 'react';
import { GameButton } from '@/components/ui/game-button';
import { HealthBar } from '@/components/HealthBar';
import { BattleState, GameScreen, TeamMember, Ability } from '@/types/game';
import { ArrowLeft, RotateCcw, Shield, Swords, X, Snowflake, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRarityColor } from '@/data/fighters';
import { BattleAnimations, useBattleAnimations } from '@/components/BattleAnimations';

interface BattleScreenProps {
  battleState: BattleState;
  onProceedFromCoinToss: () => void;
  onSelectFighter: (index: number) => void;
  onUseAbility: (abilityIndex: number, targetIndex: number) => void;
  onDefend: (defenderIndex: number | null) => void;
  onSkipDefense: () => void;
  onNavigate: (screen: GameScreen) => void;
  onRestart?: () => void;
  onVictory?: () => void;
  onDefeat?: () => void;
  // Multiplayer props
  isMultiplayer?: boolean;
  isMyTurn?: boolean;
  isBeingAttacked?: boolean;
  opponentName?: string;
  waitingForOpponent?: boolean;
}

const WINNING_SCORE = 15;

export const BattleScreen = ({ 
  battleState, 
  onProceedFromCoinToss,
  onSelectFighter,
  onUseAbility,
  onDefend,
  onSkipDefense,
  onNavigate,
  onRestart,
  onVictory,
  onDefeat,
  isMultiplayer = false,
  isMyTurn = true,
  isBeingAttacked,
  opponentName,
  waitingForOpponent = false,
}: BattleScreenProps) => {
  const [selectedAbility, setSelectedAbility] = useState<{ index: number; ability: Ability } | null>(null);
  const [showAbilityPopup, setShowAbilityPopup] = useState(false);
  const [damagedIndex, setDamagedIndex] = useState<{ isPlayer: boolean; index: number } | null>(null);
  
  const playerFighterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const opponentFighterRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const {
    projectile,
    particles,
    screenShake,
    fireProjectile,
    spawnParticles,
    triggerScreenShake,
    clearProjectile,
    removeParticle,
  } = useBattleAnimations();

  const { player, opponent, turn, phase, coinTossWinner, pendingAttack, battleLog, winner, selectedFighterIndex } = battleState;

  // Track victory/defeat - use a ref to prevent infinite loops
  const hasCalledResult = useRef(false);
  
  useEffect(() => {
    if (winner === 'player' && onVictory && !hasCalledResult.current) {
      hasCalledResult.current = true;
      onVictory();
    } else if (winner === 'opponent' && onDefeat && !hasCalledResult.current) {
      hasCalledResult.current = true;
      onDefeat();
    }
    // Reset when winner changes to null (new battle)
    if (winner === null) {
      hasCalledResult.current = false;
    }
  }, [winner, onVictory, onDefeat]);

  // Reset selection when turn changes
  useEffect(() => {
    if (turn !== 'player') {
      setSelectedAbility(null);
      setShowAbilityPopup(false);
    }
  }, [turn]);

  // Trigger animations when an attack resolves
  useEffect(() => {
    if (pendingAttack && phase === 'defense_choice') {
      // Fire projectile from attacker to target
      const attackerIsBot = pendingAttack.isFromBot;
      const fromRef = attackerIsBot 
        ? opponentFighterRefs.current[pendingAttack.attackerIndex]
        : playerFighterRefs.current[pendingAttack.attackerIndex];
      const toRef = attackerIsBot
        ? playerFighterRefs.current[pendingAttack.targetIndex]
        : opponentFighterRefs.current[pendingAttack.targetIndex];
      
      fireProjectile(
        fromRef,
        toRef,
        pendingAttack.ability.type,
        pendingAttack.attacker.fighter.emoji
      );
    }
  }, [pendingAttack, phase]);

  const handleFighterClick = (index: number) => {
    const canAct = isMultiplayer ? isMyTurn : turn === 'player';
    if (phase !== 'select_action' || !canAct) return;
    if (!player.team[index].isAlive) return;
    if (player.team[index].frozenTurns > 0) return; // Can't use frozen fighters
    
    onSelectFighter(index);
    setShowAbilityPopup(true);
    setSelectedAbility(null);
  };

  const handleAbilitySelect = (abilityIndex: number, ability: Ability) => {
    setSelectedAbility({ index: abilityIndex, ability });
  };

  const handleTargetSelect = (targetIndex: number) => {
    if (!selectedAbility || selectedFighterIndex === null) return;
    
    // Heal targets friendly team
    if (selectedAbility.ability.type === 'heal') {
      if (!player.team[targetIndex].isAlive) return;
      onUseAbility(selectedAbility.index, targetIndex);
      setShowAbilityPopup(false);
      setSelectedAbility(null);
      return;
    }
    
    if (!opponent.team[targetIndex].isAlive) return;
    
    // Fire projectile animation
    const fromRef = playerFighterRefs.current[selectedFighterIndex];
    const toRef = opponentFighterRefs.current[targetIndex];
    
    fireProjectile(fromRef, toRef, selectedAbility.ability.type, player.team[selectedFighterIndex].fighter.emoji);
    
    setTimeout(() => {
      spawnParticles(toRef, selectedAbility.ability.type === 'special' ? 'special' : 'hit');
      triggerScreenShake(selectedAbility.ability.type === 'special' ? 'heavy' : 'light');
      setDamagedIndex({ isPlayer: false, index: targetIndex });
      setTimeout(() => setDamagedIndex(null), 300);
    }, 400);
    
    onUseAbility(selectedAbility.index, targetIndex);
    setShowAbilityPopup(false);
    setSelectedAbility(null);
  };

  const handleDefenseSelect = (defenderIndex: number) => {
    const targetRef = playerFighterRefs.current[pendingAttack?.targetIndex ?? 0];
    spawnParticles(targetRef, 'shield');
    triggerScreenShake('light');
    onDefend(defenderIndex);
  };

  const handleSkipDefense = () => {
    const targetRef = playerFighterRefs.current[pendingAttack?.targetIndex ?? 0];
    const wasKilled = pendingAttack && pendingAttack.target.currentHealth <= (pendingAttack.ability.damage || 0);
    
    spawnParticles(targetRef, wasKilled ? 'kill' : 'hit');
    triggerScreenShake(wasKilled ? 'heavy' : 'light');
    setDamagedIndex({ isPlayer: true, index: pendingAttack?.targetIndex ?? 0 });
    setTimeout(() => setDamagedIndex(null), 300);
    
    onSkipDefense();
  };

  // Find fighters with defense ability that still have uses left
  const defendersWithShield = player.team
    .map((m, i) => ({ member: m, index: i }))
    .filter(({ member }) => {
      if (!member.isAlive) return false;
      return member.fighter.abilities.some(a => {
        if (a.type !== 'defense' && !a.canDefendWhileAttacking) return false;
        const uses = member.abilityUses[a.id] || 0;
        return a.maxUses === undefined || uses < a.maxUses;
      });
    });

  const renderFighterSlot = (member: TeamMember, index: number, isPlayer: boolean) => {
    const isSelected = isPlayer && selectedFighterIndex === index;
    const isHealTarget = isPlayer && selectedAbility?.ability.type === 'heal' && member.isAlive;
    const isTargetable = !isPlayer && selectedAbility && selectedAbility.ability.type !== 'heal' && member.isAlive;
    const isDamaged = damagedIndex?.isPlayer === isPlayer && damagedIndex?.index === index;
    const isFrozen = member.frozenTurns > 0;
    
    return (
      <div
        key={member.fighter.id + index}
        ref={(el) => {
          if (isPlayer) {
            playerFighterRefs.current[index] = el;
          } else {
            opponentFighterRefs.current[index] = el;
          }
        }}
        onClick={() => {
          if (isHealTarget) {
            handleTargetSelect(index);
          } else if (isPlayer) {
            handleFighterClick(index);
          } else if (isTargetable) {
            handleTargetSelect(index);
          }
        }}
        className={cn(
          'flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer',
          'w-16 sm:w-20',
          member.isAlive ? 'opacity-100' : 'opacity-40 grayscale',
          isSelected && 'ring-2 ring-primary scale-110',
          isTargetable && 'ring-2 ring-destructive animate-pulse',
          isHealTarget && 'ring-2 ring-green-400 animate-pulse',
          isPlayer && turn === 'player' && member.isAlive && !isFrozen && 'hover:scale-105',
          isFrozen && member.isAlive && 'ring-2 ring-cyan-400',
          isDamaged && 'animate-damage-flash'
        )}
      >
        <div className={cn(
          'w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-gradient-to-br border relative',
          member.fighter.color,
          isPlayer ? 'border-primary/50' : 'border-destructive/50',
          member.fighter.hasShield && 'ring-2 ring-blue-400',
          isFrozen && member.isAlive && 'bg-cyan-200/30'
        )}>
          <span className={cn("text-2xl sm:text-3xl", isFrozen && member.isAlive && "opacity-60")}>{member.fighter.emoji}</span>
          {member.fighter.hasShield && (
            <Shield className="absolute -top-1 -right-1 w-4 h-4 text-blue-400" />
          )}
          {isFrozen && member.isAlive && (
            <Snowflake className="absolute -top-1 -left-1 w-4 h-4 text-cyan-400 animate-pulse" />
          )}
        </div>
        <span className={cn(
          'text-xs mt-1 font-medium truncate w-full text-center',
          getRarityColor(member.fighter.rarity)
        )}>
          {member.fighter.name}
        </span>
        {isFrozen && member.isAlive && (
          <span className="text-[10px] text-cyan-400 font-bold">❄️ {member.frozenTurns}T</span>
        )}
        <HealthBar 
          current={member.currentHealth} 
          max={member.fighter.maxHealth}
          size="sm"
        />
      </div>
    );
  };

  return (
    <div className={cn(
      'min-h-screen min-h-[100dvh] flex flex-col p-2 sm:p-3 animate-slide-up safe-area-inset',
      screenShake && 'animate-screen-shake'
    )}>
      {/* Battle Animations Layer */}
      <BattleAnimations
        projectile={projectile}
        particles={particles}
        screenShake={false}
        onProjectileComplete={clearProjectile}
        onParticleComplete={removeParticle}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <GameButton variant="ghost" size="icon" onClick={() => onNavigate('lobby')}>
          <ArrowLeft className="w-5 h-5" />
        </GameButton>
        <div className="text-center">
          <h1 className="font-game-title text-xl text-glow-orange text-primary">
            {isMultiplayer ? `VS ${opponentName || 'PLAYER'}` : (opponent.isBot ? 'VS BOT' : 'PVP BATTLE')}
          </h1>
          <p className="text-xs text-muted-foreground">First to {WINNING_SCORE} points wins!</p>
        </div>
        <div className="w-12" />
      </div>

      {/* Score Display */}
      <div className="flex justify-center gap-8 mb-3">
        <div className="text-center">
          <span className="font-game-title text-2xl text-primary">{player.score}</span>
          <p className="text-xs text-muted-foreground">You</p>
        </div>
        <div className="flex items-center">
          <Swords className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <span className="font-game-title text-2xl text-destructive">{opponent.score}</span>
          <p className="text-xs text-muted-foreground">Opponent</p>
        </div>
      </div>

      {/* Turn Indicator */}
      <div className={cn(
        'text-center py-2 px-4 rounded-full mx-auto mb-3',
        (isMultiplayer ? isMyTurn : turn === 'player') ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
      )}>
        <span className="font-game-heading text-sm">
          {(isMultiplayer ? isMyTurn : turn === 'player') ? 'Your Turn' : "Opponent's Turn"}
        </span>
      </div>

      {/* Opponent Team */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground text-center mb-2">Opponent Team</p>
        <div className="flex justify-center gap-1 sm:gap-2 overflow-x-auto pb-2">
          {opponent.team.map((member, index) => renderFighterSlot(member, index, false))}
        </div>
      </div>

      {/* VS Divider */}
      <div className="flex items-center justify-center py-2">
        <div className="h-px bg-border flex-1" />
        <div className="bg-primary px-4 py-1 rounded-full mx-4">
          <span className="font-game-title text-sm text-primary-foreground">VS</span>
        </div>
        <div className="h-px bg-border flex-1" />
      </div>

      {/* Player Team */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground text-center mb-2">Your Team (Click to select)</p>
        <div className="flex justify-center gap-1 sm:gap-2 overflow-x-auto pb-2">
          {player.team.map((member, index) => renderFighterSlot(member, index, true))}
        </div>
      </div>

      {/* Battle Log */}
      <div className="flex-1 bg-card/80 backdrop-blur-sm rounded-xl p-3 mb-3 overflow-y-auto border border-border min-h-[80px] max-h-[120px]">
        {battleLog.slice(-4).map((log, i) => (
          <p key={i} className="text-sm text-muted-foreground">
            {log}
          </p>
        ))}
      </div>

      {/* Waiting for Opponent Overlay (Multiplayer) */}
      {waitingForOpponent && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-8 text-center border-2 border-secondary max-w-sm mx-4">
            <div className="w-16 h-16 rounded-full border-4 border-secondary border-t-transparent animate-spin mx-auto mb-4" />
            <h2 className="font-game-title text-2xl text-foreground mb-2">WAITING...</h2>
            <p className="text-muted-foreground mb-4">
              Waiting for {opponentName || 'opponent'} to select their team
            </p>
            <GameButton variant="ghost" onClick={() => onNavigate('lobby')}>
              <ArrowLeft className="w-4 h-4" />
              Leave Match
            </GameButton>
          </div>
        </div>
      )}

      {/* Coin Toss Overlay */}
      {phase === 'coin_toss' && !waitingForOpponent && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 animate-scale-in">
          <div className="bg-card rounded-2xl p-8 text-center border-2 border-primary box-glow-orange max-w-sm mx-4">
            <span className="text-6xl mb-4 block animate-bounce">🪙</span>
            <h2 className="font-game-title text-2xl text-foreground mb-2">COIN TOSS!</h2>
            <p className="text-muted-foreground mb-6">
              {coinTossWinner === 'player' 
                ? 'You go first! Select a fighter and use an ability.' 
                : 'Opponent goes first. Prepare to defend!'}
            </p>
            <GameButton variant="primary" onClick={onProceedFromCoinToss}>
              Start Battle!
            </GameButton>
          </div>
        </div>
      )}

      {/* Ability Selection Popup */}
      {showAbilityPopup && selectedFighterIndex !== null && phase === 'select_action' && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card rounded-2xl p-6 border-2 border-primary max-w-sm mx-4 w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-game-heading text-lg">
                {player.team[selectedFighterIndex].fighter.name}'s Abilities
              </h3>
              <GameButton variant="ghost" size="icon" onClick={() => setShowAbilityPopup(false)}>
                <X className="w-4 h-4" />
              </GameButton>
            </div>
            
            <div className="space-y-3">
              {player.team[selectedFighterIndex].fighter.abilities.map((ability, i) => {
                const uses = player.team[selectedFighterIndex].abilityUses[ability.id] || 0;
                const maxUses = ability.maxUses;
                const isExhausted = maxUses !== undefined && uses >= maxUses;
                const remainingUses = maxUses !== undefined ? maxUses - uses : null;
                
                return (
                  <button
                    key={ability.id}
                    onClick={() => !isExhausted && handleAbilitySelect(i, ability)}
                    disabled={isExhausted}
                    className={cn(
                      'w-full p-3 rounded-xl border text-left transition-all',
                      isExhausted && 'opacity-40 cursor-not-allowed',
                      !isExhausted && selectedAbility?.index === i 
                        ? 'border-primary bg-primary/20' 
                        : !isExhausted ? 'border-border hover:border-primary/50' : 'border-border',
                      !isExhausted && ability.type === 'attack' && 'hover:bg-destructive/10',
                      !isExhausted && ability.type === 'defense' && 'hover:bg-blue-500/10',
                      !isExhausted && ability.type === 'special' && 'hover:bg-amber-500/10',
                      !isExhausted && ability.type === 'freeze' && 'hover:bg-cyan-500/10',
                      !isExhausted && ability.type === 'heal' && 'hover:bg-green-500/10'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{ability.name}</span>
                      <div className="flex items-center gap-2">
                        {remainingUses !== null && (
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            isExhausted ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'
                          )}>
                            {isExhausted ? '✗ Used' : `${remainingUses}/${maxUses}`}
                          </span>
                        )}
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full',
                          ability.type === 'attack' && 'bg-destructive/20 text-destructive',
                          ability.type === 'defense' && 'bg-blue-500/20 text-blue-400',
                          ability.type === 'special' && 'bg-amber-500/20 text-amber-400',
                          ability.type === 'freeze' && 'bg-cyan-500/20 text-cyan-400',
                          ability.type === 'heal' && 'bg-green-500/20 text-green-400'
                        )}>
                          {ability.type === 'attack' && `${ability.damage} DMG`}
                          {ability.type === 'defense' && `${ability.defense} DEF`}
                          {ability.type === 'special' && `${ability.damage} DMG`}
                          {ability.type === 'freeze' && `🧊 ${ability.freezeTurns}T`}
                          {ability.type === 'heal' && `💚 ${ability.healAmount} HP`}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{ability.description}</p>
                  </button>
                );
              })}
            </div>
            
            {selectedAbility && (
              <p className="text-sm text-primary text-center mt-4">
                {selectedAbility.ability.type === 'defense' 
                  ? 'Click to apply shield!' 
                  : selectedAbility.ability.type === 'heal'
                    ? '💚 Click a teammate to heal!'
                    : selectedAbility.ability.type === 'freeze'
                      ? '🧊 Click an enemy to freeze!'
                      : 'Now click an enemy to attack!'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Defense Choice Popup - Show only when I need to defend */}
      {phase === 'defense_choice' && pendingAttack && (isMultiplayer ? isBeingAttacked : true) && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 animate-scale-in">
          <div className="bg-card rounded-2xl p-6 border-2 border-destructive max-w-md mx-4 w-full">
            <div className="text-center mb-4">
              <span className="text-5xl mb-3 block animate-bounce">{pendingAttack.ability.type === 'freeze' ? '🧊' : '⚔️'}</span>
              <h3 className="font-game-title text-2xl text-destructive">
                {pendingAttack.ability.type === 'freeze' ? 'INCOMING FREEZE!' : 'INCOMING ATTACK!'}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-semibold text-foreground">{pendingAttack.attacker.fighter.name}</span> is using{' '}
                <span className="font-semibold text-amber-400">{pendingAttack.ability.name}</span> on{' '}
                <span className="font-semibold text-primary">{pendingAttack.target.fighter.name}</span>!
              </p>
              <p className="text-xs text-destructive mt-1">
                {pendingAttack.ability.type === 'freeze' 
                  ? `Will freeze for ${pendingAttack.ability.freezeTurns} turns!`
                  : `Potential damage: ~${pendingAttack.ability.damage} HP`}
              </p>
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-muted-foreground text-center mb-2">
                Do you want to defend with a shield fighter?
              </p>
              
              {defendersWithShield.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {defendersWithShield.map(({ member, index }) => (
                    <button
                      key={member.fighter.id + index}
                      onClick={() => handleDefenseSelect(index)}
                      className="flex flex-col items-center p-2 rounded-xl border-2 border-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all hover:scale-105"
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br border border-blue-400',
                        member.fighter.color
                      )}>
                        <span className="text-2xl">{member.fighter.emoji}</span>
                      </div>
                      <span className="text-xs mt-1 font-medium text-blue-400">
                        {member.fighter.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Defend
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center text-muted-foreground italic mb-4">
                  No shield fighters available!
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              {defendersWithShield.length > 0 && (
                <GameButton 
                  variant="accent" 
                  className="flex-1"
                  onClick={() => handleDefenseSelect(defendersWithShield[0].index)}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Quick Defend
                </GameButton>
              )}
              <GameButton 
                variant="ghost" 
                className="flex-1"
                onClick={handleSkipDefense}
              >
                Take the Hit
              </GameButton>
            </div>
          </div>
        </div>
      )}

      {/* Waiting for opponent's defense (Multiplayer - I attacked) */}
      {isMultiplayer && phase === 'defense_choice' && pendingAttack && !isBeingAttacked && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-8 text-center border-2 border-secondary max-w-sm mx-4">
            <div className="w-16 h-16 rounded-full border-4 border-secondary border-t-transparent animate-spin mx-auto mb-4" />
            <h2 className="font-game-title text-2xl text-foreground mb-2">ATTACK SENT!</h2>
            <p className="text-muted-foreground mb-4">
              Waiting for {opponentName || 'opponent'} to defend...
            </p>
            <p className="text-sm text-muted-foreground">
              {pendingAttack.attacker.fighter.name} → {pendingAttack.ability.name} → {pendingAttack.target.fighter.name}
            </p>
          </div>
        </div>
      )}

      {/* Waiting for opponent's turn (Multiplayer - not my turn to act) */}
      {isMultiplayer && phase === 'select_action' && !isMyTurn && !waitingForOpponent && (
        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/90 to-transparent p-6 z-40">
          <div className="bg-card/90 backdrop-blur-sm rounded-xl p-4 text-center border border-secondary max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
              <span className="font-game-heading text-foreground">
                {opponentName || 'Opponent'}'s turn...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Winner Overlay */}
      {winner && phase === 'game_over' && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-scale-in">
          <div className="bg-card rounded-2xl p-8 text-center border-2 border-primary box-glow-orange max-w-sm mx-4">
            <span className="text-6xl mb-4 block">
              {winner === 'player' ? '🏆' : '💀'}
            </span>
            <h2 className="font-game-title text-3xl text-foreground mb-2">
              {winner === 'player' ? 'VICTORY!' : 'DEFEAT'}
            </h2>
            <p className="text-muted-foreground mb-2">
              Final Score: {player.score} - {opponent.score}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {winner === 'player' 
                ? 'You dominated the arena!' 
                : 'Better luck next time...'}
            </p>
            <div className="flex gap-4 justify-center">
              <GameButton variant="ghost" onClick={() => onNavigate('lobby')}>
                <ArrowLeft className="w-4 h-4" />
                Lobby
              </GameButton>
              {onRestart && (
                <GameButton variant="primary" onClick={onRestart}>
                  <RotateCcw className="w-4 h-4" />
                  Rematch
                </GameButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
