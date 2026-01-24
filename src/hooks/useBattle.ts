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
    const { attacker, target, ability, targetIndex } = pendingAttack;
    let newOpponentTeam = [...state.opponent.team];
    let newPlayerScore = state.player.score;
    let log = '';
    
    // Calculate damage
    let damage = ability.damage;
    const defense = target.fighter.defense;
    const actualDamage = Math.max(5, damage - Math.floor(defense * 0.3) + Math.floor(Math.random() * 10 - 5));
    
    // Apply shield reduction if target has shield
    const finalDamage = target.fighter.hasShield ? Math.floor(actualDamage * 0.5) : actualDamage;
    
    const newHealth = Math.max(0, target.currentHealth - finalDamage);
    const wasKilled = newHealth === 0 && target.isAlive;
    
    newOpponentTeam[targetIndex] = {
      ...target,
      currentHealth: newHealth,
      isAlive: newHealth > 0,
      fighter: { ...target.fighter, currentHealth: newHealth, isAlive: newHealth > 0, hasShield: false },
    };
    
    // Award points
    if (finalDamage > 0) {
      newPlayerScore += POINTS_FOR_DAMAGE;
    }
    if (wasKilled) {
      newPlayerScore += POINTS_FOR_KILL;
    }
    
    log = `${attacker.fighter.name} uses ${ability.name} on ${target.fighter.name} for ${finalDamage} damage!`;
    if (wasKilled) {
      log += ` ${target.fighter.name} was defeated!`;
    }
    
    // Check for winner
    const winner = newPlayerScore >= WINNING_SCORE ? 'player' : null;
    
    const newState: BattleState = {
      ...state,
      opponent: { ...state.opponent, team: newOpponentTeam },
      player: { ...state.player, score: newPlayerScore },
      turn: winner ? state.turn : 'opponent',
      phase: winner ? 'game_over' : 'select_action',
      pendingAttack: null,
      selectedFighterIndex: null,
      battleLog: [...state.battleLog, log],
      winner,
    };
    
    // Trigger bot turn if needed
    if (!winner && state.opponent.isBot) {
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
      
      // Pick random ability
      const abilityIndex = Math.floor(Math.random() * botFighter.fighter.abilities.length);
      const ability = botFighter.fighter.abilities[abilityIndex];
      
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
      
      // Bot attacks
      let newPlayerTeam = [...prev.player.team];
      let newOpponentScore = prev.opponent.score;
      
      const damage = ability.damage;
      const defense = targetMember.fighter.defense;
      const actualDamage = Math.max(5, damage - Math.floor(defense * 0.3) + Math.floor(Math.random() * 10 - 5));
      const finalDamage = targetMember.fighter.hasShield ? Math.floor(actualDamage * 0.5) : actualDamage;
      
      const newHealth = Math.max(0, targetMember.currentHealth - finalDamage);
      const wasKilled = newHealth === 0 && targetMember.isAlive;
      
      newPlayerTeam[targetIndex] = {
        ...targetMember,
        currentHealth: newHealth,
        isAlive: newHealth > 0,
        fighter: { ...targetMember.fighter, currentHealth: newHealth, isAlive: newHealth > 0, hasShield: false },
      };
      
      if (finalDamage > 0) newOpponentScore += POINTS_FOR_DAMAGE;
      if (wasKilled) newOpponentScore += POINTS_FOR_KILL;
      
      let log = `${botFighter.fighter.name} uses ${ability.name} on ${targetMember.fighter.name} for ${finalDamage} damage!`;
      if (wasKilled) log += ` ${targetMember.fighter.name} was defeated!`;
      
      const winner = newOpponentScore >= WINNING_SCORE ? 'opponent' : null;
      
      return {
        ...prev,
        player: { ...prev.player, team: newPlayerTeam },
        opponent: { ...prev.opponent, score: newOpponentScore },
        turn: winner ? prev.turn : 'player',
        phase: winner ? 'game_over' : 'select_action',
        battleLog: [...prev.battleLog, log],
        winner,
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
