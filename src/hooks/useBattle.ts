import { useState, useCallback } from 'react';
import { BattleState, FruitFighter } from '@/types/game';
import { getRandomFighter } from '@/data/fighters';

export const useBattle = () => {
  const [battleState, setBattleState] = useState<BattleState | null>(null);

  const startBattle = useCallback((playerFighter: FruitFighter, isBot: boolean) => {
    const opponentFighter = getRandomFighter();
    
    setBattleState({
      player: {
        fighter: playerFighter,
        currentHealth: playerFighter.maxHealth,
        energy: 0,
      },
      opponent: {
        fighter: opponentFighter,
        currentHealth: opponentFighter.maxHealth,
        energy: 0,
        isBot,
      },
      turn: 'player',
      battleLog: [`Battle started! ${playerFighter.name} vs ${opponentFighter.name}!`],
      isActive: true,
      winner: null,
    });
  }, []);

  const calculateDamage = (attacker: FruitFighter, defender: FruitFighter, isSpecial: boolean): number => {
    const baseDamage = attacker.attack + (isSpecial ? 20 : 0);
    const reduction = defender.defense * 0.5;
    const variance = Math.random() * 10 - 5;
    return Math.max(5, Math.floor(baseDamage - reduction + variance));
  };

  const addLogEntry = (message: string) => {
    setBattleState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        battleLog: [...prev.battleLog, message],
      };
    });
  };

  const checkWinner = (playerHealth: number, opponentHealth: number): 'player' | 'opponent' | null => {
    if (playerHealth <= 0) return 'opponent';
    if (opponentHealth <= 0) return 'player';
    return null;
  };

  const botTurn = useCallback(() => {
    setTimeout(() => {
      setBattleState(prev => {
        if (!prev || prev.winner) return prev;

        const actions = ['attack', 'defend', 'special'];
        const action = prev.opponent.energy >= 50 
          ? actions[Math.floor(Math.random() * 3)]
          : actions[Math.floor(Math.random() * 2)];

        let newPlayerHealth = prev.player.currentHealth;
        let newOpponentEnergy = prev.opponent.energy;
        let log = '';

        if (action === 'attack') {
          const damage = calculateDamage(prev.opponent.fighter, prev.player.fighter, false);
          newPlayerHealth = Math.max(0, prev.player.currentHealth - damage);
          log = `${prev.opponent.fighter.name} attacks for ${damage} damage!`;
        } else if (action === 'defend') {
          newOpponentEnergy = Math.min(100, prev.opponent.energy + 20);
          log = `${prev.opponent.fighter.name} defends and gains energy!`;
        } else {
          const damage = calculateDamage(prev.opponent.fighter, prev.player.fighter, true);
          newPlayerHealth = Math.max(0, prev.player.currentHealth - damage);
          newOpponentEnergy = prev.opponent.energy - 50;
          log = `${prev.opponent.fighter.name} uses ${prev.opponent.fighter.ability} for ${damage} damage!`;
        }

        const winner = checkWinner(newPlayerHealth, prev.opponent.currentHealth);

        return {
          ...prev,
          player: {
            ...prev.player,
            currentHealth: newPlayerHealth,
          },
          opponent: {
            ...prev.opponent,
            energy: newOpponentEnergy,
          },
          turn: 'player',
          battleLog: [...prev.battleLog, log],
          winner,
        };
      });
    }, 1500);
  }, []);

  const playerAttack = useCallback(() => {
    setBattleState(prev => {
      if (!prev || prev.turn !== 'player' || prev.winner) return prev;

      const damage = calculateDamage(prev.player.fighter, prev.opponent.fighter, false);
      const newOpponentHealth = Math.max(0, prev.opponent.currentHealth - damage);
      const winner = checkWinner(prev.player.currentHealth, newOpponentHealth);

      const newState = {
        ...prev,
        opponent: {
          ...prev.opponent,
          currentHealth: newOpponentHealth,
        },
        player: {
          ...prev.player,
          energy: Math.min(100, prev.player.energy + 15),
        },
        turn: winner ? prev.turn : 'opponent' as const,
        battleLog: [...prev.battleLog, `${prev.player.fighter.name} attacks for ${damage} damage!`],
        winner,
      };

      if (!winner && prev.opponent.isBot) {
        botTurn();
      }

      return newState;
    });
  }, [botTurn]);

  const playerDefend = useCallback(() => {
    setBattleState(prev => {
      if (!prev || prev.turn !== 'player' || prev.winner) return prev;

      const newState = {
        ...prev,
        player: {
          ...prev.player,
          energy: Math.min(100, prev.player.energy + 30),
        },
        turn: 'opponent' as const,
        battleLog: [...prev.battleLog, `${prev.player.fighter.name} defends and charges energy!`],
      };

      if (prev.opponent.isBot) {
        botTurn();
      }

      return newState;
    });
  }, [botTurn]);

  const playerSpecial = useCallback(() => {
    setBattleState(prev => {
      if (!prev || prev.turn !== 'player' || prev.player.energy < 50 || prev.winner) return prev;

      const damage = calculateDamage(prev.player.fighter, prev.opponent.fighter, true);
      const newOpponentHealth = Math.max(0, prev.opponent.currentHealth - damage);
      const winner = checkWinner(prev.player.currentHealth, newOpponentHealth);

      const newState = {
        ...prev,
        opponent: {
          ...prev.opponent,
          currentHealth: newOpponentHealth,
        },
        player: {
          ...prev.player,
          energy: prev.player.energy - 50,
        },
        turn: winner ? prev.turn : 'opponent' as const,
        battleLog: [...prev.battleLog, `${prev.player.fighter.name} uses ${prev.player.fighter.ability} for ${damage} damage!`],
        winner,
      };

      if (!winner && prev.opponent.isBot) {
        botTurn();
      }

      return newState;
    });
  }, [botTurn]);

  const restartBattle = useCallback(() => {
    if (battleState) {
      startBattle(battleState.player.fighter, battleState.opponent.isBot);
    }
  }, [battleState, startBattle]);

  return {
    battleState,
    startBattle,
    playerAttack,
    playerDefend,
    playerSpecial,
    restartBattle,
  };
};
