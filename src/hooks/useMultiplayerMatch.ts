import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { FruitFighter, TeamMember, BattleState, PendingAttack } from '@/types/game';
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

const createTeamMember = (fighter: FruitFighter): TeamMember => ({
  fighter: { ...fighter, currentHealth: fighter.maxHealth, isAlive: true },
  currentHealth: fighter.maxHealth,
  isAlive: true,
  cooldowns: {},
});

export const useMultiplayerMatch = () => {
  const { user, profile } = useAuth();
  const [match, setMatch] = useState<ActiveMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isPlayer1 = match && user ? match.player1_id === user.id : false;
  const isMyTurn = battleState && match && user ? 
    (battleState.turn === 'player' && isPlayer1) || (battleState.turn === 'opponent' && !isPlayer1) : false;

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
        if (matchData.battle_state) {
          setBattleState(matchData.battle_state);
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
    if (!matchData.player1_team || !matchData.player2_team) return;
    
    const coinToss = Math.random() > 0.5 ? matchData.player1_id : matchData.player2_id;
    const isP1 = user?.id === matchData.player1_id;
    
    const newBattleState: BattleState = {
      player: {
        team: (isP1 ? matchData.player1_team : matchData.player2_team).map(createTeamMember),
        score: 0,
        isBot: false,
      },
      opponent: {
        team: (isP1 ? matchData.player2_team : matchData.player1_team).map(createTeamMember),
        score: 0,
        isBot: false,
      },
      turn: coinToss === (isP1 ? matchData.player1_id : matchData.player2_id) ? 'player' : 'opponent',
      phase: 'coin_toss',
      coinTossWinner: coinToss === (isP1 ? matchData.player1_id : matchData.player2_id) ? 'player' : 'opponent',
      pendingAttack: null,
      battleLog: [`Coin toss! ${coinToss === matchData.player1_id ? matchData.player1_name : matchData.player2_name} goes first!`],
      winner: null,
      selectedFighterIndex: null,
    };

    // Only player1 should update the initial state to avoid race conditions
    if (isP1) {
      try {
        await supabase
          .from('active_matches')
          .update({ 
            battle_state: newBattleState as unknown as Json,
            current_turn: coinToss,
            status: 'battling'
          })
          .eq('id', matchData.id);
      } catch (err) {
        console.error('Error initializing battle:', err);
      }
    }
  }, [user]);

  // Update battle state in database
  const syncBattleState = useCallback(async (newState: BattleState) => {
    if (!match) return;

    try {
      await supabase
        .from('active_matches')
        .update({ 
          battle_state: newState as unknown as Json,
          current_turn: newState.turn === 'player' ? 
            (isPlayer1 ? match.player1_id : match.player2_id) : 
            (isPlayer1 ? match.player2_id : match.player1_id),
          status: newState.winner ? 'finished' : 'battling',
          winner_id: newState.winner ? 
            (newState.winner === 'player' ? 
              (isPlayer1 ? match.player1_id : match.player2_id) : 
              (isPlayer1 ? match.player2_id : match.player1_id)) : null
        })
        .eq('id', match.id);
    } catch (err) {
      console.error('Error syncing battle state:', err);
    }
  }, [match, isPlayer1]);

  // Select fighter
  const selectFighter = useCallback((index: number) => {
    setBattleState(prev => {
      if (!prev || prev.phase !== 'select_action' || !isMyTurn) return prev;
      return { ...prev, selectedFighterIndex: index };
    });
  }, [isMyTurn]);

  // Use ability - send to opponent for defense choice
  const useAbility = useCallback(async (abilityIndex: number, targetIndex: number) => {
    if (!battleState || battleState.selectedFighterIndex === null || !isMyTurn || !match) return;

    const attackerMember = battleState.player.team[battleState.selectedFighterIndex];
    const ability = attackerMember.fighter.abilities[abilityIndex];
    const targetMember = battleState.opponent.team[targetIndex];

    if (!attackerMember.isAlive || !targetMember.isAlive) return;

    if (ability.type === 'defense') {
      // Defense ability - apply shield locally then sync
      const newPlayerTeam = [...battleState.player.team];
      newPlayerTeam[battleState.selectedFighterIndex] = {
        ...attackerMember,
        fighter: { ...attackerMember.fighter, hasShield: true },
      };
      
      const newState: BattleState = {
        ...battleState,
        player: { ...battleState.player, team: newPlayerTeam },
        turn: battleState.turn === 'player' ? 'opponent' : 'player',
        phase: 'select_action',
        selectedFighterIndex: null,
        battleLog: [...battleState.battleLog, `${attackerMember.fighter.name} uses ${ability.name}!`],
      };
      
      setBattleState(newState);
      await syncBattleState(newState);
      return;
    }

    // Attack - create pending attack and notify opponent
    const pendingAttack: PendingAttack = {
      attacker: attackerMember,
      target: targetMember,
      ability,
      attackerIndex: battleState.selectedFighterIndex,
      targetIndex,
      isFromBot: false,
    };

    const newState: BattleState = {
      ...battleState,
      pendingAttack,
      phase: 'defense_choice',
      battleLog: [...battleState.battleLog, `${attackerMember.fighter.name} attacks ${targetMember.fighter.name} with ${ability.name}!`],
    };

    setBattleState(newState);
    await syncBattleState(newState);
  }, [battleState, isMyTurn, match, syncBattleState]);

  // Execute attack with optional defender
  const executeAttack = useCallback((state: BattleState, defenderIndex?: number): BattleState => {
    if (!state.pendingAttack) return state;

    const { attacker, target, ability, targetIndex, attackerIndex } = state.pendingAttack;
    const POINTS_FOR_DAMAGE = 1;
    const POINTS_FOR_KILL = 2;
    const WINNING_SCORE = 15;

    // Determine who is attacking whom based on current perspective
    let targetTeam = [...state.opponent.team];
    let attackerTeam = [...state.player.team];
    let attackerScore = state.player.score;
    let defenderScore = state.opponent.score;

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

    const winner = attackerScore >= WINNING_SCORE ? 'player' : 
                   defenderScore >= WINNING_SCORE ? 'opponent' : null;
    const nextTurn = winner ? state.turn : (state.turn === 'player' ? 'opponent' : 'player');

    return {
      ...state,
      player: { ...state.player, team: attackerTeam, score: attackerScore },
      opponent: { ...state.opponent, team: targetTeam, score: defenderScore },
      turn: nextTurn,
      phase: winner ? 'game_over' : 'select_action',
      pendingAttack: null,
      selectedFighterIndex: null,
      battleLog: [...state.battleLog, ...logs],
      winner,
    };
  }, []);

  // Defend with fighter
  const defendWithFighter = useCallback(async (defenderIndex: number | null) => {
    if (!battleState || !battleState.pendingAttack) return;
    
    const newState = executeAttack(battleState, defenderIndex ?? undefined);
    setBattleState(newState);
    await syncBattleState(newState);
  }, [battleState, executeAttack, syncBattleState]);

  // Skip defense
  const skipDefense = useCallback(async () => {
    if (!battleState || !battleState.pendingAttack) return;
    
    const newState = executeAttack(battleState);
    setBattleState(newState);
    await syncBattleState(newState);
  }, [battleState, executeAttack, syncBattleState]);

  // Proceed from coin toss
  const proceedFromCoinToss = useCallback(async () => {
    if (!battleState) return;
    
    const newState = { ...battleState, phase: 'select_action' as const };
    setBattleState(newState);
    await syncBattleState(newState);
  }, [battleState, syncBattleState]);

  // Subscribe to match updates
  useEffect(() => {
    if (!match) return;

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
          
          // Sync battle state from opponent's perspective
          if (updated.battle_state && user) {
            const isP1 = updated.player1_id === user.id;
            const remoteState = updated.battle_state as BattleState;
            
            // Transform the state to our perspective
            const myState: BattleState = {
              ...remoteState,
              // Keep our local view - player is always "us", opponent is "them"
              // The remote state stores from player1's perspective, so we need to flip if we're player2
            };
            
            setBattleState(myState);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match, user, initializeBattle]);

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
  }, [match]);

  return {
    match,
    battleState,
    loading,
    isPlayer1,
    isMyTurn,
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

