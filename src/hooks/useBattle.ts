import { useState, useCallback } from 'react';
import { BattleState, FruitFighter, TeamMember, Ability, PendingAttack } from '@/types/game';
import { getRandomTeam } from '@/data/fighters';

const POINTS_FOR_DAMAGE = 1;
const POINTS_FOR_KILL = 2;
const WINNING_SCORE = 15;

const createTeamMember = (fighter: FruitFighter): TeamMember => ({
  fighter: { ...fighter, currentHealth: fighter.maxHealth, isAlive: true },
  currentHealth: fighter.maxHealth,
  isAlive: true,
  cooldowns: {},
  abilityUses: {},
  frozenTurns: 0,
});

// Decrement frozen turns for all team members at end of a turn
const tickFrozenTurns = (team: TeamMember[]): TeamMember[] =>
  team.map(m => m.frozenTurns > 0
    ? { ...m, frozenTurns: m.frozenTurns - 1 }
    : m
  );

export const useBattle = () => {
  const [battleState, setBattleState] = useState<BattleState | null>(null);

  const startBattle = useCallback((playerTeam: FruitFighter[], isBot: boolean) => {
    const opponentTeam = getRandomTeam(6);
    
    const coinToss = Math.random() > 0.5 ? 'player' : 'opponent';
    
    setBattleState({
      player: {
        team: playerTeam.map(createTeamMember),
        score: 0,
        isBot: false,
      },
      opponent: {
        team: opponentTeam.map(createTeamMember),
        score: 0,
        isBot,
      },
      turn: coinToss,
      phase: 'coin_toss',
      coinTossWinner: coinToss,
      pendingAttack: null,
      battleLog: [`Coin toss! ${coinToss === 'player' ? 'You go' : 'Opponent goes'} first!`],
      winner: null,
      selectedFighterIndex: null,
    });
  }, []);

  const proceedFromCoinToss = useCallback(() => {
    setBattleState(prev => {
      if (!prev) return prev;
      
      if (prev.turn === 'opponent' && prev.opponent.isBot) {
        setTimeout(() => executeBotTurn(), 1000);
      }
      
      return {
        ...prev,
        phase: 'select_action',
      };
    });
  }, []);

  const selectFighter = useCallback((index: number) => {
    setBattleState(prev => {
      if (!prev || prev.phase !== 'select_action' || prev.turn !== 'player') return prev;
      return {
        ...prev,
        selectedFighterIndex: index,
      };
    });
  }, []);

  const useAbility = useCallback((abilityIndex: number, targetIndex: number) => {
    setBattleState(prev => {
      if (!prev || prev.selectedFighterIndex === null || prev.turn !== 'player') return prev;
      
      const attackerMember = prev.player.team[prev.selectedFighterIndex];
      const ability = attackerMember.fighter.abilities[abilityIndex];
      
      if (!attackerMember.isAlive) return prev;

      // Check ability uses
      const currentUses = attackerMember.abilityUses[ability.id] || 0;
      if (ability.maxUses !== undefined && currentUses >= ability.maxUses) return prev;
      
      // Track ability usage
      const updatedPlayerTeam = [...prev.player.team];
      updatedPlayerTeam[prev.selectedFighterIndex] = {
        ...attackerMember,
        abilityUses: {
          ...attackerMember.abilityUses,
          [ability.id]: currentUses + 1,
        },
      };
      const updatedState = { ...prev, player: { ...prev.player, team: updatedPlayerTeam } };

      // === HEAL ABILITY ===
      if (ability.type === 'heal') {
        const healTarget = updatedPlayerTeam[targetIndex];
        if (!healTarget.isAlive) return prev;
        const healAmount = ability.healAmount || 30;
        const newHealth = Math.min(healTarget.fighter.maxHealth, healTarget.currentHealth + healAmount);
        updatedPlayerTeam[targetIndex] = {
          ...healTarget,
          currentHealth: newHealth,
          fighter: { ...healTarget.fighter, currentHealth: newHealth },
        };
        const log = `💚 ${attackerMember.fighter.name} uses ${ability.name} to heal ${healTarget.fighter.name} for ${healAmount} HP!`;
        
        // Tick frozen turns for opponent at end of player turn
        const tickedOpponentTeam = tickFrozenTurns(prev.opponent.team);
        
        return {
          ...updatedState,
          player: { ...updatedState.player, team: updatedPlayerTeam },
          opponent: { ...prev.opponent, team: tickedOpponentTeam },
          turn: 'opponent',
          phase: 'select_action',
          selectedFighterIndex: null,
          battleLog: [...prev.battleLog, log],
        };
      }

      // === FREEZE ABILITY ===
      if (ability.type === 'freeze') {
        const freezeTarget = prev.opponent.team[targetIndex];
        if (!freezeTarget.isAlive) return prev;
        
        const pendingAttack: PendingAttack = {
          attacker: updatedPlayerTeam[prev.selectedFighterIndex],
          target: freezeTarget,
          ability,
          attackerIndex: prev.selectedFighterIndex,
          targetIndex,
        };
        
        // For bot opponent, auto-resolve (no defense)
        if (prev.opponent.isBot) {
          return executeAttack(updatedState, pendingAttack);
        }
        
        return {
          ...updatedState,
          pendingAttack,
          phase: 'defense_choice',
        };
      }
      
      if (ability.type === 'attack' || ability.type === 'special') {
        const targetMember = prev.opponent.team[targetIndex];
        if (!targetMember.isAlive) return prev;

        const pendingAttack: PendingAttack = {
          attacker: updatedPlayerTeam[prev.selectedFighterIndex],
          target: targetMember,
          ability,
          attackerIndex: prev.selectedFighterIndex,
          targetIndex,
        };
        
        if (prev.opponent.isBot) {
          return executeAttack(updatedState, pendingAttack);
        }
        
        return {
          ...updatedState,
          pendingAttack,
          phase: 'defense_choice',
        };
      } else if (ability.type === 'defense') {
        updatedPlayerTeam[prev.selectedFighterIndex] = {
          ...updatedPlayerTeam[prev.selectedFighterIndex],
          fighter: { ...attackerMember.fighter, hasShield: true },
        };
        const log = `${attackerMember.fighter.name} uses ${ability.name}!`;
        
        // Tick frozen turns for opponent at end of player turn
        const tickedOpponentTeam = tickFrozenTurns(prev.opponent.team);
        
        return {
          ...updatedState,
          player: { ...updatedState.player, team: updatedPlayerTeam },
          opponent: { ...prev.opponent, team: tickedOpponentTeam },
          turn: 'opponent',
          phase: 'select_action',
          selectedFighterIndex: null,
          battleLog: [...prev.battleLog, log],
        };
      }
      
      return prev;
    });
  }, []);

  const executeAttack = (state: BattleState, pendingAttack: PendingAttack, useDefender?: number): BattleState => {
    const { attacker, target, ability, targetIndex, attackerIndex, isFromBot } = pendingAttack;
    const isPlayerBeingAttacked = isFromBot === true;
    
    let targetTeam = isPlayerBeingAttacked ? [...state.player.team] : [...state.opponent.team];
    let attackerTeam = isPlayerBeingAttacked ? [...state.opponent.team] : [...state.player.team];
    let attackerScore = isPlayerBeingAttacked ? state.opponent.score : state.player.score;
    let defenderScore = isPlayerBeingAttacked ? state.player.score : state.opponent.score;
    
    const logs: string[] = [];

    // Check if defender used a defense ability — track its usage
    if (useDefender !== undefined) {
      const defender = targetTeam[useDefender];
      const defenseAbility = defender?.fighter.abilities.find(a => a.type === 'defense' || a.canDefendWhileAttacking);
      if (defenseAbility) {
        const defUses = defender.abilityUses[defenseAbility.id] || 0;
        targetTeam[useDefender] = {
          ...defender,
          abilityUses: {
            ...defender.abilityUses,
            [defenseAbility.id]: defUses + 1,
          },
        };
      }
    }

    // === FREEZE RESOLUTION ===
    if (ability.type === 'freeze') {
      const hasDefense = target.fighter.hasShield || useDefender !== undefined;
      if (hasDefense) {
        logs.push(`🛡️ Defended! ${attacker.fighter.name}'s freeze on ${target.fighter.name} was blocked!`);
        // Clear shield
        targetTeam[targetIndex] = {
          ...targetTeam[targetIndex],
          fighter: { ...target.fighter, hasShield: false },
        };
      } else {
        const freezeTurns = ability.freezeTurns || 3;
        targetTeam[targetIndex] = {
          ...targetTeam[targetIndex],
          frozenTurns: freezeTurns,
          fighter: { ...target.fighter, hasShield: false },
        };
        logs.push(`🧊 ${attacker.fighter.name} uses ${ability.name}! ${target.fighter.name} is frozen for ${freezeTurns} turns!`);
        attackerScore += POINTS_FOR_DAMAGE;
      }
      
      const winner = attackerScore >= WINNING_SCORE 
        ? (isPlayerBeingAttacked ? 'opponent' : 'player') 
        : defenderScore >= WINNING_SCORE 
          ? (isPlayerBeingAttacked ? 'player' : 'opponent')
          : null;
      
      const nextTurn = winner ? state.turn : (isPlayerBeingAttacked ? 'player' : 'opponent');
      
      // Tick frozen turns for the side whose turn just ended
      const tickedAttackerTeam = tickFrozenTurns(attackerTeam);
      
      const newState: BattleState = {
        ...state,
        player: isPlayerBeingAttacked 
          ? { ...state.player, team: targetTeam, score: defenderScore }
          : { ...state.player, team: tickedAttackerTeam, score: attackerScore },
        opponent: isPlayerBeingAttacked
          ? { ...state.opponent, team: tickedAttackerTeam, score: attackerScore }
          : { ...state.opponent, team: targetTeam, score: defenderScore },
        turn: nextTurn,
        phase: winner ? 'game_over' : 'select_action',
        pendingAttack: null,
        selectedFighterIndex: null,
        battleLog: [...state.battleLog, ...logs],
        winner,
      };
      
      if (!winner && nextTurn === 'opponent' && state.opponent.isBot) {
        setTimeout(() => executeBotTurn(), 1500);
      }
      
      return newState;
    }
    
    // === NORMAL ATTACK RESOLUTION ===
    let damage = ability.damage;
    const defense = target.fighter.defense;
    const actualDamage = Math.max(5, damage - Math.floor(defense * 0.3) + Math.floor(Math.random() * 10 - 5));
    
    let defenderAbility: Ability | undefined;
    if (useDefender !== undefined) {
      const defender = targetTeam[useDefender];
      defenderAbility = defender?.fighter.abilities.find(a => a.type === 'defense' || a.canDefendWhileAttacking);
    }
    
    const isReflected = defenderAbility?.reflectsDamage && 
      !ability.unstoppable &&
      defenderAbility.reflectTargetRarity?.includes(attacker.fighter.rarity as 'common' | 'rare');
    
    const counterAttackDamage = defenderAbility?.canDefendWhileAttacking ? defenderAbility.damage : 0;
    
    const hasDefense = target.fighter.hasShield || useDefender !== undefined;
    const finalDamage = hasDefense ? 0 : actualDamage;
    
    const newHealth = Math.max(0, target.currentHealth - finalDamage);
    const wasKilled = newHealth === 0 && target.isAlive;
    
    targetTeam[targetIndex] = {
      ...target,
      currentHealth: newHealth,
      isAlive: newHealth > 0,
      fighter: { ...target.fighter, currentHealth: newHealth, isAlive: newHealth > 0, hasShield: false },
    };
    
    if (finalDamage > 0) {
      attackerScore += POINTS_FOR_DAMAGE;
    }
    if (wasKilled) {
      attackerScore += POINTS_FOR_KILL;
    }
    
    let log = `${attacker.fighter.name} uses ${ability.name} on ${target.fighter.name} for ${finalDamage} damage!`;
    if (hasDefense) log = `🛡️ Defended! ` + log;
    if (wasKilled) {
      log += ` ${target.fighter.name} was defeated!`;
    }
    logs.push(log);
    
    if (isReflected) {
      const reflectDamage = defenderAbility!.damage;
      const attackerNewHealth = Math.max(0, attacker.currentHealth - reflectDamage);
      const attackerWasKilled = attackerNewHealth === 0 && attacker.isAlive;
      
      attackerTeam[attackerIndex] = {
        ...attacker,
        currentHealth: attackerNewHealth,
        isAlive: attackerNewHealth > 0,
        fighter: { ...attacker.fighter, currentHealth: attackerNewHealth, isAlive: attackerNewHealth > 0 },
      };
      
      logs.push(`🔄 ${target.fighter.name}'s Bounce Back reflects ${reflectDamage} damage to ${attacker.fighter.name}!`);
      
      if (attackerWasKilled) {
        logs.push(`💀 ${attacker.fighter.name} was defeated by the reflection!`);
        defenderScore += POINTS_FOR_KILL;
      }
      defenderScore += POINTS_FOR_DAMAGE;
    }
    
    if (counterAttackDamage > 0 && !isReflected) {
      const attackerNewHealth = Math.max(0, attacker.currentHealth - counterAttackDamage);
      const attackerWasKilled = attackerNewHealth === 0 && attacker.isAlive;
      
      attackerTeam[attackerIndex] = {
        ...attacker,
        currentHealth: attackerNewHealth,
        isAlive: attackerNewHealth > 0,
        fighter: { ...attacker.fighter, currentHealth: attackerNewHealth, isAlive: attackerNewHealth > 0 },
      };
      
      logs.push(`⚡ ${targetTeam[useDefender!].fighter.name}'s Radiant Beam counter-attacks for ${counterAttackDamage} damage!`);
      
      if (attackerWasKilled) {
        logs.push(`💀 ${attacker.fighter.name} was defeated by the counter-attack!`);
        defenderScore += POINTS_FOR_KILL;
      }
      defenderScore += POINTS_FOR_DAMAGE;
    }
    
    const winner = attackerScore >= WINNING_SCORE 
      ? (isPlayerBeingAttacked ? 'opponent' : 'player') 
      : defenderScore >= WINNING_SCORE 
        ? (isPlayerBeingAttacked ? 'player' : 'opponent')
        : null;
    
    const nextTurn = winner ? state.turn : (isPlayerBeingAttacked ? 'player' : 'opponent');

    // Tick frozen turns for the side whose turn just ended
    const tickedAttackerTeam = tickFrozenTurns(attackerTeam);
    
    const newState: BattleState = {
      ...state,
      player: isPlayerBeingAttacked 
        ? { ...state.player, team: targetTeam, score: defenderScore }
        : { ...state.player, team: tickedAttackerTeam, score: attackerScore },
      opponent: isPlayerBeingAttacked
        ? { ...state.opponent, team: tickedAttackerTeam, score: attackerScore }
        : { ...state.opponent, team: targetTeam, score: defenderScore },
      turn: nextTurn,
      phase: winner ? 'game_over' : 'select_action',
      pendingAttack: null,
      selectedFighterIndex: null,
      battleLog: [...state.battleLog, ...logs],
      winner,
    };
    
    if (!winner && nextTurn === 'opponent' && state.opponent.isBot) {
      setTimeout(() => executeBotTurn(), 1500);
    }
    
    return newState;
  };

  const defendWithFighter = useCallback((defenderIndex: number | null) => {
    setBattleState(prev => {
      if (!prev || !prev.pendingAttack) return prev;
      return executeAttack(prev, prev.pendingAttack, defenderIndex ?? undefined);
    });
  }, []);

  const skipDefense = useCallback(() => {
    setBattleState(prev => {
      if (!prev || !prev.pendingAttack) return prev;
      return executeAttack(prev, prev.pendingAttack);
    });
  }, []);

  const executeBotTurn = useCallback(() => {
    setBattleState(prev => {
      if (!prev || prev.turn !== 'opponent' || prev.winner) return prev;
      
      // Find alive AND not-frozen bot fighters
      const aliveFighters = prev.opponent.team
        .map((m, i) => ({ member: m, index: i }))
        .filter(({ member }) => member.isAlive && member.frozenTurns <= 0);
      
      if (aliveFighters.length === 0) {
        // All alive fighters are frozen — skip turn, tick frozen
        const tickedBotTeam = tickFrozenTurns(prev.opponent.team);
        return {
          ...prev,
          opponent: { ...prev.opponent, team: tickedBotTeam },
          turn: 'player',
          battleLog: [...prev.battleLog, `❄️ All opponent fighters are frozen! Turn skipped.`],
        };
      }
      
      const { member: botFighter, index: botIndex } = 
        aliveFighters[Math.floor(Math.random() * aliveFighters.length)];
      
      // Pick random ability (prefer attack, sometimes freeze/heal)
      const usableAbilities = botFighter.fighter.abilities.filter(a => {
        const uses = botFighter.abilityUses[a.id] || 0;
        return a.maxUses === undefined || uses < a.maxUses;
      });
      
      if (usableAbilities.length === 0) {
        // No abilities left, skip turn
        const tickedBotTeam = tickFrozenTurns(prev.opponent.team);
        return {
          ...prev,
          opponent: { ...prev.opponent, team: tickedBotTeam },
          turn: 'player',
          battleLog: [...prev.battleLog, `${botFighter.fighter.name} has no abilities left! Turn skipped.`],
        };
      }

      const attackAbilities = usableAbilities.filter(a => a.type === 'attack' || a.type === 'special' || a.type === 'freeze');
      const healAbilities = usableAbilities.filter(a => a.type === 'heal');
      const defenseAbilities = usableAbilities.filter(a => a.type === 'defense');
      
      // Bot AI: heal if any teammate is low
      const hurtTeammates = prev.opponent.team
        .map((m, i) => ({ member: m, index: i }))
        .filter(({ member }) => member.isAlive && member.currentHealth < member.fighter.maxHealth * 0.4);
      
      if (healAbilities.length > 0 && hurtTeammates.length > 0 && Math.random() > 0.5) {
        const healAbility = healAbilities[0];
        const healTarget = hurtTeammates[Math.floor(Math.random() * hurtTeammates.length)];
        const healAmount = healAbility.healAmount || 30;
        
        const newBotTeam = [...prev.opponent.team];
        const currentUses = botFighter.abilityUses[healAbility.id] || 0;
        newBotTeam[botIndex] = {
          ...botFighter,
          abilityUses: { ...botFighter.abilityUses, [healAbility.id]: currentUses + 1 },
        };
        
        const targetMember = newBotTeam[healTarget.index];
        const newHealth = Math.min(targetMember.fighter.maxHealth, targetMember.currentHealth + healAmount);
        newBotTeam[healTarget.index] = {
          ...targetMember,
          currentHealth: newHealth,
          fighter: { ...targetMember.fighter, currentHealth: newHealth },
        };
        
        // Tick frozen turns
        const tickedBotTeam = tickFrozenTurns(newBotTeam);
        
        return {
          ...prev,
          opponent: { ...prev.opponent, team: tickedBotTeam },
          turn: 'player',
          battleLog: [...prev.battleLog, `💚 ${botFighter.fighter.name} uses ${healAbility.name} to heal ${targetMember.fighter.name} for ${healAmount} HP!`],
        };
      }
      
      const ability = attackAbilities.length > 0 
        ? attackAbilities[Math.floor(Math.random() * attackAbilities.length)]
        : defenseAbilities.length > 0 
          ? defenseAbilities[0]
          : usableAbilities[0];

      // Track bot ability usage
      const newBotTeam = [...prev.opponent.team];
      const currentUses = botFighter.abilityUses[ability.id] || 0;
      newBotTeam[botIndex] = {
        ...botFighter,
        abilityUses: { ...botFighter.abilityUses, [ability.id]: currentUses + 1 },
      };
      const updatedState = { ...prev, opponent: { ...prev.opponent, team: newBotTeam } };
      
      // Find alive player fighters to target
      const alivePlayerFighters = prev.player.team
        .map((m, i) => ({ member: m, index: i }))
        .filter(({ member }) => member.isAlive);
      
      if (alivePlayerFighters.length === 0) return prev;
      
      // For freeze, target non-frozen fighters preferably
      let targetPool = alivePlayerFighters;
      if (ability.type === 'freeze') {
        const nonFrozen = alivePlayerFighters.filter(({ member }) => member.frozenTurns <= 0);
        if (nonFrozen.length > 0) targetPool = nonFrozen;
      }
      
      const { member: targetMember, index: targetIndex } = 
        targetPool[Math.floor(Math.random() * targetPool.length)];
      
      if (ability.type === 'defense') {
        newBotTeam[botIndex] = {
          ...newBotTeam[botIndex],
          fighter: { ...botFighter.fighter, hasShield: true },
        };
        
        const tickedBotTeam = tickFrozenTurns(newBotTeam);
        
        return {
          ...updatedState,
          opponent: { ...updatedState.opponent, team: tickedBotTeam },
          turn: 'player',
          battleLog: [...prev.battleLog, `${botFighter.fighter.name} uses ${ability.name}!`],
        };
      }
      
      // Bot attacks or freezes — show defense choice popup to player!
      const pendingAttack: PendingAttack = {
        attacker: newBotTeam[botIndex],
        target: targetMember,
        ability,
        attackerIndex: botIndex,
        targetIndex,
        isFromBot: true,
      };
      
      return {
        ...updatedState,
        pendingAttack,
        phase: 'defense_choice',
        battleLog: [...prev.battleLog, `${botFighter.fighter.name} is ${ability.type === 'freeze' ? 'freezing' : 'attacking'} ${targetMember.fighter.name}!`],
      };
    });
  }, []);

  const restartBattle = useCallback(() => {
    if (battleState) {
      const playerTeam = battleState.player.team.map(m => m.fighter);
      startBattle(playerTeam, battleState.opponent.isBot);
    }
  }, [battleState, startBattle]);

  return {
    battleState,
    startBattle,
    proceedFromCoinToss,
    selectFighter,
    useAbility,
    defendWithFighter,
    skipDefense,
    restartBattle,
  };
};
