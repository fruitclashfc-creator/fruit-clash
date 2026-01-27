import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { FruitFighter, TeamMember, BattleState, PendingAttack, Ability } from '@/types/game';
import { Json } from '@/integrations/supabase/types';

interface ActiveMatch {
  id: string;
  player1_id: string;
  player1_name: string;
  player2_id: string;
  player2_name: string;
  player1_team: FruitFighter[] | null;
  player2_team: FruitFighter[] | null;
  player1_ready: boolean;
  player2_ready: boolean;
  current_turn: string | null;
  battle_state: BattleState | null;
  pending_action: MultiplayerAction | null;
  status: 'waiting_teams' | 'ready' | 'battling' | 'finished';
  winner_id: string | null;
  created_at: string;
  updated_at: string;
}

interface MultiplayerAction {
  type: 'attack' | 'defend' | 'skip_defense';
  playerId: string;
  fighterIndex?: number;
  abilityIndex?: number;
  targetIndex?: number;
  defenderIndex?: number | null;
}

// Database state is always stored from player1's perspective
// We transform it to each player's local view
interface DbBattleState {
  player1Team: TeamMember[];
  player2Team: TeamMember[];
  player1Score: number;
  player2Score: number;
  currentTurnPlayerId: string;
  phase: 'coin_toss' | 'select_action' | 'defense_choice' | 'executing' | 'game_over';
  coinTossWinnerId: string | null;
  pendingAttack: {
    attackerPlayerId: string;
    attacker: TeamMember;
    targetPlayerId: string;
    target: TeamMember;
    ability: Ability;
    attackerIndex: number;
    targetIndex: number;
  } | null;
  battleLog: string[];
  winnerId: string | null;
  selectedFighterIndex: number | null;
}

const POINTS_FOR_DAMAGE = 1;
const POINTS_FOR_KILL = 2;
const WINNING_SCORE = 15;

const createTeamMember = (fighter: FruitFighter): TeamMember => ({
  fighter: { ...fighter, currentHealth: fighter.maxHealth, isAlive: true },
  currentHealth: fighter.maxHealth,
  isAlive: true,
  cooldowns: {},
});

// Transform DB state to local player's view
const transformToLocalView = (dbState: DbBattleState, match: ActiveMatch, userId: string): BattleState => {
  const isPlayer1 = userId === match.player1_id;
  
  // For local view: "player" is always "me", "opponent" is always "them"
  const myTeam = isPlayer1 ? dbState.player1Team : dbState.player2Team;
  const theirTeam = isPlayer1 ? dbState.player2Team : dbState.player1Team;
  const myScore = isPlayer1 ? dbState.player1Score : dbState.player2Score;
  const theirScore = isPlayer1 ? dbState.player2Score : dbState.player1Score;
  
  // Transform turn to local perspective
  const isMyTurn = dbState.currentTurnPlayerId === userId;
  const turn = isMyTurn ? 'player' : 'opponent';
  
  // Transform winner to local perspective
  let winner: 'player' | 'opponent' | null = null;
  if (dbState.winnerId) {
    winner = dbState.winnerId === userId ? 'player' : 'opponent';
  }
  
  // Transform coin toss winner
  let coinTossWinner: 'player' | 'opponent' | null = null;
  if (dbState.coinTossWinnerId) {
    coinTossWinner = dbState.coinTossWinnerId === userId ? 'player' : 'opponent';
  }
  
  // Transform pending attack to local perspective
  let pendingAttack: PendingAttack | null = null;
  if (dbState.pendingAttack) {
    const attackerIsMe = dbState.pendingAttack.attackerPlayerId === userId;
    pendingAttack = {
      attacker: dbState.pendingAttack.attacker,
      target: dbState.pendingAttack.target,
      ability: dbState.pendingAttack.ability,
      attackerIndex: dbState.pendingAttack.attackerIndex,
      targetIndex: dbState.pendingAttack.targetIndex,
      isFromBot: !attackerIsMe, // "isFromBot" means "from opponent" in our local view
    };
  }
  
  return {
    player: {
      team: myTeam,
      score: myScore,
      isBot: false,
    },
    opponent: {
      team: theirTeam,
      score: theirScore,
      isBot: false,
    },
    turn,
    phase: dbState.phase,
    coinTossWinner,
    pendingAttack,
    battleLog: dbState.battleLog,
    winner,
    selectedFighterIndex: isMyTurn ? dbState.selectedFighterIndex : null,
  };
};

// Transform local view back to DB state
const transformToDbState = (
  localState: BattleState, 
  match: ActiveMatch, 
  userId: string,
  selectedFighterIndex: number | null
): DbBattleState => {
  const isPlayer1 = userId === match.player1_id;
  
  return {
    player1Team: isPlayer1 ? localState.player.team : localState.opponent.team,
    player2Team: isPlayer1 ? localState.opponent.team : localState.player.team,
    player1Score: isPlayer1 ? localState.player.score : localState.opponent.score,
    player2Score: isPlayer1 ? localState.opponent.score : localState.player.score,
    currentTurnPlayerId: localState.turn === 'player' 
      ? userId 
      : (isPlayer1 ? match.player2_id : match.player1_id),
    phase: localState.phase,
    coinTossWinnerId: localState.coinTossWinner 
      ? (localState.coinTossWinner === 'player' ? userId : (isPlayer1 ? match.player2_id : match.player1_id))
      : null,
    pendingAttack: localState.pendingAttack ? {
      attackerPlayerId: localState.pendingAttack.isFromBot 
        ? (isPlayer1 ? match.player2_id : match.player1_id) 
        : userId,
      attacker: localState.pendingAttack.attacker,
      targetPlayerId: localState.pendingAttack.isFromBot 
        ? userId 
        : (isPlayer1 ? match.player2_id : match.player1_id),
      target: localState.pendingAttack.target,
      ability: localState.pendingAttack.ability,
      attackerIndex: localState.pendingAttack.attackerIndex,
      targetIndex: localState.pendingAttack.targetIndex,
    } : null,
    battleLog: localState.battleLog,
    winnerId: localState.winner 
      ? (localState.winner === 'player' ? userId : (isPlayer1 ? match.player2_id : match.player1_id))
      : null,
    selectedFighterIndex,
  };
};

export const useMultiplayerMatch = () => {
  const { user, profile } = useAuth();
  const [match, setMatch] = useState<ActiveMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [localSelectedIndex, setLocalSelectedIndex] = useState<number | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isPlayer1 = match && user ? match.player1_id === user.id : false;
  
  // Determine if it's my turn based on current_turn matching my user id
  const isMyTurn = match && user ? match.current_turn === user.id : false;
  
  // Determine if I should see the defense popup
  // I see defense popup when there's a pending attack targeting ME
  const isBeingAttacked = battleState?.pendingAttack?.isFromBot === true; // "isFromBot" means "from opponent"

  // Create a new match when invitation is accepted
  const createMatch = useCallback(async (opponentId: string, opponentName: string) => {
    if (!user || !profile) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('active_matches')
        .insert({
          player1_id: user.id,
          player1_name: profile.name,
          player2_id: opponentId,
          player2_name: opponentName,
        })
        .select()
        .single();

      if (error) throw error;
      
      const matchData = data as unknown as ActiveMatch;
      setMatch(matchData);
      return matchData;
    } catch (err) {
      console.error('Error creating match:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Find existing match with opponent
  const findMatch = useCallback(async (opponentId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('active_matches')
        .select('*')
        .or(`and(player1_id.eq.${user.id},player2_id.eq.${opponentId}),and(player1_id.eq.${opponentId},player2_id.eq.${user.id})`)
        .neq('status', 'finished')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const matchData = data as unknown as ActiveMatch;
        setMatch(matchData);
        
        // Load existing battle state immediately if it exists
        if (matchData.battle_state) {
          const dbState = matchData.battle_state as unknown as DbBattleState;
          const localState = transformToLocalView(dbState, matchData, user.id);
          setBattleState(localState);
        }
        
        return matchData;
      }
      return null;
    } catch (err) {
      console.error('Error finding match:', err);
      return null;
    }
  }, [user]);

  // Join or create match
  const joinMatch = useCallback(async (opponentId: string, opponentName: string) => {
    const existing = await findMatch(opponentId);
    if (existing) return existing;
    return createMatch(opponentId, opponentName);
  }, [findMatch, createMatch]);

  // Submit team selection
  const submitTeam = useCallback(async (team: FruitFighter[]) => {
    if (!match || !user) return false;

    const isP1 = match.player1_id === user.id;
    const updateData = isP1 
      ? { player1_team: team as unknown as Json, player1_ready: true }
      : { player2_team: team as unknown as Json, player2_ready: true };

    try {
      const { error } = await supabase
        .from('active_matches')
        .update(updateData)
        .eq('id', match.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error submitting team:', err);
      return false;
    }
  }, [match, user]);

  // Initialize battle when both players are ready
  const initializeBattle = useCallback(async (matchData: ActiveMatch) => {
    if (!matchData.player1_team || !matchData.player2_team || !user) return;
    
    const coinTossWinnerId = Math.random() > 0.5 ? matchData.player1_id : matchData.player2_id;
    const coinTossWinnerName = coinTossWinnerId === matchData.player1_id 
      ? matchData.player1_name 
      : matchData.player2_name;
    
    const dbState: DbBattleState = {
      player1Team: matchData.player1_team.map(createTeamMember),
      player2Team: matchData.player2_team.map(createTeamMember),
      player1Score: 0,
      player2Score: 0,
      currentTurnPlayerId: coinTossWinnerId,
      phase: 'coin_toss',
      coinTossWinnerId,
      pendingAttack: null,
      battleLog: [`Coin toss! ${coinTossWinnerName} goes first!`],
      winnerId: null,
      selectedFighterIndex: null,
    };

    // Only player1 should update to avoid race conditions
    if (matchData.player1_id === user.id) {
      try {
        await supabase
          .from('active_matches')
          .update({ 
            battle_state: dbState as unknown as Json,
            current_turn: coinTossWinnerId,
            status: 'battling'
          })
          .eq('id', matchData.id);
      } catch (err) {
        console.error('Error initializing battle:', err);
      }
    }
  }, [user]);

  // Update battle state in database
  const syncBattleState = useCallback(async (newLocalState: BattleState) => {
    if (!match || !user) return;

    const dbState = transformToDbState(newLocalState, match, user.id, localSelectedIndex);
    
    try {
      await supabase
        .from('active_matches')
        .update({ 
          battle_state: dbState as unknown as Json,
          current_turn: dbState.currentTurnPlayerId,
          status: dbState.winnerId ? 'finished' : 'battling',
          winner_id: dbState.winnerId
        })
        .eq('id', match.id);
    } catch (err) {
      console.error('Error syncing battle state:', err);
    }
  }, [match, user, localSelectedIndex]);

  // Select fighter (local only until ability is used)
  const selectFighter = useCallback((index: number) => {
    if (!isMyTurn || battleState?.phase !== 'select_action') return;
    
    setLocalSelectedIndex(index);
    setBattleState(prev => {
      if (!prev) return prev;
      return { ...prev, selectedFighterIndex: index };
    });
  }, [isMyTurn, battleState?.phase]);

  // Use ability - creates pending attack
  const useAbility = useCallback(async (abilityIndex: number, targetIndex: number) => {
    if (!battleState || localSelectedIndex === null || !isMyTurn || !match || !user) return;

    const attackerMember = battleState.player.team[localSelectedIndex];
    const ability = attackerMember.fighter.abilities[abilityIndex];
    const targetMember = battleState.opponent.team[targetIndex];

    if (!attackerMember.isAlive || !targetMember.isAlive) return;

    if (ability.type === 'defense') {
      // Defense ability - apply shield and switch turns
      const newPlayerTeam = [...battleState.player.team];
      newPlayerTeam[localSelectedIndex] = {
        ...attackerMember,
        fighter: { ...attackerMember.fighter, hasShield: true },
      };
      
      const newState: BattleState = {
        ...battleState,
        player: { ...battleState.player, team: newPlayerTeam },
        turn: 'opponent',
        phase: 'select_action',
        selectedFighterIndex: null,
        battleLog: [...battleState.battleLog, `${attackerMember.fighter.name} uses ${ability.name}!`],
      };
      
      setLocalSelectedIndex(null);
      setBattleState(newState);
      await syncBattleState(newState);
      return;
    }

    // Attack - create pending attack (opponent needs to decide defense)
    const pendingAttack: PendingAttack = {
      attacker: attackerMember,
      target: targetMember,
      ability,
      attackerIndex: localSelectedIndex,
      targetIndex,
      isFromBot: false, // This attack is FROM me (not from opponent)
    };

    const newState: BattleState = {
      ...battleState,
      pendingAttack,
      phase: 'defense_choice',
      battleLog: [...battleState.battleLog, `${attackerMember.fighter.name} attacks ${targetMember.fighter.name} with ${ability.name}!`],
    };

    setLocalSelectedIndex(null);
    setBattleState(newState);
    await syncBattleState(newState);
  }, [battleState, localSelectedIndex, isMyTurn, match, user, syncBattleState]);

  // Execute attack resolution
  const executeAttack = useCallback((state: BattleState, defenderIndex?: number): BattleState => {
    if (!state.pendingAttack) return state;

    const { attacker, target, ability, targetIndex, attackerIndex, isFromBot } = state.pendingAttack;
    
    // isFromBot means "from opponent's perspective" - they attacked us
    const attackerIsOpponent = isFromBot;
    
    // The teams to modify
    const targetTeam = attackerIsOpponent ? [...state.player.team] : [...state.opponent.team];
    const attackerTeam = attackerIsOpponent ? [...state.opponent.team] : [...state.player.team];
    
    let attackerScore = attackerIsOpponent ? state.opponent.score : state.player.score;
    let defenderScore = attackerIsOpponent ? state.player.score : state.opponent.score;

    const logs: string[] = [];

    // Calculate damage
    const damage = ability.damage;
    const defense = target.fighter.defense;
    const actualDamage = Math.max(5, damage - Math.floor(defense * 0.3) + Math.floor(Math.random() * 10 - 5));

    // Check for defense
    const hasDefense = target.fighter.hasShield || defenderIndex !== undefined;
    const finalDamage = hasDefense ? 0 : actualDamage;

    const newHealth = Math.max(0, target.currentHealth - finalDamage);
    const wasKilled = newHealth === 0 && target.isAlive;

    targetTeam[targetIndex] = {
      ...target,
      currentHealth: newHealth,
      isAlive: newHealth > 0,
      fighter: { ...target.fighter, currentHealth: newHealth, isAlive: newHealth > 0, hasShield: false },
    };

    if (finalDamage > 0) attackerScore += POINTS_FOR_DAMAGE;
    if (wasKilled) attackerScore += POINTS_FOR_KILL;

    let log = `${attacker.fighter.name} uses ${ability.name} on ${target.fighter.name} for ${finalDamage} damage!`;
    if (hasDefense) log = `🛡️ Defended! ` + log;
    if (wasKilled) log += ` ${target.fighter.name} was defeated!`;
    logs.push(log);

    // Check winner
    const attackerWins = attackerScore >= WINNING_SCORE;
    const defenderWins = defenderScore >= WINNING_SCORE;
    
    let winner: 'player' | 'opponent' | null = null;
    if (attackerWins) {
      winner = attackerIsOpponent ? 'opponent' : 'player';
    } else if (defenderWins) {
      winner = attackerIsOpponent ? 'player' : 'opponent';
    }

    // Switch turns - after attack resolves, it's the defender's turn
    const nextTurn = winner ? state.turn : (attackerIsOpponent ? 'player' : 'opponent');

    return {
      ...state,
      player: attackerIsOpponent 
        ? { ...state.player, team: targetTeam, score: defenderScore }
        : { ...state.player, team: attackerTeam, score: attackerScore },
      opponent: attackerIsOpponent
        ? { ...state.opponent, team: attackerTeam, score: attackerScore }
        : { ...state.opponent, team: targetTeam, score: defenderScore },
      turn: nextTurn,
      phase: winner ? 'game_over' : 'select_action',
      pendingAttack: null,
      selectedFighterIndex: null,
      battleLog: [...state.battleLog, ...logs],
      winner,
    };
  }, []);

  // Defend with fighter (only defender can call this)
  const defendWithFighter = useCallback(async (defenderIndex: number | null) => {
    if (!battleState || !battleState.pendingAttack || !isBeingAttacked) return;
    
    const newState = executeAttack(battleState, defenderIndex ?? undefined);
    setBattleState(newState);
    await syncBattleState(newState);
  }, [battleState, isBeingAttacked, executeAttack, syncBattleState]);

  // Skip defense (only defender can call this)
  const skipDefense = useCallback(async () => {
    if (!battleState || !battleState.pendingAttack || !isBeingAttacked) return;
    
    const newState = executeAttack(battleState);
    setBattleState(newState);
    await syncBattleState(newState);
  }, [battleState, isBeingAttacked, executeAttack, syncBattleState]);

  // Proceed from coin toss
  const proceedFromCoinToss = useCallback(async () => {
    if (!battleState) return;
    
    const newState = { ...battleState, phase: 'select_action' as const };
    setBattleState(newState);
    await syncBattleState(newState);
  }, [battleState, syncBattleState]);

  // Subscribe to match updates
  useEffect(() => {
    if (!match || !user) return;

    // Immediately load current state if it exists
    if (match.battle_state && !battleState) {
      const dbState = match.battle_state as unknown as DbBattleState;
      const localState = transformToLocalView(dbState, match, user.id);
      setBattleState(localState);
    }

    const channel = supabase
      .channel(`match-${match.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'active_matches',
          filter: `id=eq.${match.id}`,
        },
        (payload) => {
          const updated = payload.new as unknown as ActiveMatch;
          setMatch(updated);
          
          // Check if both players are ready and battle not started
          if (updated.player1_ready && updated.player2_ready && !updated.battle_state) {
            initializeBattle(updated);
          }
          
          // Transform DB state to local view
          if (updated.battle_state) {
            const dbState = updated.battle_state as unknown as DbBattleState;
            const localState = transformToLocalView(dbState, updated, user.id);
            setBattleState(localState);
          }
        }
      )
      .subscribe((status) => {
        console.log('Multiplayer channel status:', status);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match?.id, user?.id, initializeBattle, battleState]);

  // Clean up match
  const leaveMatch = useCallback(async () => {
    if (match) {
      await supabase
        .from('active_matches')
        .update({ status: 'finished' })
        .eq('id', match.id);
    }
    setMatch(null);
    setBattleState(null);
    setLocalSelectedIndex(null);
  }, [match]);

  return {
    match,
    battleState,
    loading,
    isPlayer1,
    isMyTurn,
    isBeingAttacked,
    joinMatch,
    submitTeam,
    selectFighter,
    useAbility,
    defendWithFighter,
    skipDefense,
    proceedFromCoinToss,
    leaveMatch,
    bothReady: match?.player1_ready && match?.player2_ready,
  };
};
