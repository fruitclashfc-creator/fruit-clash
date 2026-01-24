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
});

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
      
      // If bot goes first, trigger bot action
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
      const targetMember = prev.opponent.team[targetIndex];
      
      if (!attackerMember.isAlive || !targetMember.isAlive) return prev;
      
      let newOpponentTeam = [...prev.opponent.team];
      let newPlayerScore = prev.player.score;
      let log = '';
      
      if (ability.type === 'attack' || ability.type === 'special') {
        // Check if opponent wants to defend (creates pending attack)
        const pendingAttack: PendingAttack = {
          attacker: attackerMember,
          target: targetMember,
          ability,
          attackerIndex: prev.selectedFighterIndex,
          targetIndex,
        };
        
        // For bot opponent, auto-resolve defense
        if (prev.opponent.isBot) {
          return executeAttack(prev, pendingAttack);
        }
        
        // For human opponent, show defense choice
        return {
          ...prev,
          pendingAttack,
          phase: 'defense_choice',
        };
      } else if (ability.type === 'defense') {
        // Defense abilities give shield to a teammate
        const newPlayerTeam = [...prev.player.team];
        newPlayerTeam[prev.selectedFighterIndex] = {
          ...attackerMember,
          fighter: { ...attackerMember.fighter, hasShield: true },
        };
        log = `${attackerMember.fighter.name} uses ${ability.name}!`;
        
        return {
          ...prev,
          player: { ...prev.player, team: newPlayerTeam },
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
    const { attacker, target, ability, targetIndex, isFromBot } = pendingAttack;
    const isPlayerBeingAttacked = isFromBot === true;
    
    // Get the right teams based on who is being attacked
    let targetTeam = isPlayerBeingAttacked ? [...state.player.team] : [...state.opponent.team];
    let attackerScore = isPlayerBeingAttacked ? state.opponent.score : state.player.score;
    
    // Calculate damage
    let damage = ability.damage;
    const defense = target.fighter.defense;
    const actualDamage = Math.max(5, damage - Math.floor(defense * 0.3) + Math.floor(Math.random() * 10 - 5));
    
    // Apply shield - completely blocks damage if target has shield or defender was used
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
    
    // Award points to attacker
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
    
    // Check for winner
    const winner = attackerScore >= WINNING_SCORE 
      ? (isPlayerBeingAttacked ? 'opponent' : 'player') 
      : null;
    
    // Determine next turn
    const nextTurn = winner ? state.turn : (isPlayerBeingAttacked ? 'player' : 'opponent');
    
    const newState: BattleState = {
      ...state,
      player: isPlayerBeingAttacked 
        ? { ...state.player, team: targetTeam }
        : { ...state.player, score: attackerScore },
      opponent: isPlayerBeingAttacked
        ? { ...state.opponent, score: attackerScore }
        : { ...state.opponent, team: targetTeam },
      turn: nextTurn,
      phase: winner ? 'game_over' : 'select_action',
      pendingAttack: null,
      selectedFighterIndex: null,
      battleLog: [...state.battleLog, log],
      winner,
    };
    
    // Trigger bot turn if it's now opponent's turn and opponent is bot
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
      
      // Find alive bot fighters
      const aliveFighters = prev.opponent.team
        .map((m, i) => ({ member: m, index: i }))
        .filter(({ member }) => member.isAlive);
      
      if (aliveFighters.length === 0) return prev;
      
      // Pick random alive fighter
      const { member: botFighter, index: botIndex } = 
        aliveFighters[Math.floor(Math.random() * aliveFighters.length)];
      
      // Pick random ability (prefer attack abilities)
      const attackAbilities = botFighter.fighter.abilities.filter(a => a.type === 'attack' || a.type === 'special');
      const ability = attackAbilities.length > 0 
        ? attackAbilities[Math.floor(Math.random() * attackAbilities.length)]
        : botFighter.fighter.abilities[0];
      
      // Find alive player fighters to target
      const alivePlayerFighters = prev.player.team
        .map((m, i) => ({ member: m, index: i }))
        .filter(({ member }) => member.isAlive);
      
      if (alivePlayerFighters.length === 0) return prev;
      
      const { member: targetMember, index: targetIndex } = 
        alivePlayerFighters[Math.floor(Math.random() * alivePlayerFighters.length)];
      
      if (ability.type === 'defense') {
        // Bot uses defense
        const newBotTeam = [...prev.opponent.team];
        newBotTeam[botIndex] = {
          ...botFighter,
          fighter: { ...botFighter.fighter, hasShield: true },
        };
        
        return {
          ...prev,
          opponent: { ...prev.opponent, team: newBotTeam },
          turn: 'player',
          battleLog: [...prev.battleLog, `${botFighter.fighter.name} uses ${ability.name}!`],
        };
      }
      
      // Bot attacks - show defense choice popup to player!
      const pendingAttack: PendingAttack = {
        attacker: botFighter,
        target: targetMember,
        ability,
        attackerIndex: botIndex,
        targetIndex,
        isFromBot: true,
      };
      
      return {
        ...prev,
        pendingAttack,
        phase: 'defense_choice',
        battleLog: [...prev.battleLog, `${botFighter.fighter.name} is attacking ${targetMember.fighter.name}!`],
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
