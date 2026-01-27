import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LobbyScreen } from '@/components/screens/LobbyScreen';
import { FightersScreen } from '@/components/screens/FightersScreen';
import { ModeSelectScreen } from '@/components/screens/ModeSelectScreen';
import { TeamSelectScreen } from '@/components/screens/TeamSelectScreen';
import { BattleScreen } from '@/components/screens/BattleScreen';
import { SettingsScreen } from '@/components/screens/SettingsScreen';
import { MultiplayerScreen } from '@/components/screens/MultiplayerScreen';
import { LevelUpNotification } from '@/components/LevelUpNotification';
import { useBattle } from '@/hooks/useBattle';
import { useMultiplayerMatch } from '@/hooks/useMultiplayerMatch';
import { useAuth } from '@/hooks/useAuth';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';
import { Player, GameScreen, FruitFighter } from '@/types/game';
import { calculateLevel } from '@/components/LevelProgress';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, updateProfile, signOut } = useAuth();
  
  // Track presence at app level - players will show as online in all screens
  const { onlinePlayers, loading: playersLoading, refresh: refreshPlayers } = useOnlinePresence();
  
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('lobby');
  const [isVsBot, setIsVsBot] = useState(true);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [levelUpNotification, setLevelUpNotification] = useState<number | null>(null);
  const multiplayerOpponentRef = useRef<{ id: string; name: string } | null>(null);
  
  const [player, setPlayer] = useState<Player>({
    id: 'player-1',
    name: 'Champion',
    trophies: 0,
    level: 1,
    totalWins: 0,
    selectedTeam: [],
    fighters: [],
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Sync player state with profile
  useEffect(() => {
    if (profile) {
      setPlayer(prev => ({
        ...prev,
        id: profile.user_id,
        name: profile.name,
        level: profile.level,
        totalWins: profile.total_wins,
      }));
    }
  }, [profile]);

  const { 
    battleState, 
    startBattle, 
    proceedFromCoinToss,
    selectFighter,
    useAbility,
    defendWithFighter,
    skipDefense,
    restartBattle 
  } = useBattle();

  // Multiplayer match hook
  const {
    match: multiplayerMatch,
    battleState: multiplayerBattleState,
    isMyTurn,
    isBeingAttacked,
    joinMatch,
    submitTeam,
    selectFighter: mpSelectFighter,
    useAbility: mpUseAbility,
    defendWithFighter: mpDefendWithFighter,
    skipDefense: mpSkipDefense,
    proceedFromCoinToss: mpProceedFromCoinToss,
    leaveMatch,
    bothReady,
  } = useMultiplayerMatch();

  const handleStartModeSelect = useCallback((vsBot: boolean) => {
    setIsVsBot(vsBot);
    setCurrentScreen('team-select');
  }, []);

  const handleStartMultiplayerMatch = useCallback(async (opponentId: string, opponentName: string) => {
    // Store opponent info for multiplayer
    multiplayerOpponentRef.current = { id: opponentId, name: opponentName };
    setIsMultiplayer(true);
    setIsVsBot(false);
    
    // Join or create the match
    await joinMatch(opponentId, opponentName);
    
    setCurrentScreen('team-select');
  }, [joinMatch]);

  const handleTeamSelected = useCallback(async (team: FruitFighter[]) => {
    setPlayer(prev => ({
      ...prev,
      selectedTeam: team,
    }));
    
    if (isMultiplayer) {
      // Submit team to multiplayer match
      await submitTeam(team);
      setCurrentScreen('battle');
    } else {
      // Start bot battle
      startBattle(team, isVsBot);
      setCurrentScreen('battle');
    }
  }, [isVsBot, isMultiplayer, startBattle, submitTeam]);

  const handleNavigate = useCallback((screen: GameScreen) => {
    // Reset multiplayer state when navigating away from battle
    if (screen === 'lobby' || screen === 'mode-select') {
      setIsMultiplayer(false);
      multiplayerOpponentRef.current = null;
    }
    setCurrentScreen(screen);
  }, []);

  const handleVictory = useCallback(async () => {
    const newTotalWins = player.totalWins + 1;
    const oldLevel = player.level;
    const newLevel = calculateLevel(newTotalWins);
    
    // Update local state
    setPlayer(prev => ({
      ...prev,
      totalWins: newTotalWins,
      level: newLevel,
    }));

    // Show level up notification if level increased
    if (newLevel > oldLevel) {
      setLevelUpNotification(newLevel);
    }

    // Update database
    await updateProfile({
      total_wins: newTotalWins,
      level: newLevel,
    });
  }, [player.totalWins, player.level, updateProfile]);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/auth', { replace: true });
  }, [signOut, navigate]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-game-heading">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Level Up Notification */}
      {levelUpNotification !== null && (
        <LevelUpNotification
          newLevel={levelUpNotification}
          onClose={() => setLevelUpNotification(null)}
        />
      )}

      {/* Animated background stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>


      {/* Screen content */}
      <div className="relative z-10">
        {currentScreen === 'lobby' && (
          <LobbyScreen 
            player={player} 
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )}
        
        {currentScreen === 'fighters' && (
          <FightersScreen
            onNavigate={handleNavigate}
          />
        )}
        
        {currentScreen === 'mode-select' && (
          <ModeSelectScreen
            onStartBattle={handleStartModeSelect}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'team-select' && (
          <TeamSelectScreen
            onTeamSelected={handleTeamSelected}
            onNavigate={handleNavigate}
          />
        )}
        
        {currentScreen === 'battle' && (isMultiplayer ? multiplayerBattleState : battleState) && (
          <BattleScreen
            battleState={(isMultiplayer ? multiplayerBattleState : battleState)!}
            onProceedFromCoinToss={isMultiplayer ? mpProceedFromCoinToss : proceedFromCoinToss}
            onSelectFighter={isMultiplayer ? mpSelectFighter : selectFighter}
            onUseAbility={isMultiplayer ? mpUseAbility : useAbility}
            onDefend={isMultiplayer ? mpDefendWithFighter : defendWithFighter}
            onSkipDefense={isMultiplayer ? mpSkipDefense : skipDefense}
            onNavigate={handleNavigate}
            onRestart={isMultiplayer ? undefined : restartBattle}
            onVictory={handleVictory}
            isMultiplayer={isMultiplayer}
            isMyTurn={isMyTurn}
            isBeingAttacked={isMultiplayer ? isBeingAttacked : undefined}
            opponentName={multiplayerOpponentRef.current?.name}
            waitingForOpponent={isMultiplayer && multiplayerMatch && !bothReady}
          />
        )}

        {currentScreen === 'multiplayer' && (
          <MultiplayerScreen 
            onNavigate={handleNavigate}
            onStartMultiplayerMatch={handleStartMultiplayerMatch}
            onlinePlayers={onlinePlayers}
            playersLoading={playersLoading}
            refreshPlayers={refreshPlayers}
          />
        )}
        
        {currentScreen === 'settings' && (
          <SettingsScreen onNavigate={handleNavigate} />
        )}
      </div>
    </div>
  );
};

export default Index;
